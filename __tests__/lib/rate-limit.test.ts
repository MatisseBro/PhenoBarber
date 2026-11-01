import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc: mockRpc }) }))

import { enforceRateLimit, getClientAddress } from '@/lib/rate-limit'

const originalEnvironment = { ...process.env }

describe('distributed rate limiting', () => {
  beforeEach(() => {
    mockRpc.mockReset()
    process.env.RATE_LIMIT_SECRET = 'fictitious-rate-limit-secret-at-least-32-characters'
    process.env.TRUST_PROXY = 'false'
    process.env.HOSTING_PLATFORM = 'none'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    process.env = { ...originalEnvironment }
  })

  it('ignore x-forwarded-for sans proxy explicitement approuvé', () => {
    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    })
    expect(getClientAddress(request)).toBe('unknown')
    process.env.TRUST_PROXY = 'true'
    expect(getClientAddress(request)).toBe('203.0.113.10')
  })

  it('ne croit que les en-têtes de la plateforme explicitement configurée', () => {
    const cloudflareRequest = new Request('https://example.test', {
      headers: { 'cf-connecting-ip': '2001:db8::1' },
    })
    expect(getClientAddress(cloudflareRequest)).toBe('unknown')
    process.env.HOSTING_PLATFORM = 'cloudflare'
    expect(getClientAddress(cloudflareRequest)).toBe('2001:db8::1')
    expect(getClientAddress(new Request('https://example.test', {
      headers: { 'cf-connecting-ip': 'injected, value' },
    }))).toBe('unknown')
  })

  it('n’envoie à Supabase qu’une clé HMAC opaque', async () => {
    process.env.HOSTING_PLATFORM = 'vercel'
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    const allowed = await enforceRateLimit(new Request('https://example.test', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.20' },
    }), { namespace: 'test', limit: 2, windowSeconds: 60 })

    expect(allowed).toBe(true)
    const [, parameters] = mockRpc.mock.calls[0]
    expect(parameters.p_key).toMatch(/^[0-9a-f]{64}$/)
    expect(parameters.p_key).not.toContain('203.0.113.20')
  })

  it('ne partage pas un unique bucket global si aucune IP fiable n’est disponible', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    await enforceRateLimit(new Request('https://example.test', {
      headers: { 'user-agent': 'browser-a', 'accept-language': 'fr' },
    }), { namespace: 'test', limit: 2, windowSeconds: 60 })
    await enforceRateLimit(new Request('https://example.test', {
      headers: { 'user-agent': 'browser-b', 'accept-language': 'fr' },
    }), { namespace: 'test', limit: 2, windowSeconds: 60 })

    expect(mockRpc.mock.calls[0][1].p_key).not.toBe(mockRpc.mock.calls[1][1].p_key)
  })

  it('échoue fermé en production sans secret ou si la RPC échoue', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.RATE_LIMIT_SECRET
    await expect(enforceRateLimit(new Request('https://example.test'), {
      namespace: 'missing', limit: 1, windowSeconds: 60,
    })).resolves.toBe(false)

    process.env.RATE_LIMIT_SECRET = 'fictitious-rate-limit-secret-at-least-32-characters'
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('unavailable') })
    await expect(enforceRateLimit(new Request('https://example.test'), {
      namespace: 'failure', limit: 1, windowSeconds: 60,
    })).resolves.toBe(false)
  })
})
