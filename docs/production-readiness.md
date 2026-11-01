# Préparation production PHENO&CO

## Ordre de mise en service

1. créer une sauvegarde Supabase et vérifier sa restauration sur une instance isolée ;
2. sur une restauration ou un staging isolé, appliquer dans cet ordre : `002_clients.sql`,
   `003_security_hardening.sql`, `004_phone_and_client_search_fixes.sql`, puis
   `005_reliable_deliveries_and_idempotency.sql` ;
3. résoudre tout arrêt signalant des téléphones normalisés en doublon ou des rendez-vous qui se chevauchent,
   puis tester les claims concurrents de `notification_deliveries` ;
4. configurer les variables décrites dans `.env.example` sans réutiliser un même secret ;
5. lancer `npm run check`, puis un test fonctionnel staging des rendez-vous, groupes, locations, espace client et administration ;
6. déployer avec une version immuable et conserver la version précédente pour le rollback ;
7. vérifier `/api/health`, les en-têtes HTTP et les journaux après déploiement.

La migration n'est pas lancée automatiquement par le build ou par l'application.

## Hébergement et proxy

- Node requis : `20.19.x` ou `22.12+`.
- `TRUST_PROXY=false` par défaut. Le passer à `true` uniquement si un reverse proxy maîtrisé garantit et réécrit `x-forwarded-for`.
- Définir `HOSTING_PLATFORM` à `vercel`, `cloudflare`, `netlify` ou `none`. Un en-tête propre à une plateforme n'est utilisé que lorsque cette valeur correspond. Avec Cloudflare, l'origine doit en plus refuser le trafic qui contourne Cloudflare.
- `BOOKING_MIN_LEAD_MINUTES` vaut 60 minutes par défaut et accepte une valeur entière de 0 à 10080.
- La cible d'hébergement réelle n'est pas démontrable depuis le dépôt. La mention « Netlify » et les transferts internationaux de la politique de confidentialité doivent être validés par le responsable du site avant publication.

## Exploitation

- Surveiller le taux de réponses 5xx/429, la latence de `/api/health`, les échecs Resend/Twilio et les erreurs PostgreSQL `23P01`.
- Ne jamais journaliser les corps de formulaire, jetons, clés ou en-têtes `Authorization`.
- Après validation sur staging, planifier `purge_expired_operational_data()` avec `service_role`. Cette RPC purge les fenêtres anti-abus après 2 jours, les tokens expirés après 7 jours et le journal technique selon les durées inscrites dans la migration 005.
- Le cron utilise `Authorization: Bearer <CRON_SECRET>` ; le secret ne doit jamais être placé dans l'URL.
- Le cron et ses appels Resend/Twilio nécessitent la migration 005. Un état SMS `uncertain` n'est pas retenté automatiquement afin d'éviter un doublon ; il doit être examiné dans le journal.
- Une rotation de `ADMIN_SESSION_VERSION` révoque toutes les sessions administrateur.

## Sauvegarde et rollback

- Activer des sauvegardes automatiques Supabase adaptées au contrat retenu et réaliser un exercice de restauration avant mise en production.
- Pour un rollback applicatif, redéployer l'artefact précédent. Les colonnes ajoutées par la migration 003 sont rétrocompatibles et doivent être conservées.
- Suivre les procédures `003_security_hardening.rollback.md` et
  `005_reliable_deliveries_and_idempotency.rollback.md` avant tout retrait manuel.

## Points manuels obligatoires

- Valider juridiquement les mentions légales, durées de conservation, bases légales et contrats de sous-traitance.
- Confirmer le domaine canonique `https://phenoandco.fr` et l'hébergeur réel.
- Faire tourner l'ancienne clé Supabase trouvée dans l'historique Git si elle est toujours active. Il s'agit d'une ancienne clé de rôle public ; vérifier les politiques RLS avant et après rotation. Ne pas réécrire l'historique sans procédure coordonnée.
- Configurer un outil de suivi d'erreurs et des alertes sans données personnelles ; aucun service payant n'est activé par ce correctif.
