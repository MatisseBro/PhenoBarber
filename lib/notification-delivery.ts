import type { DeliveryResult } from './delivery'
import { getSupabase } from './supabase'

type DeliveryChannel = 'email' | 'sms'
export type ClaimedDeliveryState = 'sent' | 'failed' | 'uncertain' | 'skipped'

interface ClaimResult {
  claimed: boolean
  lease_token: string | null
  attempt_count: number
}
export interface DeliveryExecutionResult {
  state: ClaimedDeliveryState
}

export async function deliverClaimed(
  deliveryKey: string,
  channel: DeliveryChannel,
  send: (idempotencyKey: string) => Promise<DeliveryResult>,
): Promise<ClaimedDeliveryState> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('claim_notification_delivery', {
    p_delivery_key: deliveryKey,
    p_channel: channel,
    p_max_attempts: 3,
    p_lease_seconds: 300,
  })
  if (error) {
    console.error('[delivery] claim_failed', { channel })
    return 'failed'
  }

  const claim = (Array.isArray(data) ? data[0] : data) as ClaimResult | null
  if (!claim?.claimed || !claim.lease_token) return 'skipped'

  let result: DeliveryResult
  try {
    result = await send(deliveryKey)
  } catch {
    result = { ok: false, status: 'uncertain', retryable: channel === 'email', errorCode: 'unexpected_error' }
  }

  const retryAfterSeconds = result.retryable
    ? Math.min(60 * 60, 60 * (2 ** Math.max(0, claim.attempt_count - 1)))
    : 0
  const { error: finalizeError } = await supabase.rpc('finalize_notification_delivery', {
    p_delivery_key: deliveryKey,
    p_lease_token: claim.lease_token,
    p_status: result.ok ? 'sent' : result.status === 'uncertain' ? 'uncertain' : 'failed',
    p_retryable: result.retryable,
    p_retry_after_seconds: retryAfterSeconds,
    p_provider_message_id: result.providerMessageId ?? null,
    p_error_code: result.errorCode ?? null,
  })
  if (finalizeError) {
    console.error('[delivery] finalize_failed', { channel, providerAccepted: result.ok })
    return 'uncertain'
  }
  if (result.ok) return 'sent'
  return result.status === 'uncertain' ? 'uncertain' : 'failed'
}
