import { createHmac, timingSafeEqual } from 'crypto'
import { normalizeEmail } from './validation'

interface UnsubscribePayload {
  email: string
  exp: number
}

function secret(): string | null {
  const value = process.env.MARKETING_UNSUBSCRIBE_SECRET
  return value && value.length >= 32 ? value : null
}

function signature(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url')
}

export function createUnsubscribeToken(emailValue: string): string {
  const email = normalizeEmail(emailValue)
  const key = secret()
  if (!email || !key) throw new Error('Configuration de désinscription indisponible')
  const encoded = Buffer.from(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
  } satisfies UnsubscribePayload)).toString('base64url')
  return `${encoded}.${signature(encoded, key)}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const key = secret()
  if (!key || token.length > 1_024) return null
  const [encoded, suppliedSignature, extra] = token.split('.')
  if (!encoded || !suppliedSignature || extra) return null
  const expected = signature(encoded, key)
  const actualBytes = Buffer.from(suppliedSignature)
  const expectedBytes = Buffer.from(expected)
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Partial<UnsubscribePayload>
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null
    return normalizeEmail(payload.email)
  } catch {
    return null
  }
}
