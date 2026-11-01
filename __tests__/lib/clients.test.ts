import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, select, eq, limit, maybeSingle } = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ from }) }))

import { lookupClient } from '@/lib/clients'

describe('client lookup hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const query = { select, eq, limit, maybeSingle }
    from.mockReturnValue(query)
    select.mockReturnValue(query)
    eq.mockReturnValue(query)
    limit.mockReturnValue(query)
    maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('rejette une expression PostgREST injectée avant toute requête', async () => {
    expect(await lookupClient('victim@example.test,rdv_count.gt.0', '+33612345678')).toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('combine email et téléphone avec deux filtres exacts', async () => {
    await lookupClient('Client@Example.test', '06 12 34 56 78')
    expect(eq).toHaveBeenNthCalledWith(1, 'email', 'client@example.test')
    expect(eq).toHaveBeenNthCalledWith(2, 'telephone_normalized', '+33612345678')
    expect((eq as unknown as { mock: { calls: unknown[][] } }).mock.calls.flat()).not.toContain('or')
  })
})
