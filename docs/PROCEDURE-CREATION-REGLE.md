# Procédure : créer ou enrichir une règle du Projet Plume

> Document de référence. Toute nouvelle règle, tout nouveau thème et tout enrichissement d'exercices suivent cette procédure, qu'ils soient faits par un humain ou par Claude. Pour la modifier, éditez ce fichier : c'est la seule version qui fait foi.

On travaille **une règle à la fois**. Une règle = **une décision** que l'apprenant doit prendre (écrire « a » ou « à », accorder ou non un participe…). Si l'analyse fait apparaître deux décisions distinctes, on fait deux règles.

**Une règle = un fichier texte lisible** : `contenu/regles/<identifiant>.md`. On n'écrit jamais de code. Exemple complet : `contenu/regles/a-a.md`.

## Étape 0 — Cadrer

- Vérifier que la règle n'existe pas déjà : regarder la liste des fichiers dans `contenu/regles/`. Si elle existe, on l'**enrichit** (étapes 3 à 6) au lieu d'en créer une autre.
- Choisir un identifiant court, sans accent ni espace (`et-est`, `on-ont`, `leur-leurs`). Il sert de nom de fichier et **ne change plus jamais** (la progression des utilisateurs en dépend).
- Choisir sa place dans `contenu/structure.js` : catégorie, sous-catégorie, position dans le parcours conseillé, règles liées.

## Étape 1 — Analyser la règle (avant d'écrire quoi que ce soit)

Rédiger l'analyse dans la section **`## Analyse`** du fichier. Elle sert aux relecteurs ; l'application ne l'affiche pas.

