# RBX Analytics V2

Dashboard d'intelligence et d'analyse pour les expériences Roblox.

## V2

- recherche par nom, URL Roblox ou Universe ID
- CCU actuel, visites, favoris, votes, likes/dislikes
- like rate, favorite conversion, visites/jour, favoris/jour
- âge exact du jeu et timeline de création / dernière mise à jour
- capacité serveur, remplissage, estimation de serveurs
- historique local des observations, sans inventer de données passées
- graphiques CCU et historiques
- interface responsive et onglets Vue générale / Historique / Engagement / Croissance / Technique / Raw
- récupération de l'icône et des médias
- données JSON brutes
- prise en charge optionnelle de Roblox Creator Analytics

## Important sur l'historique « création → aujourd'hui »

Les endpoints publics Roblox donnent les compteurs cumulés actuels et la concurrence actuelle, mais ne fournissent pas rétroactivement un historique CCU complet pour chaque expérience publique. Le site ne fabrique donc pas de faux points historiques.

Pour un jeu dont tu as les permissions Creator Analytics, ajoute `ROBLOX_API_KEY` dans les variables d'environnement Vercel. L'application tente alors de récupérer des séries journalières Roblox, notamment DAU, Daily Revenue et D1 Retention, sur la fenêtre disponible.

Pour les jeux publics sans permission analytique, les courbes historiques commencent réellement quand RBX Analytics commence à observer le jeu dans un navigateur ou via une future couche de collecte persistante.

## Déploiement Vercel

Le repository est prêt pour Vercel. Aucun secret n'est requis pour les données publiques.

### Variable optionnelle

`ROBLOX_API_KEY` — clé Open Cloud Roblox avec permission `universe.analytics:read` pour les expériences auxquelles elle donne accès.

Ne mets jamais une clé Roblox directement dans le code ou dans GitHub.

## Stack

Next.js 15.5.24, React 19, TypeScript, Recharts 3.10.1 et Lucide.

## Sécurité / exactitude

Les données publiques sont récupérées côté serveur. Les métriques dérivées (serveurs estimés, ratios, moyennes journalières, etc.) sont clairement calculées par RBX Analytics et ne sont pas présentées comme des métriques officielles Roblox.
