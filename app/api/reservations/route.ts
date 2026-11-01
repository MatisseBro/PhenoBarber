import { NextResponse } from 'next/server'
import { getSupabase, toRow, fromRow } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { createHash, randomUUID } from 'crypto'
import type {
  Reservation, FormulaType, PackType,
  StatutPro, ExperienceType, SpecialiteType,
} from '@/lib/types'
import { sendLocationEmails } from '@/lib/email'
import { sendLocationSmsClient } from '@/lib/sms'
import { upsertClientLocation } from '@/lib/clients'
import { calculateLocationPrice } from '@/lib/pricing'
import { isIsoDate, normalizeEmail, normalizePersonName, normalizePhone, todayInParis } from '@/lib/validation'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'

const VALID_TYPE_DURATION = ['court', 'long'] as const
const VALID_FORMULES: FormulaType[]    = ['horaire','demi-journee','journee','semaine','mois']
const VALID_PACKS: PackType[]          = ['aucun','essentiel','premium']
const VALID_STATUT: StatutPro[]        = ['auto-entrepreneur','societe','en-cours']
const VALID_EXP: ExperienceType[]      = ['0-3','3-5','5-10','10+']
const VALID_SPEC: SpecialiteType[]     = ['mixte','barber','afro','coloriste','design']

