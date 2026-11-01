import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  verifyPassword: vi.fn(),
  setCookie: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: mocks.rateLimit }))
vi.mock('@/lib/auth', () => ({
  verifyAdminPassword: mocks.verifyPassword,
  setAdminCookie: mocks.setCookie,
}))

import { POST } from '@/app/api/admin/login/route'

const request = () => new Request('http://localhost/api/admin/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ password: 'fictitious-admin-password' }),
})

describe('admin login API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rateLimit.mockResolvedValue(true)
    mocks.verifyPassword.mockReturnValue(true)
    mocks.setCookie.mockResolvedValue(undefined)
  })

  it('crée une session seulement après validation du mot de passe', async () => {
    const response = await POST(request())
    expect(response.status).toBe(200)
    expect(mocks.setCookie).toHaveBeenCalledOnce()
  })

  it('refuse un mot de passe incorrect sans créer de session', async () => {
    mocks.verifyPassword.mockReturnValueOnce(false)
    const response = await POST(request())
    expect(response.status).toBe(401)
    expect(mocks.setCookie).not.toHaveBeenCalled()
  })

  it('bloque les tentatives au-delà de la limite distribuée', async () => {
    mocks.rateLimit.mockResolvedValueOnce(false)
    const response = await POST(request())
    expect(response.status).toBe(429)
    expect(mocks.verifyPassword).not.toHaveBeenCalled()
  })

  it('échoue fermé si la configuration de session est indisponible', async () => {
    mocks.setCookie.mockRejectedValueOnce(new Error('missing configuration'))
    const response = await POST(request())
    expect(response.status).toBe(503)
  })
})
