-- PHENO & CO — Audit Supabase de préproduction strictement en lecture seule
-- À copier tel quel dans le SQL Editor du projet de production.
-- Ce script ne crée, ne modifie et ne supprime aucun objet ou aucune ligne.
-- Il ne retourne aucune identité, adresse email, téléphone, token ou réservation.

begin transaction read only;
set local statement_timeout = '30s';
set local lock_timeout = '3s';

-- 01. Environnement PostgreSQL et extensions utiles.
select
  '01_environment' as audit_section,
  current_database() as database_name,
  current_setting('server_version') as server_version,
  current_setting('server_version_num') as server_version_num,
  current_user as executing_role,
  current_setting('transaction_read_only') as transaction_read_only;

select
  '01_extensions' as audit_section,
  extname,
  extversion
from pg_extension
where extname in ('btree_gist', 'pgcrypto', 'uuid-ossp')
order by extname;

-- Signale la présence de l'historique Supabase sans lire son contenu.
select
  '01_migration_registry' as audit_section,
  to_regclass('supabase_migrations.schema_migrations') is not null as registry_exists;

-- 02. Tables et colonnes du schéma public.
select
  '02_tables' as audit_section,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total_size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

select
  '02_columns' as audit_section,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  is_generated,
  generation_expression,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- Colonnes minimales utilisées par l'application. Une ligne signifie une colonne manquante.
with expected(table_name, column_name) as (
  values
    ('api_rate_limits', 'key'), ('api_rate_limits', 'request_count'),
    ('api_rate_limits', 'window_started_at'),
    ('client_tokens', 'token_hash'), ('client_tokens', 'email'),
    ('client_tokens', 'expires_at'), ('client_tokens', 'used_at'),
    ('client_tokens', 'created_at'),
    ('clients', 'id'), ('clients', 'created_at'), ('clients', 'updated_at'),
    ('clients', 'nom'), ('clients', 'email'), ('clients', 'telephone'),
    ('clients', 'last_rdv_at'), ('clients', 'rdv_count'),
    ('clients', 'location_count'), ('clients', 'notes'),
    ('clients', 'telephone_normalized'), ('clients', 'marketing_consent'),
    ('clients', 'marketing_consent_at'),
    ('rdv_bookings', 'id'), ('rdv_bookings', 'created_at'),
    ('rdv_bookings', 'nom'), ('rdv_bookings', 'email'),
    ('rdv_bookings', 'telephone'), ('rdv_bookings', 'categorie'),
    ('rdv_bookings', 'prestation'), ('rdv_bookings', 'prestation_label'),
    ('rdv_bookings', 'degrade'), ('rdv_bookings', 'degrade_label'),
    ('rdv_bookings', 'options'), ('rdv_bookings', 'options_labels'),
    ('rdv_bookings', 'total_price'), ('rdv_bookings', 'total_duration'),
    ('rdv_bookings', 'date'), ('rdv_bookings', 'slot'),
    ('rdv_bookings', 'status'), ('rdv_bookings', 'notes'),
    ('rdv_bookings', 'group_id'), ('rdv_bookings', 'person_label'),
    ('rdv_bookings', 'slot_start_minutes'), ('rdv_bookings', 'slot_end_minutes'),
    ('reservations', 'id'), ('reservations', 'created_at'),
    ('reservations', 'nom'), ('reservations', 'email'),
    ('reservations', 'telephone'), ('reservations', 'type_duration'),
    ('reservations', 'formule'), ('reservations', 'pack'),
    ('reservations', 'date_debut'), ('reservations', 'date_fin'),
    ('reservations', 'heure_debut'), ('reservations', 'heure_fin'),
    ('reservations', 'statut_pro'), ('reservations', 'experience'),
    ('reservations', 'specialites'), ('reservations', 'total_ht'),
    ('reservations', 'tva'), ('reservations', 'total_ttc'),
    ('reservations', 'acompte'), ('reservations', 'status'),
    ('reservations', 'notes'), ('reservations', 'terms_accepted_at'),
    ('reservations', 'documents_committed_at'),
    ('reservations', 'marketing_consent'),
    ('schedule_blocks', 'id'), ('schedule_blocks', 'date'),
    ('schedule_blocks', 'slot'), ('schedule_blocks', 'reason'),
    ('schedule_closures', 'date'), ('schedule_closures', 'reason'),
    ('schedule_config', 'id'), ('schedule_config', 'open_days'),
    ('schedule_config', 'slots'), ('schedule_config', 'updated_at')
)
select
  '02_missing_application_columns' as audit_section,
  expected.table_name,
  expected.column_name
from expected
left join information_schema.columns actual
  on actual.table_schema = 'public'
 and actual.table_name = expected.table_name
 and actual.column_name = expected.column_name
