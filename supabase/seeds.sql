-- ============================================================
-- PHENO&CO — Seeds de démonstration
-- À exécuter dans Supabase > SQL Editor
-- Données réalistes pour tester le dashboard admin
-- ============================================================

-- ── Création table clients si elle n'existe pas encore ────────────────────────
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
create index if not exists clients_email_idx     on clients (email);
create index if not exists clients_telephone_idx on clients (telephone);
create index if not exists clients_last_rdv_idx  on clients (last_rdv_at);

-- ── Nettoyage (optionnel — décommenter si besoin de repartir à zéro) ──────────
-- truncate rdv_bookings restart identity cascade;
-- truncate reservations restart identity cascade;
-- truncate clients restart identity cascade;


-- ============================================================
-- 1. RDV COIFFURE (rdv_bookings)
-- ============================================================

insert into rdv_bookings (
  id, created_at, nom, email, telephone,
  categorie, prestation, prestation_label,
  degrade, degrade_label,
  options, options_labels,
  total_price, total_duration,
  date, slot, status
) values

-- ── Passé confirmé : Karim, Dégradé skin fade + shampoing ───────────────────
(
  'rdv-001', now() - interval '18 days',
  'Karim Benali', 'karim.benali@gmail.com', '0612345601',
  'homme', 'degrade', 'Dégradé',
  'skin', 'Skin fade',
  '{sham}', '{Shampoing}',
  35, 40,
  '2026-09-15', '10:00', 'confirmed'
),

-- ── Passé confirmé : Marie, Big Chop + shampoing ────────────────────────────
(
  'rdv-002', now() - interval '15 days',
  'Marie Dubois', 'marie.dubois@hotmail.fr', '0623456702',
  'femme', 'big-chop-s', 'Big Chop + shampoing + coupe',
  null, null,
  '{}', '{}',
  55, 75,
  '2026-09-18', '11:00', 'confirmed'
),

-- ── Passé annulé : Julien, Buzz Cut ─────────────────────────────────────────
(
  'rdv-003', now() - interval '13 days',
  'Julien Moreau', 'julien.moreau@gmail.com', '0678901203',
  'homme', 'buzz', 'Buzz Cut',
  null, null,
  '{}', '{}',
  25, 25,
  '2026-09-20', '10:00', 'cancelled'
),

-- ── Passé confirmé : Patricia, Horaire (location test RDV) ──────────────────
(
  'rdv-004', now() - interval '10 days',
  'Aminata Traoré', 'aminata.traore@yahoo.fr', '0645678904',
  'femme', 'tresses-f', 'Tresses plaquées',
  null, null,
  '{sham}', '{Shampoing}',
  40, 100,
  '2026-09-25', '11:00', 'confirmed'
),

-- ── Passé confirmé : Isabelle, Forfait Curly ────────────────────────────────
(
  'rdv-005', now() - interval '8 days',
  'Isabelle Renard', 'isabelle.renard@gmail.com', '0656789005',
  'femme', 'forfait-f-curl', 'Forfait Curly / Boucles',
  null, null,
  '{ssc}', '{Shampoing + soin + coiffage}',
  90, 120,
  '2026-09-28', '13:00', 'confirmed'
),

-- ── Passé confirmé : Youssef, Forfait soin + shampoing ──────────────────────
(
  'rdv-006', now() - interval '5 days',
  'Youssef Hamdi', 'youssef.hamdi@outlook.com', '0667890106',
  'homme', 'forfait-soin', 'Forfait complet — Coupe + shampoing + coiffage',
  null, null,
  '{sham}', '{Shampoing}',
  55, 70,
  '2026-09-30', '11:00', 'confirmed'
),

-- ── À venir (en attente) : Lucas, Coupe + barbe + twist ─────────────────────
(
  'rdv-007', now() - interval '2 days',
  'Lucas Martin', 'lucas.martin@gmail.com', '0698765407',
  'homme', 'coupe-barbe-c', 'Coupe + barbe complète',
  null, null,
  '{twist}', '{Twist éponge}',
  40, 70,
  '2026-10-06', '14:00', 'pending'
),