1. **La décision** en une phrase.
2. **Les cas de base**, numérotés : nature et fonction des mots en jeu, avec la terminologie d'Éduscol (*Grammaire du français — Terminologie grammaticale*, 2020).
3. **Le test** pratique (substitution, passage à « nous », mise au féminin…). C'est le cœur de la fiche.
4. **Les cas particuliers, pièges et exceptions**, numérotés. Chercher systématiquement :
   - les **locutions figées** (à peu près, quoi qu'il en soit) ;
   - les **formes voisines collées** (a à, ça a, qu'elle quelle) ;
   - les **questions et inversions** (a-t-il) ;
   - les **majuscules et élisions** (À, qu') ;
   - les **pluriels et féminins** qui changent la réponse ;
   - les **variantes admises** : rectifications de 1990, usages concurrents.
5. **Ce qui est hors sujet** (renvoyé à d'autres règles).
6. **Le niveau** et les prérequis.

**Sources autorisées** pour vérifier : Wiktionnaire, Wikilivres, les messages de règles de Grammalecte (GPL) et de LanguageTool (LGPL), les documents d'Éduscol.
**Interdit de copier** : grammaires et dictionnaires publiés, sites et applications d'entraînement, manuels scolaires. On peut s'en servir pour vérifier ses connaissances, jamais comme texte.

En cas de doute sur un point de norme : le signaler dans l'analyse avec `DOUTE :`, ne **pas** en faire d'exercice, et le dire à l'utilisateur.

## Étape 2 — Rédiger la fiche

Sections **`## Fiche`** (le cours) et **`## Pour aller plus loin`** (les cas des exercices avancés, présentés dans le volet « Approfondir »).

Ajouter aussi une section **`## En bref`** : la règle en 3 ou 4 lignes (les deux formes et le test, avec un exemple qui marche et un qui ne marche pas). Elle est affichée **avant les exercices**, à chaque session, comme dans un cours : d'abord la règle expliquée simplement, puis l'application. Sans cette section, l'application prend le début de la fiche.

Mise en forme : `**gras**`, lignes commençant par `- ` pour les listes, lignes commençant par `> ` pour les exemples. Plan de la fiche :

1. La règle en deux lignes (une par forme).
2. **Le test**, avec un exemple qui marche et un qui ne marche pas (✔ / ✘).
3. **Les pièges** : un point par cas particulier de l'analyse.
4. Les variantes admises (1990), s'il y en a.

Court, concret, sans jargon inutile : environ 15 lignes.

## Étape 3 — Construire la banque d'exercices

### Deux niveaux : le socle et l'approfondissement

| | **`## Exercices essentiels`** | **`## Exercices avancés`** |
|---|---|---|
| Nombre | **8 à 12** | **5 à 20** |
| Contenu | Les cas de base, des phrases claires, le tri | Les pièges, les cas rares, les phrases correctes piégeuses, les tournures soutenues |
| Usage dans l'application | Le parcours (« Continuer ») ; la règle est **acquise** quand ce socle est maîtrisé | Le volet « **Aller plus loin** » de la fiche (onglet Cours) |

Chaque cas de l'analyse est couvert par **au moins 2 exercices** (essentiels ou avancés).

### Écrire un exercice

Chaque exercice commence par **son numéro**, en début de ligne. Les numéros se suivent dans tout le fichier (les avancés continuent après les essentiels) et **ne changent plus jamais**. Un nouvel exercice prend le numéro suivant, même s'il est placé ailleurs. Les lignes de détail sont **en retrait** (3 espaces).

```
1. Elle était [tout → toute] rouge de honte.
   Pourquoi : adverbe devant un adjectif féminin commençant par une consonne.

2. Ils sont tout étonnés de la nouvelle.
   Pourquoi : correct, l'adverbe reste invariable devant une voyelle.

3. Il lit ___ les soirs avant de dormir.
   Choix : tout / **tous**
   Pourquoi : déterminant devant « les soirs ».

4. Tri : Dans chaque phrase, « tout » est-il adverbe ou déterminant ?
   Colonnes : Adverbe | Déterminant
   - Ils sont tout étonnés. → Adverbe
   - Elle a dormi toute la nuit. → Déterminant
   Pourquoi : l'adverbe signifie « très ».

5. croire · nous · subjonctif présent → croyions
   Pièges : croyons, croie
```

| Type | Comment l'écrire |
|---|---|
| Phrase avec faute | la faute entre crochets : `[fautif → correct]`, une seule par phrase. L'application la présente au hasard en trou, en correction à taper ou en « trouve la faute ». |
| Phrase correcte (piège) | la phrase sans crochets |
| Choix multiple | un trou `___` et une ligne `Choix :`, la bonne réponse **en gras** |
| Tri | `Tri : consigne`, puis `Colonnes : A | B`, puis une ligne `- élément → colonne` par élément (6 environ) |
| Conjugaison | `verbe · personne · temps → réponse`. Personnes : je, tu, il, nous, vous, ils (impératif : tu, nous, vous ; participe : —). Temps : présent, imparfait, futur, passé simple, conditionnel présent, subjonctif présent, impératif présent, participe passé. La réponse est **vérifiée avec Verbiste** à la construction, et l'explication est rédigée automatiquement si on ne l'écrit pas. |

Lignes de détail possibles : `Pourquoi :` (obligatoire, sauf en conjugaison), `Source :`, `Aussi accepté :` (autres graphies admises), `Pièges :` (mauvaises réponses proposées en conjugaison), `Commentaire :` (relecture).

**« Revoir la règle » ne montre que le point utile.** Après une réponse, le bouton « Revoir la règle » affiche seulement le passage de la fiche qui concerne la phrase (un élément de liste ou un paragraphe), puis un lien « Voir toute la fiche ». L'application choisit ce passage d'après les mots de l'exercice et de son explication. Pour que ce choix soit juste :
- écrire **un point par cas** dans la fiche (une ligne `- ` par piège), avec les mots mêmes des exercices ;
- vérifier le résultat sur la page Relecture (ligne « Rappel affiché ») ;
- si le passage choisi n'est pas le bon, ajouter sous l'exercice une ligne `Rappel : le point de règle à afficher`.

Composition visée (sur l'ensemble) : environ 70 % de phrases avec faute, 10 à 15 % de phrases correctes, 2 ou 3 choix multiples, 1 tri.

### Sources de phrases

1. **Phrases originales**, en priorité : écrites pour le projet, elles sont publiées sous CC BY-SA 4.0 comme le reste du contenu (pas de ligne `Source`). Varier les situations de la vie courante ; ne pas recopier ni paraphraser une phrase trouvée ailleurs.
2. **LanguageTool** (LGPL) : `outils/lt-candidats.json` contient environ 7 000 phrases fautives (le README explique comment le régénérer). Écrire `Source : LanguageTool (<identifiant>)`.

**Règle absolue : n'utiliser que des contenus dont la réutilisation est certaine et sans condition difficile à respecter.** En cas de doute sur une licence, ne pas utiliser la phrase. Les phrases de **Tatoeba** ne sont plus utilisées : leur licence (CC BY 2.0 FR) impose de citer l'auteur de chaque phrase. La construction refuse toute ligne `Source : Tatoeba`.

### Trier les phrases candidates (le plus important)

Écarter toute phrase qui :
- a **une autre réponse défendable**, par exemple un sujet de genre inconnu (« Je suis allé(e) ») ou un pronom ambigu (« Je l'ai vu(e) ») ;
- contient **une autre faute**, un tic oral, une tournure vieillie ou une traduction maladroite ;
- repose sur des **noms propres exotiques** ou des références obscures ;
- est **trop longue** (plus de 15 mots) ou **trop facile** (la faute saute aux yeux sans réfléchir) ;
- est **politiquement ou émotionnellement chargée** (violence, maladie…) ;
- **double** une phrase déjà retenue (même structure, mêmes mots).

Varier les sujets (je, tu, il, elle, nous, on, prénoms courants), les temps et les registres.

### Explications (« Pourquoi »)

Une phrase, qui **applique le test** à cette phrase précise : « « Elle avait peur » : verbe avoir, « a ». ». Jamais un simple « C'est la règle ».

## Étape 4 — Intégrer

1. Créer `contenu/regles/<identifiant>.md` sur le modèle de `a-a.md` : titre, puis `Identifiant :`, `Niveau :` (collège, lycée ou supérieur), `Résumé :`, puis les sections.
2. Dans `contenu/structure.js` : ajouter l'identifiant dans une sous-catégorie, dans `parcours` et, si besoin, dans `liens`.
3. Construire l'application :
   ```bash
   python -I outils/construire.py
   ```
   Le script signale toute erreur de format avec le nom du fichier et le numéro de ligne, et ne modifie rien tant qu'il reste une erreur.
   Il construit aussi le site complet dans `publication/` (une page HTML par règle pour les moteurs de recherche, `sitemap.xml`). Pour le tester : `python -I outils/servir.py`, puis http://localhost:8000.

## Étape 5 — Vérifier

1. `node outils/verifier_contenu.js <identifiant>` : **0 erreur**. Traiter les attentions (taille du socle, nombre d'avancés…).
2. **Relecture critique** des exercices, un par un, comme un correcteur exigeant : « Une autre réponse est-elle défendable ? La phrase est-elle naturelle ? L'explication applique-t-elle le test ? ». Idéalement, la confier à un sous-agent indépendant qui ne voit que les phrases et doit trouver la réponse seul : toute phrase où il hésite ou se trompe est à revoir.
3. Jouer une session dans le navigateur (`/session/<identifiant>`), en essayant chaque type de présentation.

Les nouveaux exercices sont « à relire » (pas de ✔) : seul un relecteur humain les valide.

## Étape 6 — Rendre compte à l'utilisateur

- Le chemin du fichier, l'adresse de la fiche (`/regle/<identifiant>`) et celle de la relecture (`/relecture/<identifiant>`), et ouvrir la fiche dans le navigateur.
- Le nombre d'exercices par cas, les sources utilisées et les points `DOUTE :`.
- Cocher la règle dans `docs/FEUILLE-DE-ROUTE.md` (avec son identifiant).
- Rappeler qu'une relecture humaine est attendue avant publication.

## Annexe — Relire et valider

1. Ouvrir la page **Relecture** : adresse `…/relecture` (elle n'est pas dans les menus).
2. Pour chaque exercice : **✔ Valider** ou **✎ À corriger**, avec un commentaire. Les décisions restent dans le navigateur.
3. **Exporter mes relectures** produit un fichier `relectures-….json`. Pour reporter les décisions dans les fichiers des règles :
   ```bash
   python -I outils/appliquer_relectures.py relectures-….json
   ```
   Le script ajoute ✔ ou ✎ après le numéro, écrit le commentaire sous l'exercice, puis reconstruit l'application.
4. Les exercices marqués ✎ sont corrigés dans le fichier `.md` : on enlève le ✎ et la ligne `Commentaire :`, puis on relance `python -I outils/construire.py`.

Le site peut ne montrer que les exercices validés : passer `SEULEMENT_VALIDES` à `true` en haut de `js/app.js`. Pour l'instant, tous les exercices sont montrés.
