# Contribuer au Projet Plume

Merci ! Toute aide est utile, et **la plupart des contributions ne demandent pas de savoir programmer** : les règles et les exercices sont de simples fichiers texte.

Les contenus sont publiés sous licence CC BY-SA 4.0 et le code sous GPL-3.0. En contribuant, vous acceptez que votre apport soit diffusé sous ces licences.

## Signaler une erreur dans une règle ou un exercice

C'est la contribution la plus précieuse, en particulier de la part des enseignants.

1. Sous chaque correction, sur le site, une ligne indique **la règle, le numéro de l'exercice et le fichier**, par exemple « Règle « a ou à » · exercice 7 (contenu/regles/a-a.md) ».
2. Ouvrez une issue avec le modèle **[Signaler une erreur](https://github.com/Allesca/projet-plume/issues/new?template=erreur.yml)** et recopiez cette ligne.
3. Dites ce qui ne va pas : faute, explication fausse ou confuse, phrase ambiguë (deux réponses possibles), niveau mal choisi…

Sans compte GitHub, vous pouvez écrire à **projet-plume@proton.me**.

## Proposer un exercice ou une règle

- **Un exercice** : ouvrez une issue avec le modèle **Proposer un exercice**, en donnant la phrase, la bonne réponse et une courte explication.
- **Une règle entière** : regardez d'abord la [feuille de route](docs/FEUILLE-DE-ROUTE.md) pour savoir si elle est prévue, puis suivez [la procédure de création](docs/PROCEDURE-CREATION-REGLE.md).

Quelques principes :
- **une seule bonne réponse** par exercice, sans ambiguïté ;
- des phrases naturelles, **écrites par vous**, et différentes des autres exercices de la règle (pas le même cadre avec un mot changé) ;
- un **niveau** adapté : collège, lycée ou supérieur ;
- **rien de copié** d'ouvrages, de sites ou de manuels protégés : seulement des sources sous licence libre (voir [SOURCES.md](SOURCES.md)) ou vos propres phrases.

## Modifier les fichiers directement

1. Chaque règle est un fichier `contenu/regles/<règle>.md`. Le format est expliqué dans [la procédure](docs/PROCEDURE-CREATION-REGLE.md#écrire-un-exercice) ; exemple :

   ```
   12. Elle était [tout → toute] rouge de honte.
       Pourquoi : adverbe devant un adjectif féminin commençant par une consonne.
   ```

2. Vérifiez votre modification :

   ```bash
   python -I outils/construire.py
   node outils/verifier_contenu.js
   python -I outils/servir.py
   ```

   puis jouez la règle sur http://localhost:8000.

3. Proposez une *pull request* en expliquant ce que vous avez changé.

Ne changez **jamais l'identifiant** d'une règle (la ligne `Identifiant :`) : la progression des utilisateurs en dépend. N'ajoutez pas non plus de ✔ : cette marque est réservée à la relecture humaine (page `/relecture`).

## Relire les exercices

La page **/relecture** du site affiche chaque exercice avec sa réponse et son explication, avec les boutons ✔ Valider et ✎ À corriger. Exportez ensuite vos décisions (bouton en haut de la page) et joignez le fichier à une issue : elles seront reportées dans les fichiers.
