-- PHENO&CO - Migration 003 : sécurité, intégrité et parcours client
-- À valider sur une copie de staging avant toute exécution en production.
-- Cette migration s'arrête sans supprimer de données si des chevauchements
-- ou des doublons empêchent la création des contraintes.

begin;

create extension if not exists btree_gist;

-- Schéma réellement utilisé par l'application.
alter table public.rdv_bookings
  add column if not exists group_id text,
  add column if not exists person_label text;

alter table public.reservations
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists documents_committed_at timestamptz,
  add column if not exists marketing_consent boolean not null default false;

alter table public.clients
  add column if not exists telephone_normalized text,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz;

do $$
begin
  if exists (
    with raw_digits as (
      select id,
             case when telephone ~ '^[0-9+[:space:]().-]{7,30}$'
               then regexp_replace(telephone, '[^0-9]', '', 'g') end as digits
      from public.clients
    ), normalized as (
      select id,
        case
          when length(case
            when left(digits, 2) = '00' then substring(digits from 3)
            when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
            else digits
          end) between 7 and 15
          then '+' || case
            when left(digits, 2) = '00' then substring(digits from 3)
            when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
            else digits
          end
          else null
        end as phone
      from raw_digits
    )
    select phone
    from normalized
    where phone is not null
    group by phone
    having count(*) > 1
  ) then
    raise exception 'Migration interrompue : collisions de téléphones normalisés dans clients';
  end if;
end $$;

with raw_digits as (
  select id,
         case when telephone ~ '^[0-9+[:space:]().-]{7,30}$'
           then regexp_replace(telephone, '[^0-9]', '', 'g') end as digits
  from public.clients
), normalized as (
  select id,
    case
      when length(case
        when left(digits, 2) = '00' then substring(digits from 3)
        when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
        else digits
      end) between 7 and 15
      then '+' || case
        when left(digits, 2) = '00' then substring(digits from 3)
        when left(digits, 1) = '0' and length(digits) = 10 then '33' || substring(digits from 2)
        else digits
      end
      else null
    end as phone
  from raw_digits
)
update public.clients as clients
set telephone_normalized = normalized.phone
from normalized
where clients.id = normalized.id
  and clients.telephone_normalized is distinct from normalized.phone;

create unique index if not exists clients_telephone_normalized_unique
  on public.clients (telephone_normalized)
  where telephone_normalized is not null;

-- Tokens à usage unique : seule la service role et la fonction RPC y accèdent.
create table if not exists public.client_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists client_tokens_email_idx on public.client_tokens (email);
create unique index if not exists client_tokens_one_per_email on public.client_tokens (email);
create index if not exists client_tokens_expiry_idx on public.client_tokens (expires_at);
alter table public.client_tokens enable row level security;

