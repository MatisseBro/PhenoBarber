import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createHmac } from 'crypto'
import { verifyAdminPassword, verifyAdminToken } from '@/lib/auth'

const originalEnvironment = { ...process.env }

function token(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', process.env.ADMIN_SECRET!).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

describe('admin authentication', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'not_a_real_admin_password'
    process.env.ADMIN_SECRET = 'a-secret-longer-than-thirty-two-characters-for-tests'
    process.env.ADMIN_SESSION_VERSION = '7'
  })

  afterEach(() => {
    process.env = { ...originalEnvironment }
  })

  it('refuse toute authentification si la configuration est absente', () => {
    delete process.env.ADMIN_SECRET
    expect(verifyAdminPassword('')).toBe(false)
    expect(verifyAdminToken('anything')).toBe(false)
  })

  it('refuse toute session si sa version de révocation est absente', () => {
    delete process.env.ADMIN_SESSION_VERSION
    expect(verifyAdminPassword('not_a_real_admin_password')).toBe(false)
    expect(verifyAdminToken('anything')).toBe(false)
  })

  it('compare le mot de passe sans accepter une valeur vide', () => {
    expect(verifyAdminPassword('')).toBe(false)
    expect(verifyAdminPassword('wrong')).toBe(false)
    expect(verifyAdminPassword('not_a_real_admin_password')).toBe(true)
  })

  it('refuse une configuration avec un mot de passe trop court', () => {
    process.env.ADMIN_PASSWORD = 'not_a_real'
    expect(verifyAdminPassword('not_a_real')).toBe(false)
    expect(verifyAdminPassword('')).toBe(false)
  })

  it('accepte une session signée non expirée et révocable par version', () => {
    const now = Math.floor(Date.now() / 1000)
    const valid = token({ sid: 'x'.repeat(32), iat: now, exp: now + 3600, version: '7' })
    expect(verifyAdminToken(valid)).toBe(true)
    process.env.ADMIN_SESSION_VERSION = '8'
    expect(verifyAdminToken(valid)).toBe(false)
  })

  it('refuse les sessions expirées et les signatures modifiées', () => {
    const now = Math.floor(Date.now() / 1000)
    const expired = token({ sid: 'x'.repeat(32), iat: now - 7200, exp: now - 1, version: '7' })
    expect(verifyAdminToken(expired)).toBe(false)
    expect(verifyAdminToken(`${expired.slice(0, -1)}x`)).toBe(false)
  })

  it('refuse une session trop longue ou émise trop loin dans le futur', () => {
    const now = Math.floor(Date.now() / 1000)
    const tooLong = token({ sid: 'x'.repeat(32), iat: now, exp: now + 8 * 60 * 60 + 1, version: '7' })
    const future = token({ sid: 'x'.repeat(32), iat: now + 61, exp: now + 3600, version: '7' })
    expect(verifyAdminToken(tooLong)).toBe(false)
    expect(verifyAdminToken(future)).toBe(false)
  })
})
