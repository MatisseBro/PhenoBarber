import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'
import { verifyUnsubscribeToken } from '@/lib/marketing-consent'

export async function POST(request: Request) {
  if (!await enforceRateLimit(request, { namespace: 'marketing-unsubscribe', limit: 10, windowSeconds: 60 * 60 })) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }
  let body: { token?: unknown }
  try {
    body = await readJsonBody(request, 2_048)
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: 'Requête invalide' }, { status })
  }
  const email = typeof body.token === 'string' ? verifyUnsubscribeToken(body.token) : null
  if (!email) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })

  const { error } = await getSupabase()
    .from('clients')
    .update({ marketing_consent: false, marketing_consent_at: null, updated_at: new Date().toISOString() })
    .eq('email', email)
  if (error) return NextResponse.json({ error: 'Désinscription temporairement impossible' }, { status: 503 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Confirmation requise' }, { status: 405 })
}
