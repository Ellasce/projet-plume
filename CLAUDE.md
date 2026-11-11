# Projet Plume — consignes pour Claude

Projet Plume est une application **gratuite et libre** d'entraînement à l'orthographe française (site statique, PWA). Pas de compilation : HTML, CSS et JavaScript simples.

## Documents de référence (à lire avant d'agir)

| Tâche | Document à suivre |
|---|---|
| Créer une règle, ajouter un thème, enrichir des exercices | **`docs/PROCEDURE-CREATION-REGLE.md`**, à suivre étape par étape. Modèle : `contenu/regles/a-a.md` |
| Choisir la prochaine règle à créer ; cocher une règle terminée | `docs/FEUILLE-DE-ROUTE.md` |
| Comprendre l'organisation, les licences et la mise en ligne | `README.md`, `LICENCES.md`, `SOURCES.md` |

Quand l'utilisateur envoie simplement un thème (« et / est », « leur / leurs »…), appliquer la procédure sans redemander la méthode. À la fin, ouvrir la règle dans le navigateur et donner le chemin du fichier pour qu'il la vérifie.

## Règles du projet

- **Licences libres uniquement**, réutilisables sans demander d'autorisation : LanguageTool (LGPL), Verbiste (GPL). Les exercices sont des **phrases originales** ; **plus de Tatoeba** (sa licence CC BY impose de citer l'auteur de chaque phrase). En cas de doute sur une licence, ne pas utiliser. Ne rien copier d'ouvrages ou de sites protégés (grammaires, dictionnaires, sites d'entraînement commerciaux, manuels scolaires).
- **Toujours créditer la source** d'une phrase reprise (ligne `Source : LanguageTool (…)` ou `Source : Verbiste`).
- **Peu de « trouve la faute »** : l'utilisateur les trouve moyens. On privilégie le trou, la saisie et le tri.
- **Une règle = une décision**, avec un socle essentiel de 8 à 12 exercices (pour valider la règle) et des exercices avancés marqués `avance: true` (« Aller plus loin »). Une seule bonne réponse possible par exercice.
- **Les règles s'écrivent dans `contenu/regles/<règle>.md`** (texte lisible, sans code), puis `python -I outils/construire.py`. Ne jamais modifier `contenu/genere/` à la main.
- **Avant de dire qu'un ajout est terminé** : `python -I outils/construire.py` puis `node outils/verifier_contenu.js` sans erreur, puis une session jouée dans le navigateur.
- **Tester le site** : `python -I outils/construire.py` construit `publication/` ; `python -I outils/servir.py` le sert sur http://localhost:8000 (adresses propres, comme Cloudflare Pages). Les textes des pages Accueil, Projet et Progression sont dans `contenu/pages.js` ; le gabarit HTML commun est `gabarit.html`.
- **Ne jamais ajouter de ✔** à un exercice : la validation est faite par un relecteur humain (page `/relecture`).
- **Ne jamais changer l'identifiant** d'une règle existante : la progression des utilisateurs en dépend.
