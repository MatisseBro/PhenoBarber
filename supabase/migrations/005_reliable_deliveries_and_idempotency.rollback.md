# Rollback migration 005

Ce rollback ne doit être exécuté qu'après retour de l'application à une version qui
n'appelle plus les RPC de livraison et n'écrit plus les colonnes d'idempotence.

Ordre recommandé, dans une fenêtre sans cron ni soumission publique :

1. conserver une sauvegarde et exporter les compteurs agrégés du journal ;
2. redéployer la version applicative précédente ;
3. révoquer puis supprimer `claim_notification_delivery`,
   `finalize_notification_delivery`, `revoke_client_token` et
   `purge_expired_operational_data` ;
4. supprimer la table `notification_deliveries` ;
5. supprimer l'index et les contraintes d'idempotence ;
6. les colonnes nullable de `reservations` peuvent être conservées sans impact ; leur
   suppression est déconseillée tant que le rollback n'a pas été validé sur staging.

Ne jamais supprimer le journal avant d'avoir vérifié qu'aucun envoi n'est encore en
état `processing` ou `uncertain`.
