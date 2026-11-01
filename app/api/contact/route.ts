import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isSafePlainText, normalizeEmail, normalizePersonName, normalizePhone } from '@/lib/validation'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10)
  if (contentLength > 8_192) {
    return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
  }

  if (!await enforceRateLimit(req, { namespace: 'contact', limit: 3, windowSeconds: 5 * 60 })) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try { body = await readJsonBody(req, 8_192) } catch (error) {
    if (error instanceof RequestBodyError && error.status === 413) {
      return NextResponse.json({ error: 'Requête trop grande' }, { status: 413 })
    }
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const { nom, email, telephone, message } = body
  const normalizedEmail = normalizeEmail(email)
  const normalizedPhone = telephone === undefined || telephone === '' ? undefined : (normalizePhone(telephone) ?? undefined)
  const normalizedName = normalizePersonName(nom)

  if (
    !normalizedName || !normalizedEmail ||
    (telephone !== undefined && telephone !== '' && !normalizedPhone) ||
    !isSafePlainText(message, 5, 2000)
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const result = await sendContactEmail({
    nom: normalizedName,
    email: normalizedEmail,
    telephone: normalizedPhone,
    message: message.trim(),
  }, `contact:${randomUUID()}`)

  return NextResponse.json({ ok: true, emailSent: result.ok }, { status: 201 })
}
