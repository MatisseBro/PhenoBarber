# Migration 004 — validation et procédure sécurisée

Migration : `supabase/migrations/004_phone_and_client_search_fixes.sql`

Empreinte validée localement :

```text
SHA-256 cae0faaa7a8d8235ebaf0d4214b86d5ec8dec66f8b40fbbe0b0cf46b0d51eb53
```

## Analyse technique

- Dépendances : table `public.clients`, colonnes `id`, `nom`, `email`, `telephone`, `telephone_normalized`, compteurs et timestamps créés par 002/003 ; rôle `service_role` ; fonction `search_clients_admin` créée par 003.
- Compatibilité 003 : validée sur PostgreSQL 18.1 avec la chaîne complète 002 → 003 → 004.
- Données : aucune suppression. Seule `telephone_normalized` peut être mise à jour ; la valeur source `telephone` reste intacte.
- Collisions : un contrôle précède toute mise à jour. Une collision lève une exception et annule toute la transaction.
- Course concurrente : même si une écriture apparaît après le contrôle préalable, la recréation de l'index unique échoue et la transaction restaure l'index et les valeurs antérieures.
- Idempotence : deux exécutions successives ont été validées. `DROP INDEX IF EXISTS`, recalcul conditionnel et remplacement de fonction convergent vers le même état.
- Permissions : la fonction remplacée est `STABLE SECURITY DEFINER`, fixe `search_path = public, pg_temp`, révoque `public`, `anon` et `authenticated`, puis accorde uniquement `service_role`.
- API : la signature et les colonnes retournées restent compatibles avec `/api/admin/clients`. La ligne de comptage existe même lorsque la page demandée est vide ; l'API filtre la ligne dont `id` est nul.
- Injection : les paramètres restent des valeurs SQL, jamais du SQL dynamique. `%` et `_` conservent seulement leur sémantique de joker `ILIKE` pour la recherche administrateur.

## Verrouillages et fenêtre d'intervention

- Le contrôle et l'`UPDATE` parcourent `clients`.
- `DROP INDEX` et surtout `CREATE UNIQUE INDEX` prennent des verrous incompatibles avec certaines écritures concurrentes. La création non concurrente est nécessaire ici pour rester atomique dans la transaction.
- Avec 23 clients observés, la durée devrait être courte, mais aucune garantie ne doit être déduite de ce volume.
- Suspendre temporairement les créations de rendez-vous, locations et imports clients pendant l'application. Configurer un `lock_timeout`/`statement_timeout` au niveau de la session si le SQL Editor le permet et abandonner en cas d'attente anormale.
- Ne jamais lancer deux exécutions de la migration en parallèle.

## 1. Contrôle préalable en lecture seule

1. Exécuter `supabase/audits/production_readonly_audit.sql` dans le SQL Editor.
2. Confirmer `transaction_read_only = on`.
3. Exiger zéro pour : collisions téléphoniques, téléphone invalide/manquant/incohérent, compteurs négatifs, chevauchements, créneaux/durées/statuts invalides et colonnes applicatives manquantes.
4. Confirmer la présence des cinq RPC, leurs ACL, RLS, contraintes et index.
5. Enregistrer les métadonnées et compteurs, sans exporter les lignes personnelles.
6. Vérifier séparément l'historique `supabase_migrations`; la présence d'un fichier local ne prouve pas son application distante.

## 2. Sauvegarde et restauration

1. Identifier le plan Supabase et la méthode disponible dans **Database → Backups**.
2. Sur Pro/Team/Enterprise, vérifier qu'une sauvegarde physique récente est terminée. Si PITR est activé, noter le dernier point restaurable avant la migration.
3. Sinon, produire un dump logique chiffré avec la CLI Supabase (`roles`, `schema`, puis `data`) depuis une machine contrôlée. Ne jamais placer l'URL contenant le mot de passe dans l'historique du shell ou Git.
4. Tester la restauration sur une cible de récupération isolée et explicitement autorisée. Une restauration contient des données personnelles : accès minimal, chiffrement, absence d'email/SMS/cron/webhook, puis suppression selon la procédure RGPD.
5. Vérifier les comptes de lignes, contraintes, index, fonctions et RLS restaurés avec le script d'audit.
6. Attention : les sauvegardes de base ne restaurent pas les objets binaires Supabase Storage ; les mots de passe de rôles personnalisés peuvent aussi devoir être réinitialisés.

Documentation officielle :

- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/clone-project
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## 3. Application sécurisée

Cette section nécessite une autorisation explicite distincte.

1. Annoncer la fenêtre et figer les écritures applicatives.
2. Confirmer l'empreinte SHA-256 du fichier à appliquer.
3. Rejouer le contrôle préalable et confirmer qu'aucun résultat n'a changé.
4. Confirmer la sauvegarde restaurable et l'identité exacte du projet cible.
5. Exécuter une seule fois le contenu complet de 004 dans le SQL Editor, sans le modifier à la volée.
6. Conserver la sortie et l'heure d'exécution, sans secret ni donnée personnelle.
7. En cas d'erreur SQL, ne pas relancer aveuglément : la transaction doit être annulée ; analyser d'abord le message.

## 4. Vérifications après application

1. Rejouer le script d'audit en lecture seule.
2. Vérifier l'index unique partiel `clients_telephone_normalized_unique` valide et prêt.
3. Vérifier la définition, volatilité, `SECURITY DEFINER`, `search_path` et ACL de `search_clients_admin`.
4. Vérifier zéro collision et zéro incohérence de normalisation.
5. Appeler `search_clients_admin` avec une recherche fictive sans résultat et vérifier la ligne `total_count`.
6. Sur staging uniquement, tester recherche, filtres, tris et pages vide/non vide depuis le dashboard.
7. Surveiller les erreurs SQL, HTTP 5xx/429 et latences avant de rouvrir les écritures.

## 5. Retour arrière

- Erreur pendant la transaction : PostgreSQL restaure automatiquement l'index, les valeurs et la fonction précédents.
- Erreur applicative après commit : redéployer la version applicative précédente. Les valeurs normalisées et l'index sont rétrocompatibles et ne doivent pas être supprimés.
- Défaut de la fonction : restaurer uniquement la définition précédente capturée avant migration, avec ses révocations/permissions, après validation sur la restauration isolée.
- Corruption ou résultat fonctionnel grave : maintenir les écritures fermées et restaurer le projet depuis le point validé. Une restauration de production implique une indisponibilité planifiée.
- Ne pas tenter de « dénormaliser » les téléphones : les valeurs originales sont toujours dans `telephone` et aucun bénéfice ne justifie une nouvelle réécriture.

## 6. Autorisations explicites requises

- création/restauration d'une copie contenant des données personnelles ;
- suspension des écritures ou fenêtre de maintenance ;
- exécution de 004 sur le projet distant ;
- restauration d'une sauvegarde/PITR ;
- déploiement ou rollback applicatif ;
- rotation de secrets ou clés Supabase ;
- suppression d'index redondants ;
- envoi d'emails/SMS de test vers un fournisseur réel.
