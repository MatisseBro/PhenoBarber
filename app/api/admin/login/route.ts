import { NextResponse } from 'next/server'
import { setAdminCookie, verifyAdminPassword } from '@/lib/auth'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  if (!await enforceRateLimit(req, { namespace: 'admin-login', limit: 5, windowSeconds: 15 * 60 })) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 })
  }

  let body: { password?: unknown }
  try {
    body = await readJsonBody(req, 2_048)
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: status === 413 ? 'Requête trop grande' : 'Requête invalide' }, { status })
  }
  if (typeof body.password !== 'string' || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  // Reset le compteur sur succès
  try {
    await setAdminCookie()
  } catch {
    return NextResponse.json({ error: 'Configuration administrateur indisponible' }, { status: 503 })
  }
  return NextResponse.json({ ok: true })
}
