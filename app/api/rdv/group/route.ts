import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { toRdvRow } from '@/lib/rdv-supabase'
import type { RdvBooking, RdvCat } from '@/lib/rdv-types'
import { randomUUID } from 'crypto'
import { sendRdvEmails } from '@/lib/email'
import { sendRdvSmsClient } from '@/lib/sms'
import { isReturningClient, upsertClientRdv } from '@/lib/clients'
import { ALL_SLOTS } from '@/lib/schedule-types'
import { checkRdvAvailability } from '@/lib/rdv-availability'
import { resolveRdvSelection } from '@/lib/rdv-catalog'
import { isIsoDate, isSafePlainText, normalizeEmail, normalizePersonName, normalizePhone } from '@/lib/validation'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isBookingStartAllowed } from '@/lib/booking-time'

const VALID_CATS = ['homme', 'femme', 'enfant'] as const

function toMin(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}
function fromMin(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

interface PersonInput {
  cat: string
  svcId: string
  prestationLabel?: string
  degId?: string
  degradeLabel?: string
  opts: string[]
  optionsLabels?: string[]
  price?: number
  dur?: number
  personLabel: string
  hairStates?: string[]
}

export async function POST(req: Request) {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > 32_768) return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })

  if (!await enforceRateLimit(req, { namespace: 'rdv-group-create', limit: 3, windowSeconds: 60 })) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: {
    persons: PersonInput[]
    date: string
    startSlot: string
    nom: string
    email: string
    telephone: string
    marketingConsent?: boolean
  }
  try { body = await readJsonBody(req, 32_768) }
  catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: status === 413 ? 'Requête trop grande' : 'Requête invalide' }, { status })
  }

  const { persons, date, startSlot, nom, email, telephone } = body
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(telephone)
  const normalizedName = normalizePersonName(nom)

  // Validation globale
  if (
    !Array.isArray(persons) || persons.length < 1 || persons.length > 5 ||
    !isIsoDate(date) ||
    typeof startSlot !== 'string' || !ALL_SLOTS.includes(startSlot) ||
    !normalizedName || !normalizedEmail || !normalizedPhone
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  if (!isBookingStartAllowed(date, startSlot)) {
    return NextResponse.json({ error: 'Ce créneau est passé ou trop proche. Choisissez une heure ultérieure.' }, { status: 422 })
  }

  // Validation de chaque personne
  for (const p of persons) {
    if (
      !VALID_CATS.includes(p.cat as typeof VALID_CATS[number]) ||
      typeof p.svcId !== 'string' || p.svcId.length > 50 ||
      !Array.isArray(p.opts) ||
      !isSafePlainText(p.personLabel, 1, 50)
    ) {
      return NextResponse.json({ error: 'Données invalides (personne)' }, { status: 422 })
    }
  }

  const loyal = await isReturningClient(normalizedEmail, normalizedPhone).catch(() => false)
  const selections = persons.map(person => resolveRdvSelection({
    categorie: person.cat,
    prestation: person.svcId,
    degrade: person.degId,
    options: person.opts,
    detangling: person.hairStates?.includes('ademeler'),
    loyal,
  }))
  if (selections.some(selection => !selection)) {
    return NextResponse.json({ error: 'Prestation ou options invalides' }, { status: 422 })
  }
  const safeSelections = selections.filter((selection): selection is NonNullable<typeof selection> => Boolean(selection))

  // Calcule les créneaux séquentiels pour chaque personne
  const personSlots: string[] = []
  let cursor = toMin(startSlot)
  for (const selection of safeSelections) {
    const slotStr = fromMin(cursor)
    if (!ALL_SLOTS.includes(slotStr)) {
      return NextResponse.json({ error: 'Créneau non disponible pour une ou plusieurs personnes' }, { status: 422 })
    }
    personSlots.push(slotStr)
    cursor += Math.max(selection.totalDuration, 30)
    // Arrondir au prochain créneau de 30 min
    if (cursor % 30 !== 0) cursor = Math.ceil(cursor / 30) * 30
  }

  // Vérifie la disponibilité de tous les créneaux nécessaires
  const slotsToCheck = [...new Set(personSlots)]
  const { data: existing } = await getSupabase()
    .from('rdv_bookings')
    .select('slot, total_duration')
    .eq('date', date)
    .neq('status', 'cancelled')

  const bookedSlots = existing ?? []

  for (const s of slotsToCheck) {
    const sMin = toMin(s)
    const sEnd = sMin + 30
    const conflict = bookedSlots.some(b => {
      const bMin = toMin(b.slot)
      const bEnd = bMin + Math.max(Number(b.total_duration), 30)
      return sMin < bEnd && sEnd > bMin
    })
    if (conflict) {
      return NextResponse.json({ error: 'Un créneau est déjà pris. Choisissez une autre heure de départ.' }, { status: 409 })
    }
  }

  // Crée les enregistrements
  const availability = await checkRdvAvailability(date, safeSelections.map((selection, i) => ({ slot: personSlots[i], duration: selection.totalDuration })))
  if (!availability.ok) {
    if (availability.reason === 'error') return NextResponse.json({ error: 'Vérification des disponibilités impossible' }, { status: 500 })
    return NextResponse.json({ error: 'Un créneau n’est plus disponible. Choisissez une autre heure.' }, { status: 409 })
  }

  const groupId = randomUUID()
  const now = new Date().toISOString()
  const bookings: RdvBooking[] = persons.map((p, i) => ({
    id:             randomUUID(),
    createdAt:      now,
    nom:            normalizedName,
    email:          normalizedEmail,
    telephone:      normalizedPhone,
    categorie:      safeSelections[i].categorie as RdvCat,
    prestation:     safeSelections[i].service.id,
    prestationLabel:safeSelections[i].service.label,
    degrade:        safeSelections[i].degrade?.id,
    degradeLabel:   safeSelections[i].degrade?.label,
    options:        safeSelections[i].options.map(option => option.id),
    optionsLabels:  safeSelections[i].options.map(option => option.label),
    totalPrice:     safeSelections[i].totalPrice,
    totalDuration:  safeSelections[i].totalDuration,
    date,
    slot:           personSlots[i],
    status:         'pending',
    groupId,
    personLabel:    p.personLabel,
  }))

  const { error } = await getSupabase()
    .from('rdv_bookings')
    .insert(bookings.map(toRdvRow))

  if (error) {
    if (error.code === '23505' || error.code === '23P01') {
      return NextResponse.json({ error: 'Un créneau vient d\'être pris. Choisissez une autre heure.' }, { status: 409 })
    }
    console.error('Échec de création des rendez-vous de groupe')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Email/SMS/fiche client (non bloquants)
  const totalGroupPrice = bookings.reduce((s, b) => s + b.totalPrice, 0)
  const totalGroupDur   = bookings.reduce((s, b) => s + b.totalDuration, 0)

  const [emailResult] = await Promise.all([
    sendRdvEmails({
      nom: normalizedName, email: normalizedEmail, telephone: normalizedPhone,
      date, slot: startSlot,
      prestationLabel: bookings.map(b => `${b.personLabel} : ${b.prestationLabel}`).join(' | '),
      degradeLabel: undefined, optionsLabels: [],
      totalPrice: totalGroupPrice, totalDuration: totalGroupDur,
      categorie: bookings[0].categorie,
    }, `rdv-group:${groupId}`),
    sendRdvSmsClient({
      nom: normalizedName, telephone: normalizedPhone, date, slot: startSlot,
      prestationLabel: `Groupe de ${persons.length} personnes`,
    }),
    upsertClientRdv({
      nom: normalizedName, email: normalizedEmail, telephone: normalizedPhone,
      marketingConsent: typeof body.marketingConsent === 'boolean' ? body.marketingConsent : undefined,
    }),
  ])

  return NextResponse.json({ ok: true, groupId, emailSent: emailResult.ok }, { status: 201 })
}