export async function POST(req: Request) {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > 32_768) {
    return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
  }

  if (!await enforceRateLimit(req, { namespace: 'location-create', limit: 3, windowSeconds: 5 * 60 })) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await readJsonBody(req, 32_768) } catch (error) {
    if (error instanceof RequestBodyError && error.status === 413) {
      return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
    }
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const {
    nom, email, telephone, typeDuration, formule, pack,
    dateDebut, dateFin, heureDebut, heureFin,
    statutPro, experience, specialites, notes,
    termsAccepted, documentsCommitment, marketingConsent,
  } = body
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = normalizePhone(telephone)
  const normalizedName = normalizePersonName(nom)
  const suppliedIdempotencyKey = req.headers.get('idempotency-key')?.trim().toLowerCase()
  if (suppliedIdempotencyKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(suppliedIdempotencyKey)) {
    return NextResponse.json({ error: 'Clé d’idempotence invalide' }, { status: 400 })
  }

  if (
    !normalizedName || !normalizedEmail || !normalizedPhone ||
    !VALID_TYPE_DURATION.includes(typeDuration as typeof VALID_TYPE_DURATION[number]) ||
    !VALID_FORMULES.includes(formule as FormulaType) ||
    !VALID_PACKS.includes(pack as PackType) ||
    !isIsoDate(dateDebut) ||
    (dateFin !== undefined && !isIsoDate(dateFin)) ||
    !VALID_STATUT.includes(statutPro as StatutPro) ||
    !VALID_EXP.includes(experience as ExperienceType) ||
    !Array.isArray(specialites)      || specialites.length === 0 ||
    !(specialites as unknown[]).every(s => VALID_SPEC.includes(s as SpecialiteType)) ||
    termsAccepted !== true || documentsCommitment !== true
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  if ((dateDebut as string) <= todayInParis()) {
    return NextResponse.json({ error: 'La date de début doit être future' }, { status: 422 })
  }

  const authoritativePrice = calculateLocationPrice({
    typeDuration: typeDuration as 'court' | 'long',
    formule: formule as FormulaType,
    pack: pack as PackType,
    dateDebut: dateDebut as string,
    dateFin: typeof dateFin === 'string' ? dateFin : undefined,
    heureDebut: typeof heureDebut === 'string' ? heureDebut : undefined,
    heureFin: typeof heureFin === 'string' ? heureFin : undefined,
  })
  if (!authoritativePrice) {
    return NextResponse.json({ error: 'Période, horaires ou formule invalides' }, { status: 422 })
  }

  const reservation: Reservation = {
    id:           randomUUID(),
    createdAt:    new Date().toISOString(),
    nom:          normalizedName,
    email:        normalizedEmail,
    telephone:    normalizedPhone,
    typeDuration: typeDuration as 'court' | 'long',
    formule:      formule as FormulaType,
    pack:         pack as PackType,
    dateDebut:    dateDebut as string,
    dateFin:      typeof dateFin   === 'string' ? dateFin   : undefined,
    heureDebut:   typeof heureDebut === 'string' ? heureDebut : undefined,
    heureFin:     typeof heureFin   === 'string' ? heureFin   : undefined,
    statutPro:    statutPro as StatutPro,
    experience:   experience as ExperienceType,
    specialites:  specialites as SpecialiteType[],
    totalHT:      authoritativePrice.totalHT,
    tva:          authoritativePrice.tva,
    totalTTC:     authoritativePrice.totalTTC,
    acompte:      authoritativePrice.acompte,
    status:       'pending',
    notes:        typeof notes === 'string' && notes.length <= 1000 ? (notes as string).trim() : undefined,
    termsAcceptedAt: new Date().toISOString(),
    documentsCommittedAt: new Date().toISOString(),
    marketingConsent: marketingConsent === true,
  }

  const idempotencyKey = suppliedIdempotencyKey ?? randomUUID()
  const requestFingerprint = createHash('sha256').update(JSON.stringify({
    nom: reservation.nom,
    email: reservation.email,
    telephone: reservation.telephone,
    typeDuration: reservation.typeDuration,
    formule: reservation.formule,
    pack: reservation.pack,
    dateDebut: reservation.dateDebut,
    dateFin: reservation.dateFin ?? null,
    heureDebut: reservation.heureDebut ?? null,
    heureFin: reservation.heureFin ?? null,
    statutPro: reservation.statutPro,
    experience: reservation.experience,
    specialites: [...reservation.specialites].sort(),
    notes: reservation.notes ?? null,
    marketingConsent: reservation.marketingConsent,
  })).digest('hex')

  const supabase = getSupabase()
  const { error } = await supabase.from('reservations').insert([{
    ...toRow(reservation),
    idempotency_key: idempotencyKey,
    request_fingerprint: requestFingerprint,
  }])
  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: lookupError } = await supabase
        .from('reservations')
        .select('request_fingerprint')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (!lookupError && existing?.request_fingerprint === requestFingerprint) {
        return NextResponse.json({ ok: true, duplicate: true, emailSent: null }, { status: 200 })
      }
      if (!lookupError && existing) {
        return NextResponse.json({ error: 'Cette clé a déjà été utilisée pour une autre demande' }, { status: 409 })
      }
    }
    console.error('Échec de création de la demande de location')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Labels pour les templates email
  const FORMULE_LABELS: Record<string, string> = {
    horaire: "À l'heure - 10 € HT", 'demi-journee': 'Demi-journée (4h) - 35 € HT',
    journee: 'Journée - 65 € HT', semaine: 'Semaine - 60 € HT / jour', mois: 'Mensuel - 55 € HT / jour',
  }
  const PACK_LABELS: Record<string, string> = {
    aucun: 'Aucun - 0 €', essentiel: 'Pack Essentiel - 20 € HT / jour', premium: 'Pack Premium - 30 € HT / jour',
  }

  const emailData = {
    nom: reservation.nom, email: reservation.email, telephone: reservation.telephone,
    formuleLabel: FORMULE_LABELS[reservation.formule] ?? reservation.formule,
    packLabel: PACK_LABELS[reservation.pack] ?? reservation.pack,
    durationDetails: '',
    dateDebut: reservation.dateDebut, dateFin: reservation.dateFin,
    heureDebut: reservation.heureDebut ?? '10:00', heureFin: reservation.heureFin ?? '18:00',
    totalHT: reservation.totalHT, tva: reservation.tva, totalTTC: reservation.totalTTC,
    acompteTaux: reservation.typeDuration === 'court' ? 0.5 : 0.25,
    acompteTTC: reservation.acompte,
    soldeTTC: reservation.totalTTC - reservation.acompte,
  }

  const [emailResult] = await Promise.all([
    sendLocationEmails(emailData, `location:${reservation.id}`),
    sendLocationSmsClient({ nom: reservation.nom, telephone: reservation.telephone, dateDebut: reservation.dateDebut, formuleLabel: emailData.formuleLabel }),
    upsertClientLocation({
      nom: reservation.nom,
      email: reservation.email,
      telephone: reservation.telephone,
      marketingConsent: reservation.marketingConsent,
    }),
  ])

  return NextResponse.json({ ok: true, duplicate: false, emailSent: emailResult.ok }, { status: 201 })
}

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)
  const { data, error } = await getSupabase()
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
    .or(`status.neq.cancelled,created_at.gte.${cutoff.toISOString()}`)
  if (error) {
    console.error('Échec de chargement des demandes de location')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json(data.map(fromRow))
}
