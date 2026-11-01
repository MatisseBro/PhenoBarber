-- ============================================================
-- PHENO&CO — Supabase schema complet
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ----------------------------------------------------------
-- 1. Location de fauteuils (table historique)
-- ----------------------------------------------------------
create table if not exists reservations (
  id             text primary key,
  created_at     timestamptz not null default now(),
  nom            text not null,
  email          text not null,
  telephone      text not null,
  type_duration  text not null,
  formule        text not null,
  pack           text not null,
  date_debut     text not null,
  date_fin       text,
  heure_debut    text,
  heure_fin      text,
  statut_pro     text not null,
  experience     text not null,
  specialites    text[] not null,
  total_ht       numeric(10,2) not null,
  tva            numeric(10,2) not null,
  total_ttc      numeric(10,2) not null,
  acompte        numeric(10,2) not null,
  status         text not null default 'pending',
  notes          text
);

alter table reservations enable row level security;

-- ----------------------------------------------------------
-- 2. Réservations RDV coupe
-- ----------------------------------------------------------
create table if not exists rdv_bookings (
  id               text primary key,
  created_at       timestamptz not null default now(),
  nom              text not null,
  email            text not null,
  telephone        text not null,
  categorie        text not null check (categorie in ('homme','femme','enfant')),
  prestation       text not null,
  prestation_label text not null,
  degrade          text,
  degrade_label    text,
  options          text[] not null default '{}',
  options_labels   text[] not null default '{}',
  total_price      numeric(10,2) not null,
  total_duration   int not null,
  date             text not null,
  slot             text not null,
  status           text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  notes            text,
  constraint rdv_bookings_date_slot_unique unique (date, slot)
);

alter table rdv_bookings enable row level security;

-- Index pour requêtes fréquentes par date
create index if not exists rdv_bookings_date_idx on rdv_bookings (date);
create index if not exists rdv_bookings_status_idx on rdv_bookings (status);

-- ----------------------------------------------------------
-- 3. Configuration des créneaux horaires
-- ----------------------------------------------------------
create table if not exists schedule_config (
  id          text primary key default 'main',  -- singleton, toujours id='main'
  open_days   int[] not null default '{2,3,4,5,6}',
  slots       text[] not null default '{"10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","16:00","16:30","17:00","17:30"}',
  updated_at  timestamptz not null default now()
);

alter table schedule_config enable row level security;

-- Insérer la config par défaut si vide
insert into schedule_config (id) values ('main') on conflict do nothing;

-- ----------------------------------------------------------
-- 4. Fermetures exceptionnelles
-- ----------------------------------------------------------
create table if not exists schedule_closures (
  id         text primary key default gen_random_uuid()::text,
  date       text not null unique,
  reason     text not null default '',
  created_at timestamptz not null default now()
);

alter table schedule_closures enable row level security;

-- ----------------------------------------------------------
-- 5. Bloquages manuels de créneaux
-- ----------------------------------------------------------
create table if not exists schedule_blocks (
  id         text primary key default gen_random_uuid()::text,
  date       text not null,
  slot       text not null,
  reason     text not null default '',
  created_at timestamptz not null default now(),
  constraint schedule_blocks_date_slot_unique unique (date, slot)
);

alter table schedule_blocks enable row level security;

-- ============================================================
-- NOTE : Toutes les tables sont en RLS complet.
-- Seule la SERVICE ROLE KEY (côté serveur) peut lire/écrire.
-- Aucune anon key n'a accès — aucune policy publique.
-- ============================================================
