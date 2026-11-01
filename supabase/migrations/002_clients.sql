-- ============================================================
-- PHENO&CO — Migration 002 : Table Clients
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create table if not exists clients (
  id               text primary key default gen_random_uuid()::text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  nom              text not null,
  email            text,
  telephone        text,
  last_rdv_at      timestamptz,
  rdv_count        int not null default 0,
  location_count   int not null default 0,
  notes            text,
  constraint clients_email_unique      unique (email),
  constraint clients_telephone_unique  unique (telephone)
);

alter table clients enable row level security;

create index if not exists clients_email_idx    on clients (email);
create index if not exists clients_telephone_idx on clients (telephone);
create index if not exists clients_last_rdv_idx  on clients (last_rdv_at);

-- ============================================================
-- NOTE : RLS activé — seule la service role key peut accéder.
-- ============================================================