-- ── À venir (confirmé) : Fatoumata, Forfait Curly ───────────────────────────
(
  'rdv-008', now() - interval '1 day',
  'Fatoumata Konaté', 'fatoumata.konate@gmail.com', '0687654308',
  'femme', 'forfait-f-curl', 'Forfait Curly / Boucles',
  null, null,
  '{ssc}', '{Shampoing + soin + coiffage}',
  90, 120,
  '2026-10-07', '11:30', 'confirmed'
),

-- ── À venir (confirmé) : Noah, Dégradé enfant ───────────────────────────────
(
  'rdv-009', now() - interval '3 days',
  'Noah Petit', 'christelle.petit@gmail.com', '0676543209',
  'enfant', 'degrade-e', 'Dégradé enfant',
  null, null,
  '{}', '{}',
  20, 30,
  '2026-10-08', '10:00', 'confirmed'
),

-- ── À venir (en attente) : Ismaël, Waves ────────────────────────────────────
(
  'rdv-010', now() - interval '1 day',
  'Ismaël Diallo', 'ismael.diallo@gmail.com', '0665432110',
  'homme', 'waves', 'Waves',
  null, null,
  '{}', '{}',
  30, 60,
  '2026-10-09', '16:00', 'pending'
),

-- ── À venir (confirmé) : Sarah, Highlights Femme ────────────────────────────
(
  'rdv-011', now() - interval '4 days',
  'Sarah Lefebvre', 'sarah.lefebvre@hotmail.com', '0654321011',
  'femme', 'color-f', 'Highlights / Mèches',
  null, null,
  '{}', '{}',
  55, 90,
  '2026-10-10', '13:00', 'confirmed'
),

-- ── À venir (en attente) : Thomas, Dégradé classique ────────────────────────
(
  'rdv-012', now(),
  'Thomas Bernard', 'thomas.bernard@gmail.com', '0643210912',
  'homme', 'degrade', 'Dégradé',
  'classique', 'Dégradé classique',
  '{design-s}', '{Design simple}',
  30, 35,
  '2026-10-11', '10:30', 'pending'
),

-- ── À venir (confirmé) : Kevin, Dégradé high + design complexe ──────────────
(
  'rdv-013', now() - interval '2 days',
  'Kevin Nguessan', 'kevin.nguessan@gmail.com', '0632109813',
  'homme', 'degrade', 'Dégradé',
  'high', 'High fade',
  '{design-c,contour}', '{Design complexe,Contour + dégradé barbe}',
  43, 45,
  '2026-10-15', '10:00', 'confirmed'
),

-- ── À venir (en attente) : Emma, Forfait Femme ──────────────────────────────
(
  'rdv-014', now() - interval '1 day',
  'Emma Leblanc', 'emma.leblanc@gmail.com', '0621098714',
  'femme', 'forfait-f', 'Forfait complet — Coupe + shampoing + soin + coiffage',
  null, null,
  '{}', '{}',
  55, 75,
  '2026-10-14', '14:30', 'pending'
),

-- ── À venir (en attente) : Chloé, Coupe enfant ──────────────────────────────
(
  'rdv-015', now(),
  'Chloé Roux', 'marie.roux@gmail.com', '0610987615',
  'enfant', 'coupe-e', 'Coupe enfant — moins de 15 ans',
  null, null,
  '{}', '{}',
  15, 25,
  '2026-10-18', '10:30', 'pending'
);


-- ============================================================
-- 2. RÉSERVATIONS LOCATION FAUTEUIL (reservations)
-- ============================================================

insert into reservations (
  id, created_at,
  nom, email, telephone,
  type_duration, formule, pack,
  date_debut, date_fin, heure_debut, heure_fin,
  statut_pro, experience, specialites,
  total_ht, tva, total_ttc, acompte,
  status, notes
) values

