import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), neq: vi.fn(),
  deliverClaimed: vi.fn(), sendEmail: vi.fn(), sendSms: vi.fn(), inactive: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ from: mocks.from }) }))
vi.mock('@/lib/clients', () => ({ getInactiveClients: mocks.inactive }))
vi.mock('@/lib/email', () => ({ sendRdvReminder: mocks.sendEmail, sendRelance: vi.fn() }))
vi.mock('@/lib/sms', () => ({ sendRdvReminderSms: mocks.sendSms }))
vi.mock('@/lib/notification-delivery', () => ({ deliverClaimed: mocks.deliverClaimed }))

import { POST } from '@/app/api/cron/reminders/route'

describe('reminder cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'fictitious-cron-secret-at-least-24-characters'
    mocks.select.mockReturnValue({ eq: mocks.eq })
    mocks.eq.mockReturnValue({ neq: mocks.neq })
    mocks.from.mockReturnValue({ select: mocks.select })
    mocks.neq.mockResolvedValue({ data: [], error: null })
    mocks.inactive.mockResolvedValue([])
    mocks.sendEmail.mockResolvedValue({ ok: true, status: 'sent', retryable: false })
    mocks.sendSms.mockResolvedValue({ ok: true, status: 'sent', retryable: false })
    mocks.deliverClaimed.mockImplementation(async (
      key: string,
      _channel: string,
      send: (idempotencyKey: string) => Promise<unknown>,
    ) => {
      await send(key)
      return 'sent'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.CRON_SECRET
  })

  it('refuse un appel sans secret sans lire la base', async () => {
    const response = await POST(new Request('http://localhost/api/cron/reminders', { method: 'POST' }))
    expect(response.status).toBe(403)
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it('regroupe un rendez-vous de groupe en un email et un SMS idempotents', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T22:30:00.000Z')) // lundi 00:30 à Paris
    mocks.neq.mockResolvedValueOnce({
      data: [
        {
          id: 'booking-2', group_id: 'group-1', person_label: 'Personne B', nom: 'Famille Test',
          email: 'family@example.test', telephone: '+33600000000', date: '2026-07-07', slot: '10:30',
          prestation_label: 'Coupe enfant', degrade_label: null, options_labels: [], total_price: 20,
          total_duration: 30, categorie: 'enfant',
        },
        {
          id: 'booking-1', group_id: 'group-1', person_label: 'Personne A', nom: 'Famille Test',
          email: 'family@example.test', telephone: '+33600000000', date: '2026-07-07', slot: '10:00',
          prestation_label: 'Coupe homme', degrade_label: null, options_labels: [], total_price: 30,
          total_duration: 30, categorie: 'homme',
        },
      ],
      error: null,
    })

    const response = await POST(new Request('http://localhost/api/cron/reminders', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      date: '2026-07-07', deliveries: { sent: 2, failed: 0, uncertain: 0, skipped: 0 },
    })
    expect(mocks.deliverClaimed).toHaveBeenCalledTimes(2)
    expect(mocks.deliverClaimed).toHaveBeenCalledWith(
      'rdv-reminder:group:group-1:email', 'email', expect.any(Function),
    )
    expect(mocks.deliverClaimed).toHaveBeenCalledWith(
      'rdv-reminder:group:group-1:sms', 'sms', expect.any(Function),
    )
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      slot: '10:00', totalPrice: 50, totalDuration: 60,
      prestationLabel: 'Personne A : Coupe homme | Personne B : Coupe enfant',
    }), 'rdv-reminder:group:group-1:email')
    expect(mocks.sendSms).toHaveBeenCalledWith(expect.objectContaining({
      prestationLabel: 'Groupe de 2 personnes',
    }))
  })
})
