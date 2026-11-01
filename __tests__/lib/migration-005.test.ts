import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/005_reliable_deliveries_and_idempotency.sql', import.meta.url),
  'utf8',
)

describe('migration 005 safety contract', () => {
  it('prépare un claim atomique, un bail et quatre états de livraison', () => {
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain("status in ('processing', 'sent', 'failed', 'uncertain')")
    expect(sql).toContain('lease_expires_at')
    expect(sql).toContain('attempt_count')
    expect(sql).toContain('finalize_notification_delivery')
  })

  it('garde le journal privé et réserve les RPC à service_role', () => {
    expect(sql).toContain('alter table public.notification_deliveries enable row level security')
    expect(sql).toContain('revoke all on table public.notification_deliveries from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.claim_notification_delivery')
    expect(sql).toContain('to service_role')
  })

  it('prépare l’idempotence des locations et une purge opérationnelle bornée', () => {
    expect(sql).toContain('reservations_idempotency_key_unique')
    expect(sql).toContain('request_fingerprint')
    expect(sql).toContain('purge_expired_operational_data')
    expect(sql).not.toMatch(/delete from public\.(clients|rdv_bookings|reservations)\b/i)
  })
})
