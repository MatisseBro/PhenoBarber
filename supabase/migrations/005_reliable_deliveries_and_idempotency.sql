-- PHENO&CO - Livraison fiable des notifications et idempotence des locations.
-- À tester sur une base isolée puis à appliquer après 003 et 004 uniquement sur autorisation.

begin;

alter table public.reservations
  add column if not exists idempotency_key text,
  add column if not exists request_fingerprint text;

create unique index if not exists reservations_idempotency_key_unique
  on public.reservations (idempotency_key)
  where idempotency_key is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reservations'::regclass
      and conname = 'reservations_idempotency_key_valid'
  ) then
    alter table public.reservations add constraint reservations_idempotency_key_valid
      check (idempotency_key is null or idempotency_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reservations'::regclass
      and conname = 'reservations_request_fingerprint_valid'
  ) then
    alter table public.reservations add constraint reservations_request_fingerprint_valid
      check (request_fingerprint is null or request_fingerprint ~ '^[0-9a-f]{64}$');
  end if;
end $$;

create table if not exists public.notification_deliveries (
  delivery_key text primary key,
  channel text not null check (channel in ('email', 'sms')),
  status text not null check (status in ('processing', 'sent', 'failed', 'uncertain')),
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  retryable boolean not null default false,
  lease_token text,
  lease_expires_at timestamptz,
  next_retry_at timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(delivery_key) between 1 and 200),
  check (lease_token is null or lease_token ~ '^[0-9a-f]{64}$'),
  check (provider_message_id is null or length(provider_message_id) <= 200),
  check (last_error_code is null or length(last_error_code) <= 100)
);

create index if not exists notification_deliveries_retry_idx
  on public.notification_deliveries (next_retry_at)
  where status in ('failed', 'uncertain');

alter table public.notification_deliveries enable row level security;
revoke all on table public.notification_deliveries from public, anon, authenticated;
grant select, insert, update, delete on table public.notification_deliveries to service_role;

create or replace function public.claim_notification_delivery(
  p_delivery_key text,
  p_channel text,
  p_max_attempts integer,
  p_lease_seconds integer
)
returns table(claimed boolean, lease_token text, attempt_count integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row public.notification_deliveries%rowtype;
  new_token text;
begin
  if p_delivery_key is null or length(p_delivery_key) not between 1 and 200
     or p_channel not in ('email', 'sms')
     or p_max_attempts not between 1 and 20
     or p_lease_seconds not between 30 and 3600 then
    raise exception 'Invalid delivery claim';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_delivery_key, 0));
  select * into current_row
  from public.notification_deliveries
  where delivery_key = p_delivery_key
  for update;

  if not found then
    new_token := encode(gen_random_bytes(32), 'hex');
    insert into public.notification_deliveries (
      delivery_key, channel, status, attempt_count, retryable,
      lease_token, lease_expires_at, updated_at
    ) values (
      p_delivery_key, p_channel, 'processing', 1, false,
      new_token, now() + make_interval(secs => p_lease_seconds), now()
    );
    return query select true, new_token, 1;
    return;
  end if;

  if current_row.channel <> p_channel or current_row.status = 'sent' then
    return query select false, null::text, current_row.attempt_count;
    return;
  end if;

  if current_row.status = 'processing' then
    if current_row.lease_expires_at > now() then
      return query select false, null::text, current_row.attempt_count;
      return;
    end if;
    if p_channel = 'sms' then
      update public.notification_deliveries
      set status = 'uncertain', retryable = false, lease_token = null,
          lease_expires_at = null, last_error_code = 'lease_expired_after_sms_attempt', updated_at = now()
      where delivery_key = p_delivery_key;
      return query select false, null::text, current_row.attempt_count;
      return;
    end if;
  elsif current_row.status in ('failed', 'uncertain') then
    if not current_row.retryable
       or current_row.next_retry_at is null
       or current_row.next_retry_at > now()
       or current_row.attempt_count >= p_max_attempts
       or (current_row.status = 'uncertain' and now() >= current_row.created_at + interval '23 hours') then
      return query select false, null::text, current_row.attempt_count;
      return;
    end if;
  else
    return query select false, null::text, current_row.attempt_count;
    return;
  end if;

  if current_row.attempt_count >= p_max_attempts then
    return query select false, null::text, current_row.attempt_count;
    return;
  end if;

  new_token := encode(gen_random_bytes(32), 'hex');
  update public.notification_deliveries
  set status = 'processing', attempt_count = current_row.attempt_count + 1,
      retryable = false, lease_token = new_token,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      next_retry_at = null, updated_at = now()
  where delivery_key = p_delivery_key;

  return query select true, new_token, current_row.attempt_count + 1;
end;
$$;

create or replace function public.finalize_notification_delivery(
  p_delivery_key text,
  p_lease_token text,
  p_status text,
  p_retryable boolean,
  p_retry_after_seconds integer,
  p_provider_message_id text,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected integer;
begin
  if p_status not in ('sent', 'failed', 'uncertain')
     or p_lease_token !~ '^[0-9a-f]{64}$'
     or p_retry_after_seconds not between 0 and 86400 then
    raise exception 'Invalid delivery finalization';
  end if;

  update public.notification_deliveries
  set status = p_status,
      retryable = case when p_status = 'sent' then false else coalesce(p_retryable, false) end,
      lease_token = null,
      lease_expires_at = null,
      next_retry_at = case
        when p_status <> 'sent' and coalesce(p_retryable, false)
          then now() + make_interval(secs => p_retry_after_seconds)
        else null
      end,
      provider_message_id = left(p_provider_message_id, 200),
      last_error_code = left(p_error_code, 100),
      sent_at = case when p_status = 'sent' then now() else sent_at end,
      updated_at = now()
  where delivery_key = p_delivery_key
    and status = 'processing'
    and lease_token = p_lease_token;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create or replace function public.revoke_client_token(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected integer;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  delete from public.client_tokens where token_hash = p_token_hash and used_at is null;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

-- Purge uniquement les données techniques dont la durée est déterminée.
-- La suppression des clients et réservations reste suspendue à la politique RGPD validée.
create or replace function public.purge_expired_operational_data()
returns table(rate_limits_deleted integer, client_tokens_deleted integer, deliveries_deleted integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_rate_limits integer;
  deleted_client_tokens integer;
  deleted_deliveries integer;
begin
  delete from public.api_rate_limits
  where window_started_at < now() - interval '2 days';
  get diagnostics deleted_rate_limits = row_count;

  delete from public.client_tokens
  where expires_at < now() - interval '7 days';
  get diagnostics deleted_client_tokens = row_count;

  delete from public.notification_deliveries
  where (status in ('sent', 'failed') and updated_at < now() - interval '90 days')
     or (status = 'uncertain' and updated_at < now() - interval '365 days');
  get diagnostics deleted_deliveries = row_count;

  return query select deleted_rate_limits, deleted_client_tokens, deleted_deliveries;
end;
$$;

revoke all on function public.claim_notification_delivery(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.finalize_notification_delivery(text, text, text, boolean, integer, text, text) from public, anon, authenticated;
revoke all on function public.revoke_client_token(text) from public, anon, authenticated;
revoke all on function public.purge_expired_operational_data() from public, anon, authenticated;
grant execute on function public.claim_notification_delivery(text, text, integer, integer) to service_role;
grant execute on function public.finalize_notification_delivery(text, text, text, boolean, integer, text, text) to service_role;
grant execute on function public.revoke_client_token(text) to service_role;
grant execute on function public.purge_expired_operational_data() to service_role;

commit;
