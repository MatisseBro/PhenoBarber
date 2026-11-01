import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { randomBytes, createHash } from 'crypto'
import { sendClientMagicLink } from '@/lib/email'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'
import { normalizeEmail, todayInParis } from '@/lib/validation'

/* POST /api/client-auth - demande un lien de connexion */
export async function POST(req: Request) {
  if (!await enforceRateLimit(req, { namespace: 'client-auth', limit: 3, windowSeconds: 5 * 60 })) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 5 minutes.' }, { status: 429 })
  }

  let body: { email?: unknown; token?: unknown }
  try {
    body = await readJsonBody(req, 4_096)
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: status === 413 ? 'Requête trop grande' : 'Requête invalide' }, { status })
  }

  if (typeof body.token === 'string') return consumeToken(body.token)

  const email = normalizeEmail(body.email)
  if (!email) {
    return NextResponse.json({ error: 'Adresse email invalide' }, { status: 422 })
  }

  // Vérifie que l'email a au moins une réservation
  const { data: bookings, error: bookingsError } = await getSupabase()
    .from('rdv_bookings')
    .select('id')
    .eq('email', email)
    .limit(1)

  if (bookingsError) return NextResponse.json({ error: 'Service temporairement indisponible' }, { status: 503 })

  if (!bookings || bookings.length === 0) {
    // Répond toujours 200 pour ne pas révéler si l'email existe
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  // Génère un token sécurisé
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const { error } = await getSupabase().rpc('issue_client_token', {
    p_email: email,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  })

  if (error) {
    console.error('Échec de création du lien client')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // Envoie le lien par email (non bloquant)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://phenoandco.fr'
  const link = `${siteUrl.replace(/\/$/, '')}/espace-client#token=${rawToken}`
  const delivery = await sendClientMagicLink({ email, link, idempotencyKey: `client-magic:${tokenHash}` })
  if (!delivery.ok) {
    const { error: revokeError } = await getSupabase().rpc('revoke_client_token', { p_token_hash: tokenHash })
    if (revokeError) console.error('[client-auth] Échec de révocation du token non distribué')
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

async function consumeToken(rawToken: string) {
  if (!/^[0-9a-f]{64}$/.test(rawToken)) return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  const { data, error } = await getSupabase().rpc('consume_client_token', { p_token_hash: tokenHash })
  const tokenResult = Array.isArray(data) ? data[0] : data
  const email = normalizeEmail(tokenResult?.email)
  if (error || !email) {
    return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 401 })
  }

  // Récupère les réservations
  const { data: bookings, error: bookingsError } = await getSupabase()
    .from('rdv_bookings')
    .select('id, date, slot, prestation_label, degrade_label, options_labels, total_price, total_duration, status, created_at, person_label, group_id')
    .eq('email', email)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })
    .limit(50)

  if (bookingsError) {
    return NextResponse.json({ error: 'Chargement des réservations impossible' }, { status: 503 })
  }

  const today = todayInParis()
  const upcoming = (bookings ?? []).filter(b => b.date >= today)
  const past = (bookings ?? []).filter(b => b.date < today)

  return NextResponse.json({ ok: true, email, upcoming, past }, { status: 200 })
}

export async function GET() {
  return NextResponse.json({ error: 'Utilisez le formulaire de connexion pour demander un nouveau lien.' }, { status: 405 })
}
