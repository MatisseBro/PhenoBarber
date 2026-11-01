# Validation Supabase avant production — 27 octobre 2026

> Rapport intermédiaire conservé pour traçabilité. Le rapport de référence le plus récent est `docs/final-preproduction-report-2026-10-27.md`.

## Verdict

**NO-GO production en l'état.** Les données et migrations ont passé les contrôles techniques exécutables, mais le mot de passe administrateur configuré est déjà présent en clair dans un fichier suivi par Git. Il doit être remplacé avant déploiement. La sauvegarde/restauration et l'état exact de l'historique des migrations Supabase n'ont pas pu être vérifiés avec l'accès PostgREST disponible.

## Cible protégée

- Projet Supabase distant : `enmziyvurukskadgtoxt`.
- Cible HTTPS hébergée, non locale.
- La clé configurée porte le rôle `service_role`.
- Cette cible a été traitée comme production.
- Aucune migration, réservation, modification de client/policy, suppression, notification, déploiement ou commit n'a été volontairement exécuté sur cette cible.

## Contrôles distants en lecture seule

- OpenAPI PostgREST : HTTP 200.
- Tables observées : `reservations`, `rdv_bookings`, `schedule_config`, `schedule_closures`, `schedule_blocks`, `clients`, `client_tokens`, `api_rate_limits`.
- Les colonnes ajoutées par la migration 003 sont exposées.
- RPC publiées : `issue_client_token`, `consume_client_token`, `upsert_client_activity`, `search_clients_admin`, `check_rate_limit`.
- La seule RPC distante appelée directement pendant l'audit était `search_clients_admin`, déclarée `STABLE`, avec une recherche garantie sans correspondance. Le contrat de pagination vide avec `total_count` est valide.
- `/api/health` a répondu 200 avec l'état `ok`.
- `/api/schedule` a répondu 200 avec la forme attendue.
- Les accès non authentifiés à `/api/admin/check`, `/api/admin/clients` et `/api/reservations` ont répondu 401.
- Les en-têtes CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` et `Permissions-Policy` sont présents. Aucun CORS générique `*` n'a été observé.

### Contrôle agrégé des données

Aucune donnée personnelle n'a été affichée ou copiée vers la base locale. Seuls les totaux suivants ont été produits :

- 23 clients contrôlés ; 0 collision de téléphone normalisé ; 0 téléphone invalide ; 0 normalisation absente ou incohérente ;
- 20 rendez-vous contrôlés ; 0 paire en chevauchement ; 0 créneau, durée ou date invalide ;
- 10 locations contrôlées ; 0 date invalide ou plage inversée ;
- 0 date d'horaire ou créneau bloqué invalide.

Ces résultats valident les préconditions de données de la migration 004, mais pas sa présence dans la table interne d'historique des migrations.

## Tests PostgreSQL réels et isolés

Les écritures ont été limitées à un conteneur éphémère PostgreSQL 18.1, sans port publié ni volume de projet. Aucune donnée de production n'y a été copiée.

- Chaîne `schema.sql` → `002_clients.sql` → `003_security_hardening.sql` → `004_phone_and_client_search_fixes.sql` : réussite.
- Réexécution de 003 et 004 : réussite (idempotence observée).
- Normalisation France, format international `00`, format international `+` et téléphone invalide : réussite.
- Collision normalisée avant 003 : migration refusée et transaction entièrement annulée.
- Chevauchements existants avant 003 : migration refusée et transaction entièrement annulée.
- Collision normalisée avant 004 : migration refusée, transaction annulée et index unique préservé.
- Test transactionnel complet : réussite. Il couvre les types, colonnes générées, contraintes, RLS, droits des rôles, cinq RPC, jetons à usage unique, upsert client, conflit d'identités, pagination vide, rate limiting, chevauchement, adjacency, annulation, créneau et durée invalides.

Le test reproductible est dans `supabase/tests/001_security_hardening_integration.sql`.

## Validation applicative et dépendances

- Node.js 20.19.0 : conforme à `package.json`.
- Tests Vitest : 89/89 réussis dans 15 fichiers.
- TypeScript : réussi.
- ESLint avec zéro avertissement autorisé : réussi.
- Build Next.js 15.5.28 : réussi, 31 pages générées.
- Validation des variables de production : réussie.
- Audit npm en ligne : 0 vulnérabilité connue sur 425 dépendances.
- `.env.local` est ignoré et non suivi par Git.
- Aucun secret cryptographique, clé Supabase service-role, clé Resend ou secret Twilio configuré n'a été retrouvé à l'identique dans les fichiers suivis.

## Écart survenu pendant l'audit

Un appel de test à `GET /api/rdv/slots` a été classé à tort comme strictement en lecture seule. Cette route exécute d'abord `check_rate_limit`, qui écrit une ligne technique hachée. Le nombre de lignes de `api_rate_limits` est passé de 1 à 2.

- Aucun rendez-vous, client, compte, email ou SMS n'a été touché.
- La ligne n'a pas été supprimée, afin de ne pas effectuer une seconde écriture non autorisée.
- Elle relève de la purge normale des fenêtres anti-abus prévue par la documentation d'exploitation.

Un contrôle final de chemin a aussi affiché la constante `ADMIN_CODE` du README dans la sortie de commande au lieu de la masquer. La valeur n'est pas reproduite dans ce rapport. Comme elle correspond au mot de passe administrateur configuré, sa rotation est impérative.

## Blocages et actions manuelles avant production

1. Remplacer `ADMIN_PASSWORD` par une valeur nouvelle et forte. La valeur actuelle est identique à `ADMIN_CODE` dans `README.md` et doit être considérée compromise. Révoquer les sessions avec une nouvelle version de session. Ne pas afficher la nouvelle valeur et ne pas la réutiliser ailleurs.
2. Retirer la constante historique du contenu suivi, puis décider d'une procédure coordonnée pour l'historique Git. La rotation reste obligatoire même après retrait du fichier courant.
3. Effectuer une sauvegarde Supabase et prouver sa restauration sur une cible isolée avant toute migration.
4. Vérifier en lecture seule, depuis SQL Editor ou une connexion PostgreSQL autorisée, la table d'historique des migrations, `pg_class.relrowsecurity`, `pg_constraint` et les ACL réelles de production. PostgREST avec une clé `service_role` ne permet pas de prouver indépendamment ces points de catalogue ni le comportement du rôle `anon`.
5. Tester 004 sur la restauration/staging avec ce test SQL, puis seulement planifier son application éventuelle. Les comportements visés par 004 sont déjà observables sur la cible, mais son enregistrement comme migration appliquée n'est pas démontré.
6. Réaliser les parcours d'écriture, concurrence, email et SMS uniquement sur staging avec des destinataires contrôlés.
7. Valider juridiquement les mentions, durées de conservation, sous-traitants et transferts internationaux.

## Risques résiduels

- La CSP autorise encore `unsafe-inline` pour les scripts et styles. Les en-têtes sont présents, mais un durcissement par nonce/hash reste recommandé.
- Aucun exercice de restauration, test de charge, test de concurrence HTTP complet, scan DAST authentifié ou test réel des fournisseurs email/SMS n'a été réalisé.
- Le rôle navigateur n'a pas pu être testé sur la cible distante faute de clé publique dédiée ; ses privilèges ont été validés sur PostgreSQL local à partir des migrations.
