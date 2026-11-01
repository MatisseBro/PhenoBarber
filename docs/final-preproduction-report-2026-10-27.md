# Rapport final de préproduction — PHENO & CO

Date : 27 octobre 2026

## Verdict

**NO-GO PRODUCTION** tant que les actions manuelles bloquantes de ce rapport ne sont pas terminées.

Le code, les migrations locales et les protections automatisées sont en bon état. Le démarrage de production échoue désormais volontairement avec la configuration actuelle, car cinq variables sont faibles, fictives ou invalides. La sauvegarde restaurable, le catalogue PostgreSQL distant et l'application de 004 restent également à confirmer par le propriétaire du projet.

## A. Corrections effectuées

### Secrets et authentification

- Ancien code administrateur remplacé dans le README courant par un exemple inactif.
- Audit expurgé et reproductible ajouté dans `scripts/audit-secrets.mjs`.
- Audit de secrets et `npm audit --audit-level=high` ajoutés à la CI.
- `.env`, `.env.local`, `.env.*.local` et `*.tsbuildinfo` ignorés.
- Mot de passe administrateur minimal harmonisé à 12 caractères dans le serveur, le middleware et le validateur.
- `ADMIN_SESSION_VERSION` devient obligatoire : aucune valeur implicite ne peut créer ou accepter une session.
- Tests ajoutés pour expiration, durée maximale, signature, version et révocation de session.
- Validateur renforcé contre les placeholders, secrets identiques et configuration Twilio incohérente.
- Procédure de rotation ajoutée dans `docs/admin-secret-rotation.md`.

### Isolation des tests

- `__tests__/setup.ts` retire toutes les clés de production avant l'import des modules.
- Resend, Twilio, Supabase, rate limiting et mises à jour clients sont simulés explicitement dans les tests de routes.
- Aucun test automatisé ne dépend désormais de `.env.local` pour contacter un service distant.

### APIs et planning

- Validation calendaire réelle des fermetures et suppressions de fermetures.
- Créneaux limités au catalogue serveur et doublons refusés.
- Raisons bornées à 200 caractères et contrôlées comme texte sûr.
- Corps JSON des routes de planning bornés.
- Identifiants de blocage validés avant la requête.
- L'absence de `id`/`created_at` sur `schedule_closures` et de `created_at` sur `schedule_blocks` ne casse aucune route : ces colonnes ne sont pas consommées par l'application.

### Exploitation

- PM2 lance désormais `npm start`, donc le contrôle `prestart` n'est plus contourné.
- Les erreurs et avertissements génériques restent disponibles en production pour le monitoring ; les autres `console.*` sont supprimés.
- L'import CSV historique fonctionne en aperçu sans écriture par défaut. Une écriture exige `--apply`, la référence exacte du projet et `PHENO_ALLOW_CLIENT_IMPORT=true`.
- Script SQL unique d'audit catalogue/données ajouté et validé dans une transaction PostgreSQL `READ ONLY`.
- Runbook complet de 004, sauvegarde, vérification et repli ajouté.

### Fichiers touchés par cette finalisation

- Secrets/configuration : `README.md`, `.env.example`, `.gitignore`, `package.json`, `.github/workflows/ci.yml`, `scripts/audit-secrets.mjs`, `scripts/validate-env.mjs`.
- Sessions/exploitation : `lib/auth.ts`, `middleware.ts`, `ecosystem.config.js`, `next.config.ts`, `scripts/import-clients.ts`.
- Planning : `app/api/schedule/route.ts`, `app/api/schedule/blocks/route.ts`, `app/api/schedule/blocks/[id]/route.ts`, `app/api/schedule/closures/route.ts`, `app/api/schedule/closures/[date]/route.ts`.
- Isolation et non-régression : `vitest.config.mts`, `__tests__/setup.ts`, `__tests__/api/admin-login.test.ts`, `__tests__/api/client-auth.test.ts`, `__tests__/api/rdv.test.ts`, `__tests__/api/reservations.test.ts`, `__tests__/api/schedule.test.ts`, `__tests__/lib/auth.test.ts`, `__tests__/lib/rate-limit.test.ts`, `__tests__/lib/rdv-availability.test.ts`, `__tests__/middleware.test.ts`, `__tests__/supabase/migration-regressions.test.ts`.
- Audit/runbooks : `supabase/audits/production_readonly_audit.sql`, `docs/admin-secret-rotation.md`, `docs/migration-004-runbook.md`, `docs/supabase-validation-2026-10-27.md`, ce rapport.

## B. Vérifications techniques

