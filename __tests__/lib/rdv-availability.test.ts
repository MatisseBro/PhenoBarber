import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFrom, mockNeq } = vi.hoisted(() => ({ mockFrom: vi.fn(), mockNeq: vi.fn() }))

vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ from: mockFrom }) }))

import { checkRdvAvailability } from '@/lib/rdv-availability'

type QueryResult = { data: unknown; error: unknown }
type QueryBuilder = Promise<QueryResult> & {
  select: () => QueryBuilder
  eq: (...args: string[]) => QueryBuilder
  neq: (...args: string[]) => QueryBuilder
  maybeSingle: () => Promise<QueryResult>
}

function query(result: QueryResult): QueryBuilder {
  const builder = Promise.resolve(result) as QueryBuilder
  builder.select = () => builder
  builder.eq = () => builder
  builder.neq = (...args: string[]) => {
    mockNeq(...args)
    return builder
  }
  builder.maybeSingle = () => Promise.resolve(result)
  return builder
}

describe('checkRdvAvailability', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockNeq.mockReset()
  })

  function mockSchedule(overrides: Partial<Record<string, QueryResult>> = {}) {
    const defaults: Record<string, QueryResult> = {
      schedule_config: { data: { open_days: [0, 1, 2, 3, 4, 5, 6], slots: ['10:00', '10:30', '11:00'] }, error: null },
      schedule_closures: { data: [], error: null },
      schedule_blocks: { data: [], error: null },
      rdv_bookings: { data: [], error: null },
    }
    mockFrom.mockImplementation((table: string) => query(overrides[table] ?? defaults[table]))
  }

  it('accepte un créneau ouvert sans blocage ni rendez-vous actif', async () => {
    mockSchedule()
    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 30 }]))
      .resolves.toEqual({ ok: true })
    expect(mockNeq).toHaveBeenCalledWith('status', 'cancelled')
  })

  it('refuse une fermeture et un blocage qui recouvre une prestation longue', async () => {
    mockSchedule({ schedule_closures: { data: [{ date: '2099-01-06' }], error: null } })
    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 30 }]))
      .resolves.toEqual({ ok: false, reason: 'closed' })

    mockSchedule({ schedule_blocks: { data: [{ slot: '10:30' }], error: null } })
    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 60 }]))
      .resolves.toEqual({ ok: false, reason: 'unavailable' })
  })

  it('détecte le chevauchement avec un rendez-vous existant', async () => {
    mockSchedule({ rdv_bookings: { data: [{ slot: '10:30', total_duration: 30 }], error: null } })
    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 60 }]))
      .resolves.toEqual({ ok: false, reason: 'unavailable' })
  })

  it('refuse aussi deux demandes simultanées qui se chevauchent entre elles', async () => {
    mockSchedule()
    await expect(checkRdvAvailability('2099-01-06', [
      { slot: '10:00', duration: 60 },
      { slot: '10:30', duration: 30 },
    ])).resolves.toEqual({ ok: false, reason: 'unavailable' })
  })

  it('renvoie une erreur contrôlée si schedule_config ne peut pas être lu', async () => {
    mockFrom.mockImplementation((table: string) => table === 'schedule_config'
      ? query({ data: null, error: new Error('database unavailable') })
      : query({ data: [], error: null }))

    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 30 }]))
      .resolves.toEqual({ ok: false, reason: 'error' })
  })

  it('échoue de façon contrôlée si la configuration principale est absente', async () => {
    mockFrom.mockImplementation((table: string) => table === 'schedule_config'
      ? query({ data: null, error: null })
      : query({ data: [], error: null }))

    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 30 }]))
      .resolves.toEqual({ ok: false, reason: 'error' })
  })

  it('convertit aussi une exception de lecture en erreur contrôlée', async () => {
    mockFrom.mockImplementation((table: string) => table === 'schedule_config'
      ? query({ data: null, error: null })
      : query({ data: [], error: null }))
    mockFrom.mockImplementationOnce(() => { throw new Error('client unavailable') })

    await expect(checkRdvAvailability('2099-01-06', [{ slot: '10:00', duration: 30 }]))
      .resolves.toEqual({ ok: false, reason: 'error' })
  })
})
