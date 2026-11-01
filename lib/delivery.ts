export type DeliveryStatus = 'sent' | 'failed' | 'uncertain' | 'disabled'

export interface DeliveryResult {
  ok: boolean
  status: DeliveryStatus
  retryable: boolean
  providerMessageId?: string
  errorCode?: string
}
export interface DeliveryBatchResult {
  ok: boolean
  deliveries: DeliveryResult[]
}

export function safeDeliveryLog(
  provider: 'resend' | 'twilio',
  operation: string,
  result: DeliveryResult,
): void {
  if (result.ok) return
  console.error('[delivery]', {
    provider,
    operation,
    status: result.status,
    errorCode: result.errorCode ?? 'unknown',
    retryable: result.retryable,
  })
}
