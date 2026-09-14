# RBX Analytics

Dashboard d'analytics publiques pour les expériences Roblox.

## Déploiement Vercel

Importe directement le repository dans Vercel. Aucun secret n'est nécessaire pour les endpoints publics utilisés par le dashboard.

## Ce que le dashboard mesure

- joueurs concurrents
- visites totales
- favoris
- likes / dislikes / like rate
- capacité serveur et estimation de serveurs actifs
- ratios d'engagement calculés
- créateur, dates, Universe ID et Root Place ID
- médias de l'expérience
- historique de snapshots conservé dans le navigateur
- graphiques d'activité
- données brutes JSON

Les données publiques sont récupérées côté serveur via les APIs Roblox afin d'éviter d'exposer la logique de proxy au navigateur. Roblox documente notamment les endpoints Games, votes, favoris et médias dans sa référence Cloud/API. 

## Note

Les métriques dérivées (ex. serveurs estimés, taux favori/visites) sont des calculs analytiques et ne sont pas présentées comme des métriques officielles Roblox.