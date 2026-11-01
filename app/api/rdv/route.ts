import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { toRdvRow, fromRdvRow } from '@/lib/rdv-supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import type { RdvBooking } from '@/lib/rdv-types'
import { randomUUID } from 'crypto'
import { sendRdvEmails } from '@/lib/email'
import { sendRdvSmsClient } from '@/lib/sms'
import { upsertClientRdv } from '@/lib/clients'
import { isReturningClient } from '@/lib/clients'

import { ALL_SLOTS } from '@/lib/schedule-types'
import { checkRdvAvailability } from '@/lib/rdv-availability'
import { resolveRdvSelection } from '@/lib/rdv-catalog'
import { isIsoDate, normalizeEmail, normalizePersonName, normalizePhone } from '@/lib/validation'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isBookingStartAllowed } from '@/lib/booking-time'

const VALID_CATS = ['homme', 'femme', 'enfant'] as const
export async function POST(req: Request) {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > 16_384) {
    return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
  }

  if (!await enforceRateLimit(req, { namespace: 'rdv-create', limit: 5, windowSeconds: 60 })) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Partial<RdvBooking> & { hairStates?: unknown; marketingConsent?: unknown }
  try { body = await readJsonBody(req, 16_384) } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: status === 413 ? 'Requête trop grande' : 'Requête invalide' }, { status })
  }

  // Validation des champs obligatoires
  const { nom, email, telephone, categorie, prestation, date, slot, options = [] } = body
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(telephone)
  const normalizedName = normalizePersonName(nom)

  if (
    !normalizedName || !normalizedEmail || !normalizedPhone ||
    !VALID_CATS.includes(categorie as typeof VALID_CATS[number]) ||
    typeof prestation !== 'string' || prestation.length > 50 ||
    !isIsoDate(date) ||
    !ALL_SLOTS.includes(slot as string) ||
    !Array.isArray(options)
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  if (!isBookingStartAllowed(date, slot as string)) {
    return NextResponse.json({ error: 'Ce créneau est passé ou trop proche. Choisissez une heure ultérieure.' }, { status: 422 })
  }

  const loyal = await isReturningClient(normalizedEmail, normalizedPhone).catch(() => false)
  const selection = resolveRdvSelection({
    categorie,
    prestation,
    degrade: body.degrade,
    options,
    detangling: Array.isArray(body.hairStates) && body.hairStates.includes('ademeler'),
    loyal,
  })
  if (!selection) return NextResponse.json({ error: 'Prestation ou options invalides' }, { status: 422 })

  // ID et données commerciales générés côté serveur
  const availability = await checkRdvAvailability(date, [{ slot: slot as string, duration: selection.totalDuration }])
  if (!availability.ok) {
    if (availability.reason === 'error') return NextResponse.json({ error: 'Vérification des disponibilités impossible' }, { status: 500 })
    return NextResponse.json({ error: 'Ce créneau n’est plus disponible. Choisissez-en un autre.' }, { status: 409 })
  }

  const booking: RdvBooking = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    nom: normalizedName,
    email: normalizedEmail,
    telephone: normalizedPhone,
    categorie: categorie as RdvBooking['categorie'],
    prestation,
    prestationLabel: selection.service.label,
    degrade: selection.degrade?.id,
    degradeLabel: selection.degrade?.label,
    options: selection.options.map(option => option.id),
    optionsLabels: selection.options.map(option => option.label),
    totalPrice: selection.totalPrice,
    totalDuration: selection.totalDuration,
    date,
    slot: slot!,
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 1200) : undefined,
    status: 'pending',
  }

  const { error } = await getSupabase()
    .from('rdv_bookings')
    .insert([toRdvRow(booking)])

  if (error) {
    if (error.code === '23505' || error.code === '23P01') {
      return NextResponse.json({ error: 'Ce créneau vient d\'être pris. Choisissez-en un autre.' }, { status: 409 })
    }
    console.error('Échec de création du rendez-vous')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Emails + SMS + fiche client (non-bloquants)
  const emailData = {
    nom: booking.nom, email: booking.email, telephone: booking.telephone,
    date: booking.date, slot: booking.slot,
    prestationLabel: booking.prestationLabel, degradeLabel: booking.degradeLabel,
    optionsLabels: booking.optionsLabels, totalPrice: booking.totalPrice,
    totalDuration: booking.totalDuration, categorie: booking.categorie,
  }
  const [emailResult] = await Promise.all([
    sendRdvEmails(emailData, `rdv:${booking.id}`),
    sendRdvSmsClient({ nom: booking.nom, telephone: booking.telephone, date: booking.date, slot: booking.slot, prestationLabel: booking.prestationLabel }),
    upsertClientRdv({
      nom: booking.nom,
      email: booking.email,
      telephone: booking.telephone,
      marketingConsent: typeof body.marketingConsent === 'boolean' ? body.marketingConsent : undefined,
    }),
  ])

  return NextResponse.json({ ok: true, emailSent: emailResult.ok, totalPrice: booking.totalPrice, totalDuration: booking.totalDuration }, { status: 201 })
}

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const { data, error } = await getSupabase()
    .from('rdv_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .or(`status.neq.cancelled,created_at.gte.${cutoff.toISOString()}`)
  if (error) {
    console.error('Échec de chargement des rendez-vous')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json(data.map(fromRdvRow))
}
