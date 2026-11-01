import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))

import { deliverClaimed } from '@/lib/notification-delivery'

describe('atomic notification delivery claims', () => {
  beforeEach(() => vi.clearAllMocks())

  it('n’exécute qu’un seul envoi lors de deux exécutions concurrentes', async () => {
    let alreadyClaimed = false
    rpc.mockImplementation(async (name: string) => {
      if (name === 'claim_notification_delivery') {
        if (alreadyClaimed) return { data: [{ claimed: false, lease_token: null, attempt_count: 1 }], error: null }
        alreadyClaimed = true
        return { data: [{ claimed: true, lease_token: 'a'.repeat(64), attempt_count: 1 }], error: null }
      }
      return { data: true, error: null }
    })
    const send = vi.fn().mockResolvedValue({ ok: true, status: 'sent', retryable: false })

    const states = await Promise.all([
      deliverClaimed('rdv-reminder:booking-1:email', 'email', send),
      deliverClaimed('rdv-reminder:booking-1:email', 'email', send),
    ])

    expect(states.sort()).toEqual(['sent', 'skipped'])
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('rdv-reminder:booking-1:email')
  })

  it('enregistre distinctement l’échec et sa politique de retry', async () => {
    rpc
      .mockResolvedValueOnce({ data: [{ claimed: true, lease_token: 'b'.repeat(64), attempt_count: 2 }], error: null })
      .mockResolvedValueOnce({ data: true, error: null })
    const send = vi.fn().mockResolvedValue({
      ok: false, status: 'failed', retryable: true, errorCode: 'http_429',
    })

    await expect(deliverClaimed('rdv-reminder:booking-2:email', 'email', send)).resolves.toBe('failed')
    expect(rpc).toHaveBeenLastCalledWith('finalize_notification_delivery', expect.objectContaining({
      p_status: 'failed', p_retryable: true, p_retry_after_seconds: 120, p_error_code: 'http_429',
    }))
  })

  it('conserve un état incertain si la finalisation du journal échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    rpc
      .mockResolvedValueOnce({ data: [{ claimed: true, lease_token: 'c'.repeat(64), attempt_count: 1 }], error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('database unavailable') })

    await expect(deliverClaimed(
      'rdv-reminder:booking-3:sms',
      'sms',
      async () => ({ ok: true, status: 'sent', retryable: false }),
    )).resolves.toBe('uncertain')
  })
})