-- ── Passé confirmé : Patricia, Horaire 3h, 1 jour ───────────────────────────
(
  'loc-001', now() - interval '8 days',
  'Patricia Dumont', 'patricia.dumont@gmail.com', '0611223344',
  'court', 'horaire', 'aucun',
  '2026-09-25', null, '10:00', '13:00',
  'auto-entrepreneur', '5-10', '{mixte}',
  30.00, 6.00, 36.00, 18.00,
  'confirmed', 'Première visite — test du salon pour possibilité de contrat mensuel'
),

-- ── Passé confirmé : Isabelle, Demi-journée + essentiel ─────────────────────
(
  'loc-002', now() - interval '11 days',
  'Isabelle Renard', 'isabelle.renard@pro.fr', '0622334455',
  'court', 'demi-journee', 'essentiel',
  '2026-09-22', null, '10:00', '14:00',
  'auto-entrepreneur', '3-5', '{coloriste}',
  55.00, 11.00, 66.00, 33.00,
  'cancelled', null
),

-- ── Passé confirmé : Mamadou, Mensuel octobre + premium ─────────────────────
(
  'loc-003', now() - interval '30 days',
  'Mamadou Coulibaly', 'mamadou.coulibaly@barbershop.fr', '0633445566',
  'long', 'mois', 'premium',
  '2026-10-01', '2026-10-31', '10:00', '18:00',
  'societe', '10+', '{barber,afro,design}',
  1955.00, 391.00, 2346.00, 586.50,
  'confirmed', 'Contrat mensuel renouvelable. Spécialiste dégradés afro et tresses. Clientèle fidèle.'
),

-- ── En cours (confirmé) : Sofiane, Semaine + premium ────────────────────────
(
  'loc-004', now() - interval '5 days',
  'Sofiane Belkacem', 'sofiane.belkacem@gmail.com', '0644556677',
  'long', 'semaine', 'premium',
  '2026-10-06', '2026-10-10', '10:00', '18:00',
  'auto-entrepreneur', '5-10', '{barber,design}',
  450.00, 90.00, 540.00, 135.00,
  'confirmed', null
),

-- ── À venir (confirmé) : Jessica, Demi-journée + essentiel ──────────────────
(
  'loc-005', now() - interval '3 days',
  'Jessica Morin', 'jessica.morin@haircolor.fr', '0655667788',
  'court', 'demi-journee', 'essentiel',
  '2026-10-07', null, '10:00', '14:00',
  'auto-entrepreneur', '3-5', '{coloriste,mixte}',
  55.00, 11.00, 66.00, 33.00,
  'confirmed', null
),

-- ── À venir (confirmé) : Nathalie, Journée sans pack ────────────────────────
(
  'loc-006', now() - interval '2 days',
  'Nathalie Garnier', 'nathalie.garnier@gmail.com', '0666778899',
  'court', 'journee', 'aucun',
  '2026-10-14', null, '10:00', '18:00',
  'societe', '5-10', '{mixte,coloriste}',
  65.00, 13.00, 78.00, 39.00,
  'confirmed', null
),

-- ── À venir (en attente) : Driss, Semaine + essentiel ───────────────────────
(
  'loc-007', now() - interval '1 day',
  'Driss El Amrani', 'driss.elamrani@gmail.com', '0677889900',
  'long', 'semaine', 'essentiel',
  '2026-10-20', '2026-10-24', '10:00', '18:00',
  'auto-entrepreneur', '5-10', '{barber,design}',
  400.00, 80.00, 480.00, 120.00,
  'pending', 'Souhaite visiter le salon avant de confirmer. À rappeler.'
),

-- ── À venir (en attente) : Ahmed, Mensuel novembre + premium ────────────────
(
  'loc-008', now(),
  'Ahmed Zitouni', 'ahmed.zitouni@pro.fr', '0688990011',
  'long', 'mois', 'premium',
  '2026-11-01', '2026-11-30', '10:00', '18:00',
  'societe', '10+', '{barber,afro,mixte}',
  1870.00, 374.00, 2244.00, 561.00,
  'pending', 'Gérant d''un salon à Lyon, vient tester Montpellier. SIREN en cours de vérification.'
);


-- ============================================================
-- 3. CLIENTS (si la migration 002_clients.sql a été exécutée)
-- ============================================================

