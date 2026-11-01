import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { createHmac } from 'node:crypto'
import { middleware } from '@/middleware'

const originalEnvironment = { ...process.env }

function adminRequest(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', process.env.ADMIN_SECRET!).update(encoded).digest('base64url')
  return new NextRequest('http://localhost/api/admin/clients', {
    headers: { cookie: `pheno_admin_session=${encoded}.${signature}` },
  })
}

describe('API authorization middleware', () => {
  afterEach(() => {
    process.env = { ...originalEnvironment }
  })

  it('autorise uniquement le POST public de réservation de groupe', async () => {
    const post = await middleware(new NextRequest('http://localhost/api/rdv/group', { method: 'POST' }))
    expect(post.headers.get('x-middleware-next')).toBe('1')

    const get = await middleware(new NextRequest('http://localhost/api/rdv/group', { method: 'GET' }))
    expect(get.status).toBe(401)
  })

  it('bloque les routes administrateur sans session', async () => {
    const response = await middleware(new NextRequest('http://localhost/api/admin/clients', { method: 'GET' }))
    expect(response.status).toBe(401)
  })

  it('n’autorise publiquement que la route exacte des créneaux en lecture', async () => {
    const slots = await middleware(new NextRequest('http://localhost/api/rdv/slots?date=2099-01-01', { method: 'GET' }))
    expect(slots.headers.get('x-middleware-next')).toBe('1')
    const mutation = await middleware(new NextRequest('http://localhost/api/rdv/slots', { method: 'POST' }))
    expect(mutation.status).toBe(401)
  })

  it('accepte une session valide et révoque immédiatement une ancienne version', async () => {
    process.env.ADMIN_PASSWORD = 'not_a_real_admin_password'
    process.env.ADMIN_SECRET = 'fictitious-admin-secret-longer-than-thirty-two-characters'
    process.env.ADMIN_SESSION_VERSION = '12'
    const now = Math.floor(Date.now() / 1000)
    const payload = { sid: 'x'.repeat(32), iat: now, exp: now + 3600, version: '12' }

    const accepted = await middleware(adminRequest(payload))
    expect(accepted.headers.get('x-middleware-next')).toBe('1')

    process.env.ADMIN_SESSION_VERSION = '13'
    const revoked = await middleware(adminRequest(payload))
    expect(revoked.status).toBe(401)
  })

  it('refuse une session expirée même si sa signature est valide', async () => {
    process.env.ADMIN_PASSWORD = 'not_a_real_admin_password'
    process.env.ADMIN_SECRET = 'fictitious-admin-secret-longer-than-thirty-two-characters'
    process.env.ADMIN_SESSION_VERSION = '12'
    const now = Math.floor(Date.now() / 1000)
    const response = await middleware(adminRequest({
      sid: 'x'.repeat(32), iat: now - 7200, exp: now - 1, version: '12',
    }))
    expect(response.status).toBe(401)
  })
})
