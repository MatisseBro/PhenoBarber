# Rotation de l'accès administrateur

Cette procédure ne doit jamais être exécutée avec des valeurs copiées dans Git, un ticket, un chat ou des logs.

## Variables à modifier personnellement

Obligatoires avant production :

1. `ADMIN_PASSWORD` : nouvelle phrase de passe unique d'au moins 12 caractères, idéalement générée par un gestionnaire de mots de passe ;
2. `ADMIN_SESSION_VERSION` : nouvelle valeur différente de l'ancienne afin de révoquer immédiatement tous les cookies existants.
3. `RATE_LIMIT_SECRET` : valeur aléatoire distincte d'au moins 32 caractères. La rotation change les clés HMAC et remet fonctionnellement les compteurs par client à zéro ;
4. `MARKETING_UNSUBSCRIBE_SECRET` : valeur aléatoire distincte d'au moins 32 caractères. La rotation invalide les anciens liens de désinscription, qui devront être régénérés ;
5. `CRON_SECRET` : valeur aléatoire distincte d'au moins 24 caractères, à mettre à jour simultanément dans le planificateur externe ;
6. `RESEND_API_KEY` : véritable clé active limitée au compte/domaine attendu. La valeur configurée actuellement est refusée par le validateur renforcé.

Recommandée pendant la même fenêtre :

7. `ADMIN_SECRET` : nouvelle valeur aléatoire d'au moins 32 caractères. Une rotation de ce secret invalide également toutes les signatures de session existantes.

À vérifier séparément :

- une ancienne clé Supabase de rôle `anon` existe dans l'historique Git. Une clé publique n'est pas une frontière de sécurité, mais elle doit être remplacée si elle appartient encore au projet actif et les RLS doivent être revérifiées ;
- la clé `SUPABASE_SERVICE_ROLE_KEY` actuellement configurée, les secrets de rate limiting/marketing/cron, Resend et Twilio n'ont pas été retrouvés à l'identique dans les objets Git analysés. Ils ne sont donc pas classés compromis par cet audit.

## Ordre de rotation

1. Créer les nouvelles valeurs localement ou dans le gestionnaire de secrets de l'hébergeur. Ne pas les écrire dans un fichier suivi.
2. Sur staging, mettre à jour ensemble les variables obligatoires ci-dessus et, idéalement, `ADMIN_SECRET`.
3. Démarrer l'application avec `npm run prestart` et vérifier qu'une configuration faible est refusée.
4. Vérifier qu'un ancien cookie reçoit HTTP 401 sur `/api/admin/check`.
5. Vérifier qu'une connexion avec la nouvelle phrase de passe crée un cookie `HttpOnly`, `Secure` en production, `SameSite=Strict`, limité à huit heures.
6. Dans une fenêtre contrôlée, appliquer les mêmes variables dans le gestionnaire de secrets de production, mettre à jour l'en-tête Bearer du cron, puis redémarrer/redéployer l'application.
7. Vérifier à nouveau l'ancien cookie, la nouvelle connexion, puis les routes administratives.
8. Consigner uniquement l'heure, l'opérateur et les noms des variables tournées, jamais leurs valeurs.

## Historique Git

Le fichier courant a été neutralisé, mais cinq objets historiques contiennent encore l'ancien code administrateur. Ne pas réécrire l'historique sans coordination avec tous les clones, branches et déploiements. La rotation rend l'ancienne valeur inutilisable même si l'historique reste accessible.

Si une purge d'historique est décidée ultérieurement : sauvegarder le dépôt, convenir d'une interruption des pushes, utiliser un outil spécialisé, forcer la mise à jour de toutes les branches concernées, puis demander à chaque contributeur de recréer son clone. Cette opération nécessite une autorisation distincte.