where actual.column_name is null
order by expected.table_name, expected.column_name;

-- 03. Contraintes et index. Aucune définition ne contient de donnée métier.
select
  '03_constraints' as audit_section,
  c.conrelid::regclass::text as table_name,
  c.conname as constraint_name,
  case c.contype
    when 'p' then 'PRIMARY KEY'
    when 'u' then 'UNIQUE'
    when 'f' then 'FOREIGN KEY'
    when 'c' then 'CHECK'
    when 'x' then 'EXCLUDE'
    else c.contype::text
  end as constraint_type,
  c.convalidated as validated,
  c.condeferrable as deferrable,
  pg_get_constraintdef(c.oid, true) as definition
from pg_constraint c
join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public'
order by c.conrelid::regclass::text, c.conname;

select
  '03_indexes' as audit_section,
  t.relname as table_name,
  i.relname as index_name,
  x.indisprimary as is_primary,
  x.indisunique as is_unique,
  x.indisvalid as is_valid,
  x.indisready as is_ready,
  pg_get_indexdef(i.oid) as definition
from pg_index x
join pg_class i on i.oid = x.indexrelid
join pg_class t on t.oid = x.indrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
order by t.relname, i.relname;

-- Paires d'index portant sur les mêmes clés/prédicats : candidats à examiner, pas à supprimer automatiquement.
select
  '03_duplicate_index_candidates' as audit_section,
  t.relname as table_name,
  ia.relname as first_index,
  ib.relname as second_index
from pg_index a
join pg_index b
  on b.indrelid = a.indrelid
 and b.indexrelid > a.indexrelid
 and b.indkey = a.indkey
 and coalesce(pg_get_expr(b.indexprs, b.indrelid), '') = coalesce(pg_get_expr(a.indexprs, a.indrelid), '')
 and coalesce(pg_get_expr(b.indpred, b.indrelid), '') = coalesce(pg_get_expr(a.indpred, a.indrelid), '')
join pg_class t on t.oid = a.indrelid
join pg_class ia on ia.oid = a.indexrelid
join pg_class ib on ib.oid = b.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
order by t.relname, ia.relname, ib.relname;

-- 04. RLS, policies et droits des rôles applicatifs.
select
  '04_rls' as audit_section,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
group by c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;

select
  '04_policies' as audit_section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

with roles(role_name) as (
  values ('anon'), ('authenticated'), ('service_role')
), tables(table_name) as (
  values ('api_rate_limits'), ('client_tokens'), ('clients'), ('rdv_bookings'),
         ('reservations'), ('schedule_blocks'), ('schedule_closures'), ('schedule_config')
)
select
  '04_table_privileges' as audit_section,
  roles.role_name,
  tables.table_name,
  has_table_privilege(roles.role_name, format('public.%I', tables.table_name), 'SELECT') as can_select,
  has_table_privilege(roles.role_name, format('public.%I', tables.table_name), 'INSERT') as can_insert,
  has_table_privilege(roles.role_name, format('public.%I', tables.table_name), 'UPDATE') as can_update,
  has_table_privilege(roles.role_name, format('public.%I', tables.table_name), 'DELETE') as can_delete
from roles cross join tables
order by tables.table_name, roles.role_name;

-- 05. Fonctions RPC : volatilité, SECURITY DEFINER, search_path et ACL.
select
  '05_rpc_metadata' as audit_section,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_get_function_result(p.oid) as result_type,
  case p.provolatile when 'i' then 'IMMUTABLE' when 's' then 'STABLE' else 'VOLATILE' end as volatility,
  p.prosecdef as security_definer,
  p.proconfig as function_config,
  p.proacl as acl,
  md5(pg_get_functiondef(p.oid)) as definition_checksum
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'issue_client_token', 'consume_client_token', 'upsert_client_activity',
    'search_clients_admin', 'check_rate_limit'
  )
order by p.proname, pg_get_function_identity_arguments(p.oid);

with roles(role_name) as (
  values ('public'), ('anon'), ('authenticated'), ('service_role')
), functions as (
  select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'issue_client_token', 'consume_client_token', 'upsert_client_activity',
      'search_clients_admin', 'check_rate_limit'
    )
)
select
  '05_rpc_privileges' as audit_section,
  functions.proname as function_name,
  functions.args,
  roles.role_name,
  has_function_privilege(roles.role_name, functions.oid, 'EXECUTE') as can_execute
from functions cross join roles
order by functions.proname, functions.args, roles.role_name;

-- Appel de la seule RPC déclarée STABLE, dans une transaction READ ONLY et sans correspondance.
select
  '05_search_rpc_contract' as audit_section,
  count(*) as returned_rows,
  count(*) filter (where id is null) as null_page_rows,
  coalesce(max(total_count), 0) as total_count
