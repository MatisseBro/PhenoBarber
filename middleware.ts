import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'pheno_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8

function decodeBase64Url(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0))
  return bytes.buffer as ArrayBuffer
}

async function verifySessionSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify('HMAC', key, decodeBase64Url(signature), enc.encode(payload))
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  const secret = process.env.ADMIN_SECRET
  const password = process.env.ADMIN_PASSWORD
  const version = process.env.ADMIN_SESSION_VERSION
  if (!token || !secret || secret.length < 32 || !password || password.length < 12 || !version) return false
  try {
    const [encodedPayload, signature, extra] = token.split('.')
    if (!encodedPayload || !signature || extra || !await verifySessionSignature(encodedPayload, signature, secret)) return false
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as {
      sid?: unknown
      iat?: unknown
      exp?: unknown
      version?: unknown
    }
    const now = Math.floor(Date.now() / 1000)
    return typeof payload.sid === 'string' && payload.sid.length >= 32 &&
      typeof payload.iat === 'number' && payload.iat <= now + 60 &&
      typeof payload.exp === 'number' && payload.exp > now &&
      payload.exp - payload.iat <= SESSION_MAX_AGE &&
      payload.version === version
  } catch {
    return false
  }
}

function deny(): NextResponse {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl
  const method = req.method

  // Login : toujours public
  if (pathname === '/api/admin/login') return NextResponse.next()

  // Toutes les autres routes /api/admin/* nécessitent l'auth
  if (pathname.startsWith('/api/admin/')) {
    if (!await isAuthenticated(req)) return deny()
    return NextResponse.next()
  }

  // Schedule : GET public, mutations admin-only
  if (pathname === '/api/schedule' || pathname.startsWith('/api/schedule/')) {
    if (method !== 'GET') {
      if (!await isAuthenticated(req)) return deny()
    }
    return NextResponse.next()
  }

  // RDV : POST (création) et GET /slots publics, reste admin-only
  if (pathname === '/api/rdv' || pathname.startsWith('/api/rdv/')) {
    const isPublic =
      (pathname === '/api/rdv' && method === 'POST') ||
      (pathname === '/api/rdv/group' && method === 'POST') ||
      (pathname === '/api/rdv/slots' && method === 'GET')
    if (!isPublic && !await isAuthenticated(req)) return deny()
    return NextResponse.next()
  }

  // Reservations : POST (création) public, reste admin-only
  if (pathname === '/api/reservations' || pathname.startsWith('/api/reservations/')) {
    if (!(pathname === '/api/reservations' && method === 'POST')) {
      if (!await isAuthenticated(req)) return deny()
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/schedule',
    '/api/schedule/:path*',
    '/api/rdv',
    '/api/rdv/:path*',
    '/api/reservations',
    '/api/reservations/:path*',
  ],
}
