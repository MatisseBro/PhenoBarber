import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  lookupEq: vi.fn(),
  lookupLimit: vi.fn(),
  bookingEq: vi.fn(),
  bookingNeq: vi.fn(),
  bookingOrder: vi.fn(),
  bookingLimit: vi.fn(),
  rpc: vi.fn(),
  rateLimit: vi.fn(),
  sendMagicLink: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ from: mocks.from, rpc: mocks.rpc }),
}))
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: mocks.rateLimit }))
vi.mock('@/lib/email', () => ({ sendClientMagicLink: mocks.sendMagicLink }))

import { POST } from '@/app/api/client-auth/route'

describe('client magic links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rateLimit.mockResolvedValue(true)
    mocks.sendMagicLink.mockResolvedValue({ ok: true, status: 'sent', retryable: false })
    mocks.lookupEq.mockReturnValue({ limit: mocks.lookupLimit })
    mocks.bookingEq.mockReturnValue({ neq: mocks.bookingNeq })
    mocks.bookingNeq.mockReturnValue({ order: mocks.bookingOrder })
    mocks.bookingOrder.mockReturnValue({ limit: mocks.bookingLimit })
    mocks.select.mockImplementation((columns: string) => columns === 'id'
      ? { eq: mocks.lookupEq }
      : { eq: mocks.bookingEq })
    mocks.from.mockReturnValue({ select: mocks.select })
    mocks.lookupLimit.mockResolvedValue({ data: [{ id: 'booking' }], error: null })
    mocks.bookingLimit.mockResolvedValue({ data: [], error: null })
    mocks.rpc.mockResolvedValue({ data: null, error: null })
  })

  it('ne révèle pas si une adresse inconnue existe', async () => {
    mocks.lookupLimit.mockResolvedValueOnce({ data: [], error: null })
    const response = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.test' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(mocks.rpc).not.toHaveBeenCalled()
    expect(mocks.sendMagicLink).not.toHaveBeenCalled()
  })

  it('stocke uniquement le hash et transmet un lien fictif au service email simulé', async () => {
    const response = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'CLIENT@example.test' }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('issue_client_token', expect.objectContaining({
      p_email: 'client@example.test',
      p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    }))
    expect(mocks.sendMagicLink).toHaveBeenCalledWith(expect.objectContaining({
      email: 'client@example.test',
      link: expect.stringMatching(/^https:\/\/pheno\.example\.test\/espace-client#token=[0-9a-f]{64}$/),
      idempotencyKey: expect.stringMatching(/^client-magic:[0-9a-f]{64}$/),
    }))
  })

  it('révoque le token si Resend refuse le magic link sans changer la réponse publique', async () => {
    mocks.sendMagicLink.mockResolvedValueOnce({
      ok: false, status: 'failed', retryable: false, errorCode: 'http_400',
    })
    const response = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'client@example.test' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, 'revoke_client_token', {
      p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    })
  })

  it('refuse un token mal formé ou déjà consommé/expiré', async () => {
    const malformed = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-token' }),
    }))
    expect(malformed.status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()

    mocks.rpc.mockResolvedValueOnce({ data: [], error: null })
    const consumed = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'a'.repeat(64) }),
    }))
    expect(consumed.status).toBe(401)
  })

  it('consomme un token une seule fois et sépare les rendez-vous passés et futurs', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ email: 'client@example.test' }], error: null })
    mocks.bookingLimit.mockResolvedValueOnce({
      data: [
        { id: 'future', date: '2099-01-06', status: 'confirmed' },
        { id: 'past', date: '2000-01-06', status: 'confirmed' },
      ],
      error: null,
    })
    const response = await POST(new Request('http://localhost/api/client-auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'b'.repeat(64) }),
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.upcoming.map((booking: { id: string }) => booking.id)).toEqual(['future'])
    expect(body.past.map((booking: { id: string }) => booking.id)).toEqual(['past'])
    expect(mocks.rpc).toHaveBeenCalledWith('consume_client_token', {
      p_token_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    })
  })
})