- Node.js : 20.19.0, conforme à `package.json`.
- TypeScript : réussi.
- ESLint, zéro avertissement : réussi.
- Vitest : **120/120 tests**, 20 fichiers.
- Build Next.js 15.5.28 : réussi, 31 pages générées.
- Le premier build de la commande agrégée a été bloqué uniquement par l'interdiction réseau du bac à sable lors du téléchargement de Google Fonts (`EACCES`) ; le même build relancé avec cet accès autorisé a réussi.
- npm audit en ligne : **0 vulnérabilité** sur 425 dépendances.
- Audit des fichiers suivis : **0 secret courant détecté**.
- Contrat d'environnement avec valeurs CI fictives : réussi.
- Configuration `.env.local` actuelle : refusée sans afficher les valeurs ; variables concernées :
  - `ADMIN_PASSWORD` ;
  - `RATE_LIMIT_SECRET` ;
  - `MARKETING_UNSUBSCRIBE_SECRET` ;
  - `CRON_SECRET` ;
  - `RESEND_API_KEY`.
- Playwright : non installé ; aucun test E2E navigateur, responsive ou accessibilité visuelle n'est déclaré.

## C. État Supabase

### Validé sur la production en lecture seule

- Projet distant HTTPS identifié et traité comme production.
- OpenAPI PostgREST accessible.
- 8 tables publiques exposées et colonnes applicatives observées.
- Types `date`, `timestamptz`, tableaux, booléens, numériques et entiers cohérents avec l'application.
- 5 RPC exposées.
- `search_clients_admin` répond sur une recherche fictive sans correspondance et conserve le total sur page vide.
- 23 clients : zéro collision, téléphone invalide, normalisation absente ou incohérente.
- 20 rendez-vous : zéro chevauchement, créneau, durée ou date invalide.
- Locations et planning : aucune anomalie agrégée observée.
- `/api/health` : HTTP 200 et base `ok` lors du contrôle.
- APIs administratives : HTTP 401 sans session.

### Validé sur PostgreSQL isolé

- Chaîne `schema → 002 → 003 → 004`.
- Réexécution idempotente de 003/004.
- Rollback intégral lors de collisions téléphoniques et chevauchements préexistants.
- RLS, ACL, cinq RPC, tokens à usage unique, rate limiting et exclusion GiST.
- Créneaux adjacents, annulés, autre date, durée/créneau invalides.
- Script `production_readonly_audit.sql` exécuté avec succès en transaction `READ ONLY`.

### Validé avec mocks

- Rendez-vous individuel, tarif/durée serveur et conflit concurrent `23P01`.
- Annulation administrateur et exclusion des rendez-vous annulés de la disponibilité.
- Réservations de groupe séquentielles.
- Location et calculs tarifaires.
- Login administrateur, cookies via couche d'authentification, expiration et révocation.
- Magic links : adresse inconnue non révélée, token mal formé, expiré/consommé et consommation réussie.
- Recherche/pagination client, validation d'entrées et tentatives d'injection.
- Rate limiting distribué et comportement fail-closed.
- Planning compatible avec le schéma distant réduit.

### Non vérifié

- Version PostgreSQL distante exacte.
- Catalogue distant complet : contraintes, index, politiques et ACL effectives.
- Historique `supabase_migrations` et versions enregistrées.
- Sauvegarde réellement restaurée.
- Parcours actifs sur staging avec PostgREST complet.
- Envoi réel Resend/Twilio.
- E2E navigateur, responsive, erreurs console client, accessibilité et débordements.
- Charge, reprise après incident et monitoring externe.

## D. Sécurité

### Secrets à modifier personnellement

Obligatoires : `ADMIN_PASSWORD`, `ADMIN_SESSION_VERSION`, `RATE_LIMIT_SECRET`, `MARKETING_UNSUBSCRIBE_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`.

Recommandé pendant la même fenêtre : `ADMIN_SECRET`.

À vérifier/faire tourner si toujours active : ancienne clé Supabase de rôle `anon` présente dans l'historique.

Non retrouvés à l'identique dans Git : clé `service_role` actuelle, `ADMIN_SECRET`, secrets de rate limiting/marketing/cron, clé Resend et token Twilio actuellement configurés. Cette absence n'annule pas le refus du validateur pour les valeurs faibles ou fictives.

### Historique

- 5 objets Git historiques contiennent l'ancien code administrateur.
- 1 objet historique contient une ancienne clé JWT de rôle `anon`.
- Aucune réécriture d'historique n'a été effectuée.

### Risques résiduels

