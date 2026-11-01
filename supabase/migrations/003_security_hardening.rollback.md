# Repli de la migration 003

Le repli n'est volontairement pas automatisé : certaines colonnes deviennent utilisées dès le déploiement du nouveau code et leur suppression pourrait entraîner une perte de données.

Procédure sûre sur staging :

1. remettre en service la version applicative précédente ;
2. conserver les colonnes ajoutées, qui sont rétrocompatibles ;
3. retirer uniquement la contrainte `rdv_bookings_no_overlap` si elle bloque un cas métier validé ;
4. ne supprimer `client_tokens` et `api_rate_limits` qu'après sauvegarde et confirmation qu'aucune instance applicative ne les utilise ;
5. restaurer la contrainte historique `(date, slot)` seulement après avoir vérifié l'absence de doublons, y compris les rendez-vous annulés.

Une sauvegarde et un test de restauration sont requis avant toute opération en production.
