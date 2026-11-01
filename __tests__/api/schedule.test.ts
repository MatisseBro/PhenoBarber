import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upsert: vi.fn(),
  remove: vi.fn(),
  deleteEq: vi.fn(),
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ from: mocks.from }) }))
vi.mock('@/lib/auth', () => ({ isAdminAuthenticated: mocks.isAdmin }))

import { GET as getSchedule, PUT as updateSchedule } from '@/app/api/schedule/route'
import { POST as createClosure } from '@/app/api/schedule/closures/route'
import { DELETE as deleteClosure } from '@/app/api/schedule/closures/[date]/route'
import { POST as createBlock } from '@/app/api/schedule/blocks/route'
import { DELETE as deleteBlock } from '@/app/api/schedule/blocks/[id]/route'

describe('schedule API schema compatibility and validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isAdmin.mockResolvedValue(true)
    mocks.upsert.mockResolvedValue({ error: null })
    mocks.deleteEq.mockResolvedValue({ error: null })
    mocks.remove.mockReturnValue({ eq: mocks.deleteEq })
  })

  it('fonctionne avec le schéma distant sans created_at sur fermetures/blocages', async () => {
    mocks.from.mockImplementation((table: string) => {
      if (table === 'schedule_config') return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({
          data: { id: 'main', open_days: [2, 3], slots: ['10:00'], updated_at: null }, error: null,
        }) }) }),
      }
      if (table === 'schedule_closures') return {
        select: () => ({ order: () => Promise.resolve({ data: [{ date: '2099-01-06', reason: 'Fermé' }], error: null }) }),
      }
      return {
        select: () => ({ order: () => Promise.resolve({ data: [{ id: 'block-id', date: '2099-01-07', slot: '10:00', reason: '' }], error: null }) }),
      }
    })

    const response = await getSchedule()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      config: { openDays: [2, 3], slots: ['10:00'], updatedAt: null },
      closures: [{ date: '2099-01-06', reason: 'Fermé' }],
      blocks: [{ id: 'block-id', date: '2099-01-07', slot: '10:00', reason: '' }],
    })
  })

  it('rejette les jours/créneaux dupliqués et les heures hors catalogue', async () => {
    mocks.from.mockReturnValue({ upsert: mocks.upsert })
    for (const body of [
      { openDays: [2, 2], slots: ['10:00'] },
      { openDays: [2], slots: ['99:99'] },
      { openDays: [2], slots: ['10:00', '10:00'] },
    ]) {
      const response = await updateSchedule(new Request('http://localhost/api/schedule', {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      }))
      expect(response.status).toBe(422)
    }
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it('valide strictement les dates, créneaux et textes avant écriture', async () => {
    mocks.from.mockReturnValue({ upsert: mocks.upsert })

    const badClosure = await createClosure(new Request('http://localhost/api/schedule/closures', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: '2099-02-30', reason: 'x' }),
    }))
    const badBlock = await createBlock(new Request('http://localhost/api/schedule/blocks', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: '2099-01-06', slot: '25:00', reason: 'x' }),
    }))
    expect(badClosure.status).toBe(422)
    expect(badBlock.status).toBe(422)
    expect(mocks.upsert).not.toHaveBeenCalled()

    const goodBlock = await createBlock(new Request('http://localhost/api/schedule/blocks', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: '2099-01-06', slot: '10:00', reason: '  test local  ' }),
    }))
    expect(goodBlock.status).toBe(201)
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      date: '2099-01-06', slot: '10:00', reason: 'test local',
    }), { onConflict: 'date,slot' })
  })

  it('rejette les identifiants de suppression invalides avant la requête', async () => {
    mocks.from.mockReturnValue({ delete: mocks.remove })
    const closure = await deleteClosure(new Request('http://localhost'), {
      params: Promise.resolve({ date: '2099-02-30' }),
    })
    const block = await deleteBlock(new Request('http://localhost'), {
      params: Promise.resolve({ id: "x' OR 1=1 --" }),
    })
    expect(closure.status).toBe(422)
    expect(block.status).toBe(422)
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