- CSP : `unsafe-inline` reste autorisé pour scripts/styles ; migration vers nonce/hash recommandée ultérieurement.
- Le cron de rappel ne stocke pas de marqueur d'idempotence : un déclenchement multiple peut renvoyer un rappel. Le planificateur doit garantir une exécution unique jusqu'à ajout d'un suivi dédié.
- Aucun outil de monitoring/alerting externe n'est configuré dans le dépôt.
- La page légale nomme Netlify alors que PM2 suggère un hébergement Node/VPS possible : l'hébergeur réel doit être confirmé.

## E. Migrations

- `schema.sql` : baseline locale, pas une preuve d'installation distante.
- `002_clients.sql` : présente localement ; table `clients` observée à distance.
- `003_security_hardening.sql` : objets et comportements observés, et état indiqué comme installé dans le contexte projet ; enregistrement dans l'historique distant non prouvé.
- `004_phone_and_client_search_fixes.sql` : préparée, empreinte SHA-256 `cae0faaa7a8d8235ebaf0d4214b86d5ec8dec66f8b40fbbe0b0cf46b0d51eb53`, validée localement, **non appliquée à distance**.
- Aucune migration supplémentaire n'est requise pour les colonnes optionnelles absentes du planning.
- Les index simples `clients_email_idx` et `clients_telephone_idx` peuvent doubler les index des contraintes uniques. Ne rien supprimer sans résultat du script catalogue et mesure d'usage.

## F. Checklist de production

### Automatiquement vérifié

- version Node ;
- installation et audit des dépendances ;
- tests, lint, types et build ;
- secrets absents des fichiers courants ;
- routes administratives protégées ;
- rate limiting distribué et fail-closed ;
- connexion Supabase en lecture ;
- headers HTTP ;
- sitemap, robots et URLs canoniques présents ;
- logs serveur génériques sans corps de formulaires.

### Intervention requise, dans cet ordre

1. Choisir/confirmer l'hébergeur réel et corriger les mentions Netlify si nécessaire.
2. Générer personnellement les nouvelles variables listées en section D, sans les communiquer ni les placer dans Git.
3. Mettre à jour ces variables sur staging ; mettre à jour simultanément le Bearer du cron.
4. Exécuter `npm run prestart`, puis vérifier nouvelle connexion et rejet de l'ancien cookie.
5. Exécuter `supabase/audits/production_readonly_audit.sql` dans le SQL Editor et archiver les résultats sans PII.
6. Vérifier une sauvegarde récente et prouver sa restauration dans un environnement de récupération autorisé, isolé et sans notifications.
7. Confirmer version PostgreSQL, contraintes, index, RLS, ACL et historique des migrations grâce au script SQL.
8. Tester 004 sur la restauration/staging, y compris dashboard, pagination et écritures concurrentes.
9. Autoriser explicitement une fenêtre sans écritures et l'application distante de 004.
10. Rejouer l'audit SQL, les contrôles de recherche/pagination et la surveillance 5xx/429/`23P01`.
11. Configurer monitoring, alertes, rétention de logs et procédure d'astreinte.
12. Configurer Resend : domaine vérifié, expéditeur, quotas et destinataires de test.
13. Laisser Twilio entièrement désactivé ou configurer les trois variables et un numéro de test autorisé.
14. Configurer le cron avec POST + `Authorization: Bearer`, exécution unique et fenêtre Europe/Paris.
15. Valider domaine/HTTPS/HSTS et `TRUST_PROXY` selon les garanties exactes du proxy.
16. Faire valider RGPD, durées de conservation, DPA/sous-traitants, transferts, pages légales et consentement marketing.
17. Effectuer un test navigateur Playwright ou équivalent sur mobile, tablette et desktop avant ouverture publique.
18. Préparer l'artefact précédent et la procédure de rollback applicatif ; ne déployer qu'après validation de tous les points bloquants.

## G. Condition de passage à GO

Le projet peut passer à **GO SOUS CONDITIONS**, puis **GO PRODUCTION**, sans nouvel audit complet lorsque :

- `npm run check`, `npm run audit:secrets`, `npm audit` et `npm run prestart` réussissent avec les secrets réels ;
- le script SQL distant ne signale aucune anomalie ;
- la restauration est prouvée ;
- 004 est autorisée, appliquée et revérifiée ;
- staging, navigateur, fournisseurs de notification et monitoring sont validés ;
- hébergeur, RGPD et pages légales sont confirmés.

Ce rapport, le script SQL et les deux runbooks constituent la baseline de validation pour les prochaines étapes.