from public.search_clients_admin(
  '__pheno_readonly_audit_no_match__', 'all', 'recent', 0, 1
);

-- 06. Cohérence clients et téléphones. Sortie exclusivement agrégée.
with raw as (
  select
    id,
    email,
    telephone_normalized,
    case
      when telephone ~ '^[0-9+[:space:]().-]{7,30}$'
      then regexp_replace(telephone, '[^0-9]', '', 'g')
    end as digits,
    rdv_count,
    location_count,
    marketing_consent,
    marketing_consent_at
  from public.clients
), normalized as (
  select *,
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
    end as expected_phone
  from raw
), collisions as (
  select expected_phone
  from normalized
  where expected_phone is not null
  group by expected_phone
  having count(*) > 1
), duplicate_emails as (
  select lower(email)
  from normalized
  where email is not null
  group by lower(email)
  having count(*) > 1
)
select
  '06_client_integrity' as audit_section,
  (select count(*) from normalized) as client_count,
  (select count(*) from normalized where expected_phone is null) as invalid_phone_count,
  (select count(*) from normalized where telephone_normalized is null) as missing_normalized_phone_count,
  (select count(*) from normalized where telephone_normalized is distinct from expected_phone) as mismatched_phone_count,
  (select count(*) from collisions) as normalized_phone_collision_groups,
  (select count(*) from duplicate_emails) as case_insensitive_duplicate_email_groups,
  (select count(*) from normalized where rdv_count < 0 or location_count < 0) as negative_counter_count,
  (select count(*) from normalized where not marketing_consent and marketing_consent_at is not null) as inconsistent_consent_count;

-- 07. Cohérence rendez-vous, groupes et exclusion des chevauchements.
with active as (
  select
    id,
    date,
    slot,
    status,
    total_duration,
    slot_start_minutes,
    slot_end_minutes,
    group_id,
    email,
    telephone,
    int4range(slot_start_minutes, slot_end_minutes, '[)') as occupied
  from public.rdv_bookings
  where status <> 'cancelled'
), overlap_pairs as (
  select 1
  from active a
  join active b on a.id < b.id and a.date = b.date and a.occupied && b.occupied
), inconsistent_groups as (
  select group_id
  from public.rdv_bookings
  where group_id is not null
  group by group_id
  having count(distinct email) > 1 or count(distinct telephone) > 1
)
select
  '07_booking_integrity' as audit_section,
  (select count(*) from public.rdv_bookings) as booking_count,
  (select count(*) from overlap_pairs) as overlap_pair_count,
  (select count(*) from public.rdv_bookings where slot !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$') as invalid_slot_count,
  (select count(*) from public.rdv_bookings where total_duration not between 0 and 480) as invalid_duration_count,
  (select count(*) from public.rdv_bookings where status not in ('pending', 'confirmed', 'cancelled')) as invalid_status_count,
  (select count(*) from public.rdv_bookings where categorie not in ('homme', 'femme', 'enfant')) as invalid_category_count,
  (select count(*) from public.rdv_bookings
   where slot_start_minutes <> split_part(slot, ':', 1)::integer * 60 + split_part(slot, ':', 2)::integer
      or slot_end_minutes <> split_part(slot, ':', 1)::integer * 60 + split_part(slot, ':', 2)::integer + greatest(total_duration, 30))
    as generated_minute_mismatch_count,
  (select count(*) from inconsistent_groups) as inconsistent_group_count;

-- 08. Cohérence locations et planning, sans retourner les lignes concernées.
select
  '08_reservation_integrity' as audit_section,
  count(*) as reservation_count,
  count(*) filter (where date_fin is not null and date_fin < date_debut) as inverted_date_range_count,
  count(*) filter (where total_ht < 0 or tva < 0 or total_ttc < 0 or acompte < 0) as negative_amount_count,
  count(*) filter (where acompte > total_ttc) as excessive_deposit_count,
  count(*) filter (where status not in ('pending', 'confirmed', 'cancelled')) as invalid_status_count
from public.reservations;

select
  '08_schedule_integrity' as audit_section,
  (select count(*) from public.schedule_config) as config_row_count,
  (select count(*) from public.schedule_config where id = 'main') as main_config_count,
  (select count(*) from public.schedule_config
   where exists (select 1 from unnest(open_days) day where day not between 0 and 6)) as invalid_open_day_config_count,
  (select count(*) from public.schedule_config
   where exists (select 1 from unnest(slots) value where value !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$')) as invalid_config_slot_count,
  (select count(*) from public.schedule_blocks
   where slot !~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$') as invalid_block_slot_count,
  (select count(*) from public.schedule_blocks b
   join public.schedule_closures c on c.date = b.date) as blocks_on_closed_dates_count;

-- ROLLBACK ferme explicitement la transaction même si elle est READ ONLY.
rollback;
