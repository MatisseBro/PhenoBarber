import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  neq: vi.fn(),
  rateLimit: vi.fn(),
  availability: vi.fn(),
  isReturning: vi.fn(),
  upsertClient: vi.fn(),
  sendEmail: vi.fn(),
  sendSms: vi.fn(),
  isAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/supabase')>()
  return { ...actual, getSupabase: () => ({ from: mocks.from }) }
})
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: mocks.rateLimit }))
vi.mock('@/lib/rdv-availability', () => ({ checkRdvAvailability: mocks.availability }))
vi.mock('@/lib/clients', () => ({
  isReturningClient: mocks.isReturning,
  upsertClientRdv: mocks.upsertClient,
}))
vi.mock('@/lib/email', () => ({ sendRdvEmails: mocks.sendEmail }))
vi.mock('@/lib/sms', () => ({ sendRdvSmsClient: mocks.sendSms }))
vi.mock('@/lib/auth', () => ({ isAdminAuthenticated: mocks.isAdmin }))

import { POST as createRdv } from '@/app/api/rdv/route'
import { POST as createGroup } from '@/app/api/rdv/group/route'
import { PATCH as updateRdv } from '@/app/api/rdv/[id]/route'

const validRdv = {
  nom: 'Client Exemple',
  email: 'CLIENT@EXAMPLE.TEST',
  telephone: '06 12 34 56 78',
  categorie: 'homme',
  prestation: 'buzz',
  options: ['sham'],
  date: '2099-01-06',
  slot: '10:00',
  totalPrice: 0,
  totalDuration: 1,
}

describe('appointment API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.rateLimit.mockResolvedValue(true)
    mocks.availability.mockResolvedValue({ ok: true })
    mocks.isReturning.mockResolvedValue(false)
    mocks.upsertClient.mockResolvedValue(undefined)
    mocks.sendEmail.mockResolvedValue({ ok: true, deliveries: [] })
    mocks.sendSms.mockResolvedValue({ ok: true, status: 'sent', retryable: false })
    mocks.isAdmin.mockResolvedValue(true)
    mocks.insert.mockResolvedValue({ error: null })
    mocks.eq.mockResolvedValue({ error: null })
    mocks.update.mockReturnValue({ eq: mocks.eq })
    mocks.select.mockReturnValue({ eq: () => ({ neq: mocks.neq }) })
    mocks.neq.mockResolvedValue({ data: [], error: null })
    mocks.from.mockReturnValue({
      insert: mocks.insert,
      update: mocks.update,
      select: mocks.select,
    })
  })

  it('crée un rendez-vous avec le tarif et la durée recalculés côté serveur', async () => {
    const response = await createRdv(new Request('http://localhost/api/rdv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validRdv),
    }))

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ ok: true, totalPrice: 35, totalDuration: 35 })
    const [rows] = mocks.insert.mock.calls[0]
    expect(rows[0]).toMatchObject({
      email: 'client@example.test',
      telephone: '+33612345678',
      total_price: 35,
      total_duration: 35,
      status: 'pending',
    })
  })

  it('transforme une exclusion concurrente PostgreSQL en conflit HTTP sans notification', async () => {
    mocks.insert.mockResolvedValueOnce({ error: { code: '23P01' } })
    const response = await createRdv(new Request('http://localhost/api/rdv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validRdv),
    }))

    expect(response.status).toBe(409)
    expect(mocks.sendEmail).not.toHaveBeenCalled()
    expect(mocks.sendSms).not.toHaveBeenCalled()
    expect(mocks.upsertClient).not.toHaveBeenCalled()
  })

  it('rejette le créneau passé ou trop proche le jour même, individuellement et en groupe', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-06T10:00:00.000Z')) // 11 h à Paris
    process.env.BOOKING_MIN_LEAD_MINUTES = '60'
    try {
      const individual = await createRdv(new Request('http://localhost/api/rdv', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validRdv, date: '2026-01-06', slot: '11:30' }),
      }))
      const group = await createGroup(new Request('http://localhost/api/rdv/group', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nom: 'Famille Exemple', email: 'famille@example.test', telephone: '0612345678',
          date: '2026-01-06', startSlot: '11:30',
          persons: [{ cat: 'homme', svcId: 'buzz', opts: [], personLabel: 'Personne A' }],
        }),
      }))

      expect(individual.status).toBe(422)
      expect(group.status).toBe(422)
      expect(mocks.insert).not.toHaveBeenCalled()
    } finally {
      delete process.env.BOOKING_MIN_LEAD_MINUTES
      vi.useRealTimers()
    }
  })

  it('rejette une prestation injectée avant tout insert', async () => {
    const response = await createRdv(new Request('http://localhost/api/rdv', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...validRdv, prestation: "buzz' OR 1=1 --" }),
    }))

    expect(response.status).toBe(422)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('crée un groupe séquentiel partageant un identifiant commun', async () => {
    const response = await createGroup(new Request('http://localhost/api/rdv/group', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nom: 'Famille Exemple',
        email: 'famille@example.test',
        telephone: '0612345678',
        date: '2099-01-06',
        startSlot: '10:00',
        persons: [
          { cat: 'homme', svcId: 'buzz', opts: [], personLabel: 'Personne A' },
          { cat: 'enfant', svcId: 'coupe-e', opts: [], personLabel: 'Personne B' },
        ],
      }),
    }))

    expect(response.status).toBe(201)
    const [rows] = mocks.insert.mock.calls[0]
    expect(rows).toHaveLength(2)
    expect(rows.map((row: { slot: string }) => row.slot)).toEqual(['10:00', '10:30'])
    expect(rows[0].group_id).toBeTruthy()
    expect(rows[1].group_id).toBe(rows[0].group_id)
  })

  it('annule un rendez-vous uniquement après authentification administrateur', async () => {
    const request = new Request('http://localhost/api/rdv/booking-id', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    const response = await updateRdv(request, { params: Promise.resolve({ id: 'booking-id' }) })
    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(mocks.eq).toHaveBeenCalledWith('id', 'booking-id')

    mocks.isAdmin.mockResolvedValueOnce(false)
    const denied = await updateRdv(new Request('http://localhost/api/rdv/booking-id', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    }), { params: Promise.resolve({ id: 'booking-id' }) })
    expect(denied.status).toBe(401)
  })
})