insert into clients (
  id, created_at, nom, email, telephone,
  last_rdv_at, rdv_count, location_count, notes
) values

('cli-001', now() - interval '90 days', 'Karim Benali',      'karim.benali@gmail.com',         '0612345601', now() - interval '18 days', 3, 0, null),
('cli-002', now() - interval '60 days', 'Marie Dubois',      'marie.dubois@hotmail.fr',         '0623456702', now() - interval '15 days', 2, 0, null),
('cli-003', now() - interval '30 days', 'Julien Moreau',     'julien.moreau@gmail.com',         '0678901203', now() - interval '13 days', 1, 0, 'RDV annulé sans prévenir'),
('cli-004', now() - interval '45 days', 'Aminata Traoré',    'aminata.traore@yahoo.fr',         '0645678904', now() - interval '10 days', 4, 0, null),
('cli-005', now() - interval '20 days', 'Isabelle Renard',   'isabelle.renard@gmail.com',       '0656789005', now() - interval '8 days',  2, 1, null),
('cli-006', now() - interval '15 days', 'Youssef Hamdi',     'youssef.hamdi@outlook.com',       '0667890106', now() - interval '5 days',  2, 0, null),
('cli-007', now() - interval '3 days',  'Lucas Martin',      'lucas.martin@gmail.com',          '0698765407', null,                       0, 0, null),
('cli-008', now() - interval '2 days',  'Fatoumata Konaté',  'fatoumata.konate@gmail.com',      '0687654308', null,                       0, 0, null),
('cli-009', now() - interval '5 days',  'Noah Petit',        'christelle.petit@gmail.com',      '0676543209', null,                       0, 0, 'Enfant — contact via la mère'),
('cli-010', now() - interval '2 days',  'Ismaël Diallo',     'ismael.diallo@gmail.com',         '0665432110', null,                       0, 0, null),
('cli-011', now() - interval '6 days',  'Sarah Lefebvre',    'sarah.lefebvre@hotmail.com',      '0654321011', null,                       0, 0, null),
('cli-012', now(),                       'Thomas Bernard',    'thomas.bernard@gmail.com',        '0643210912', null,                       0, 0, null),
('cli-013', now() - interval '4 days',  'Kevin Nguessan',    'kevin.nguessan@gmail.com',        '0632109813', null,                       1, 0, null),
('cli-014', now() - interval '2 days',  'Emma Leblanc',      'emma.leblanc@gmail.com',          '0621098714', null,                       0, 0, null),
('cli-015', now(),                       'Chloé Roux',        'marie.roux@gmail.com',            '0610987615', null,                       0, 0, 'Enfant'),
('cli-016', now() - interval '8 days',  'Patricia Dumont',   'patricia.dumont@gmail.com',       '0611223344', now() - interval '8 days',  0, 1, 'Intéressée par un contrat mensuel'),
('cli-017', now() - interval '30 days', 'Mamadou Coulibaly', 'mamadou.coulibaly@barbershop.fr', '0633445566', now() - interval '5 days',  0, 1, 'Contrat mensuel actif — client fidèle'),
('cli-018', now() - interval '5 days',  'Sofiane Belkacem',  'sofiane.belkacem@gmail.com',      '0644556677', null,                       0, 1, null),
('cli-019', now() - interval '3 days',  'Jessica Morin',     'jessica.morin@haircolor.fr',      '0655667788', null,                       0, 1, null),
('cli-020', now() - interval '2 days',  'Nathalie Garnier',  'nathalie.garnier@gmail.com',      '0666778899', null,                       0, 1, null),
('cli-021', now() - interval '1 day',   'Driss El Amrani',   'driss.elamrani@gmail.com',        '0677889900', null,                       0, 0, null),
('cli-022', now(),                       'Ahmed Zitouni',     'ahmed.zitouni@pro.fr',            '0688990011', null,                       0, 0, 'Gérant salon Lyon — prospect mensuel')

on conflict (email) do nothing;

-- ============================================================
-- ✅ Seeds insérés.
-- Dashboard admin : /admin → vous devriez voir 15 RDV + 8 locations
-- ============================================================
