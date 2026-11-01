import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }))

vi.mock('@/lib/auth', () => ({ isAdminAuthenticated: vi.fn().mockResolvedValue(true) }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc: mockRpc }) }))

import { GET } from '@/app/api/admin/clients/route'

describe('GET /api/admin/clients pagination', () => {
  beforeEach(() => mockRpc.mockReset())

  it('préserve le total quand la page est vide grâce à la ligne de comptage SQL', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: null, nom: null, email: null, telephone: null, total_count: 64 }],
      error: null,
    })

    const response = await GET(new Request('http://localhost/api/admin/clients?page=3'))
    const body = await response.json()

    expect(body).toMatchObject({ clients: [], total: 64, page: 3, perPage: 30 })
  })

  it('retire total_count des fiches renvoyées', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'fake-client-1', nom: 'Client test', email: null, telephone: null, total_count: 1 }],
      error: null,
    })

    const response = await GET(new Request('http://localhost/api/admin/clients'))
    const body = await response.json()

    expect(body.total).toBe(1)
    expect(body.clients).toEqual([{ id: 'fake-client-1', nom: 'Client test', email: null, telephone: null }])
  })
})