create or replace function public.issue_client_token(
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_expires_at <= now() or p_expires_at > now() + interval '1 hour' then
    raise exception 'Paramètres de token invalides';
  end if;
  insert into public.client_tokens (email, token_hash, expires_at)
  values (p_email, p_token_hash, p_expires_at)
  on conflict (email) do update
  set token_hash = excluded.token_hash,
      expires_at = excluded.expires_at,
      used_at = null,
      created_at = now();
end;
$$;

revoke all on function public.issue_client_token(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.issue_client_token(text, text, timestamptz) to service_role;

create or replace function public.consume_client_token(p_token_hash text)
returns table(email text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  update public.client_tokens
  set used_at = now()
  where token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  returning client_tokens.email;
end;
$$;

revoke all on function public.consume_client_token(text) from public, anon, authenticated;
grant execute on function public.consume_client_token(text) to service_role;

-- Mise à jour atomique de la fiche client, sans expression PostgREST construite.
create or replace function public.upsert_client_activity(
  p_nom text,
  p_email text,
  p_telephone text,
  p_telephone_normalized text,
  p_activity text,
  p_marketing_consent boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email_id text;
  v_phone_id text;
  v_client_id text;
begin
  if p_activity not in ('rdv', 'location') then
    raise exception 'Activité invalide';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    least(p_email, p_telephone_normalized) || ':' || greatest(p_email, p_telephone_normalized), 0
  ));

  select id into v_email_id from public.clients where email = p_email for update;
  select id into v_phone_id from public.clients where telephone_normalized = p_telephone_normalized for update;
  if v_email_id is not null and v_phone_id is not null and v_email_id <> v_phone_id then
    raise exception 'Conflit entre les identifiants client';
  end if;
  v_client_id := coalesce(v_email_id, v_phone_id);

  if v_client_id is null then
    insert into public.clients (
      nom, email, telephone, telephone_normalized, last_rdv_at, rdv_count, location_count,
      marketing_consent, marketing_consent_at
    ) values (
      p_nom, p_email, p_telephone, p_telephone_normalized,
      case when p_activity = 'rdv' then now() else null end,
      case when p_activity = 'rdv' then 1 else 0 end,
      case when p_activity = 'location' then 1 else 0 end,
      coalesce(p_marketing_consent, false),
      case when p_marketing_consent is true then now() else null end
    );
  else
    update public.clients
    set nom = p_nom,
        email = p_email,
        telephone = p_telephone,
        telephone_normalized = p_telephone_normalized,
        last_rdv_at = case when p_activity = 'rdv' then now() else last_rdv_at end,
        rdv_count = rdv_count + case when p_activity = 'rdv' then 1 else 0 end,
        location_count = location_count + case when p_activity = 'location' then 1 else 0 end,
        marketing_consent = coalesce(p_marketing_consent, marketing_consent),
        marketing_consent_at = case
          when p_marketing_consent is true then now()
          when p_marketing_consent is false then null
          else marketing_consent_at
        end,
        updated_at = now()
    where id = v_client_id;
  end if;
end;
$$;

revoke all on function public.upsert_client_activity(text, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.upsert_client_activity(text, text, text, text, text, boolean) to service_role;

create or replace function public.search_clients_admin(
  p_query text,
  p_activity text,
  p_sort text,
  p_offset integer,
  p_limit integer
)
returns table(
  id text, nom text, email text, telephone text, rdv_count integer,
  location_count integer, last_rdv_at timestamptz, created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with filtered as materialized (
    select c.id, c.nom, c.email, c.telephone, c.rdv_count, c.location_count,
           c.last_rdv_at, c.created_at
    from public.clients c
    where (
    coalesce(p_query, '') = ''
    or c.nom ilike '%' || p_query || '%'
    or c.email ilike '%' || p_query || '%'
    or c.telephone ilike '%' || p_query || '%'
    )
    and case p_activity
      when 'rdv' then c.rdv_count > 0
      when 'location' then c.location_count > 0
      when 'inactive' then c.last_rdv_at is null or c.last_rdv_at < now() - interval '90 days'
      else true
    end
  ), counted as (
    select count(*)::bigint as total_count from filtered
  ), page as (
    select f.* from filtered f
    order by
      case when p_sort = 'name' then lower(f.nom) end asc,
      case when p_sort = 'rdv' then f.rdv_count end desc,
      case when p_sort = 'rdv' then lower(f.nom) end asc,
      case when p_sort = 'recent' then f.last_rdv_at end desc nulls last,
      f.id asc
    offset greatest(coalesce(p_offset, 0), 0)
    limit least(greatest(coalesce(p_limit, 30), 1), 100)
  )
  select page.id, page.nom, page.email, page.telephone, page.rdv_count,
         page.location_count, page.last_rdv_at, page.created_at, counted.total_count
  from counted left join page on true
  order by
    case when p_sort = 'name' then lower(page.nom) end asc,
    case when p_sort = 'rdv' then page.rdv_count end desc,
    case when p_sort = 'rdv' then lower(page.nom) end asc,
    case when p_sort = 'recent' then page.last_rdv_at end desc nulls last,
    page.id asc;
$$;

revoke all on function public.search_clients_admin(text, text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_clients_admin(text, text, text, integer, integer) to service_role;

-- Limitation distribuée et atomique, sans stocker l'adresse IP en clair.
create table if not exists public.api_rate_limits (
  key text primary key,
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null
);
alter table public.api_rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_key !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 1000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;

  insert into public.api_rate_limits as limits (key, request_count, window_started_at)
  values (p_key, 1, now())
  on conflict (key) do update
  set request_count = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else limits.request_count + 1
      end,
      window_started_at = case
        when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else limits.window_started_at
      end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Les dates deviennent de vraies dates ; PostgREST continue de les sérialiser en YYYY-MM-DD.
alter table public.rdv_bookings alter column date type date using date::date;
alter table public.reservations alter column date_debut type date using date_debut::date;
alter table public.reservations alter column date_fin type date using date_fin::date;
alter table public.schedule_closures alter column date type date using date::date;
alter table public.schedule_blocks alter column date type date using date::date;

alter table public.rdv_bookings
  add column if not exists slot_start_minutes integer generated always as (
    split_part(slot, ':', 1)::integer * 60 + split_part(slot, ':', 2)::integer
  ) stored,
  add column if not exists slot_end_minutes integer generated always as (
    split_part(slot, ':', 1)::integer * 60 + split_part(slot, ':', 2)::integer + greatest(total_duration, 30)
  ) stored;

do $$
begin
  if exists (
    select 1
    from public.rdv_bookings a
    join public.rdv_bookings b on a.id < b.id and a.date = b.date
    where a.status <> 'cancelled' and b.status <> 'cancelled'
      and int4range(a.slot_start_minutes, a.slot_end_minutes, '[)')
          && int4range(b.slot_start_minutes, b.slot_end_minutes, '[)')
  ) then
    raise exception 'Migration interrompue : rendez-vous existants en chevauchement';
  end if;
end $$;

alter table public.rdv_bookings drop constraint if exists rdv_bookings_date_slot_unique;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rdv_bookings_no_overlap') then
    alter table public.rdv_bookings
      add constraint rdv_bookings_no_overlap
      exclude using gist (
        date with =,
        int4range(slot_start_minutes, slot_end_minutes, '[)') with &&
      ) where (status <> 'cancelled');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rdv_bookings_duration_valid') then
    alter table public.rdv_bookings
      add constraint rdv_bookings_duration_valid check (total_duration between 0 and 480);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rdv_bookings_slot_valid') then
    alter table public.rdv_bookings
      add constraint rdv_bookings_slot_valid check (slot ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$');
  end if;
end $$;

create index if not exists rdv_bookings_group_idx on public.rdv_bookings (group_id) where group_id is not null;

-- Les tables privées restent inaccessibles aux rôles navigateur.
revoke all on table public.client_tokens, public.api_rate_limits from anon, authenticated;

commit;

-- Après validation, une tâche planifiée peut purger les fenêtres et tokens expirés :
-- delete from api_rate_limits where window_started_at < now() - interval '2 days';
-- delete from client_tokens where expires_at < now() - interval '7 days';
