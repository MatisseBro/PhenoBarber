import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_COOKIE_NAME = 'pheno_admin_session'
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8

interface AdminSessionPayload {
  sid: string
  iat: number
  exp: number
  version: string
}

function getAdminConfiguration() {
  const password = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SECRET
  const version = process.env.ADMIN_SESSION_VERSION
  if (!password || password.length < 12 || !secret || secret.length < 32 || !version) return null
  return { password, secret, version }
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url')
}

function createSessionToken(): string {
  const config = getAdminConfiguration()
  if (!config) throw new Error('Configuration administrateur absente ou insuffisante')
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    sid: randomBytes(24).toString('base64url'),
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE,
    version: config.version,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload, config.secret)}`
}

export function verifyAdminPassword(password: string): boolean {
  const config = getAdminConfiguration()
  if (!config || !password) return false
  const actual = createHmac('sha256', config.secret).update(password).digest()
  const expected = createHmac('sha256', config.secret).update(config.password).digest()
  return timingSafeEqual(actual, expected)
}

export function verifyAdminToken(token: string | undefined): boolean {
  const config = getAdminConfiguration()
  if (!config || !token) return false
  const [encodedPayload, signature, extra] = token.split('.')
  if (!encodedPayload || !signature || extra) return false
  const expected = sign(encodedPayload, config.secret)
  const actualBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expected)
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<AdminSessionPayload>
    const now = Math.floor(Date.now() / 1000)
    return typeof payload.sid === 'string' && payload.sid.length >= 32 &&
      typeof payload.iat === 'number' && payload.iat <= now + 60 &&
      typeof payload.exp === 'number' && payload.exp > now &&
      payload.exp - payload.iat <= ADMIN_SESSION_MAX_AGE &&
      payload.version === config.version
  } catch {
    return false
  }
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/',
    priority: 'high',
  })
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies()
  store.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifyAdminToken(store.get(ADMIN_COOKIE_NAME)?.value)
}
