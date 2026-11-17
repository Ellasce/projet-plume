# Feuille de route du contenu

Liste des règles à créer, établie d'après les programmes du collège et du lycée et les difficultés les plus courantes de l'orthographe française.

Chaque règle se crée en suivant [la procédure](PROCEDURE-CREATION-REGLE.md). Quand une règle est en ligne, on coche sa case et on indique son identifiant.

**Priorité** : 🔴 erreur très fréquente, à faire en premier · 🟠 importante · 🟢 approfondissement.
**Niveau** : collège · lycée · supérieur. Répartition revue le 17 novembre 2026 : les notions simples sont au collège, le supérieur est réservé aux vraies difficultés (accords rares, langue soutenue, vocabulaire précis).

## Ordre conseillé

1. Les 🔴 du collège en homophones et en accords (et / est, on / ont, son / sont, ou / où, leur / leurs, accord sujet-verbe, pluriel des noms) : les erreurs les plus fréquentes, même chez les adultes.
2. Le passé composé, ainsi que le COD et le COI : ils débloquent toute la partie participe passé.
3. L'orthographe d'usage (consonnes doubles, accents, -amment / -emment, majuscules, trait d'union) : la catégorie entièrement absente.
4. La ponctuation, puis les règles 🟢.

## Déjà réalisées (116 règles, 2059 exercices)

Tableau mis à jour par `python -I outils/tableau_regles.py`. Toutes les phrases sont originales, sauf celles qui portent une ligne `Source :` (LanguageTool, Verbiste).

### Collège (60 règles)

| Règle | Identifiant | Exercices (socle + avancés) |
|---|---|---|
| -ai ou -ais à la fin des verbes | `ai-ais` | 11 + 8 |
| a ou as, es ou est, ai, aie ou ait | `a-as-es-est` | 11 + 6 |
| a ou à | `a-a` | 10 + 23 |
| Avec « tu », toujours un s | `tu-s` | 11 + 9 |
| c'est ou ce sont | `cest-ce-sont` | 11 + 8 |
| ce ou ceux | `ce-ceux` | 11 + 7 |
| ce, cet ou cette | `cet-cette` | 11 + 8 |
| Ce, se, ces, ses, c'est, s'est | `ce-se-ces-ses` | 10 + 8 |
| chaque ou chacun | `chaque-chacun` | 11 + 6 |
| COD et COI | `cod-coi` | 11 + 8 |
| Conjuguer les verbes pronominaux | `pronominaux-conj` | 11 + 6 |
| Doubler ou non la consonne | `consonnes-doubles` | 11 + 8 |
| du ou dû, sur ou sûr, mur ou mûr | `du-du` | 11 + 8 |
| et ou est | `et-est` | 11 + 8 |
| Futur ou conditionnel : -rai ou -rais | `futur-conditionnel` | 10 + 7 |
| Imparfait ou passé simple dans un récit | `imparfait-passe-simple` | 11 + 6 |
| Infinitif ou participe passé : -er, -é, -ez | `infinitif-participe` | 11 + 10 |
| L'accord dans le groupe nominal | `accord-gn` | 11 + 8 |
| L'accord de l'attribut du sujet | `attribut-sujet` | 11 + 6 |
| L'accord du verbe avec son sujet | `accord-sujet-verbe` | 11 + 8 |
| L'imparfait | `conj-base-imparfait` | 8 + 5 |
| L'élision : l', qu', jusqu'à, presqu'île | `elision` | 11 + 6 |
| La négation : ne pas oublier « ne » | `negation-ne` | 11 + 8 |
| la, l'a ou là | `la-la` | 13 + 8 |
| Le futur simple | `conj-base-futur` | 9 + 5 |
| Le féminin des noms et des adjectifs | `feminin` | 11 + 7 |
| Le pluriel des noms | `pluriel-noms` | 11 + 8 |
| Le présent des trois groupes | `conj-base-present` | 10 + 5 |
| Le son « s » : s, ss, c, ç, sc | `son-s` | 11 + 6 |
| Le trait d'union | `trait-union` | 11 + 8 |
| Les accents : é, è, ê | `accents` | 11 + 8 |
| Les accents sur les majuscules : À, É, Ç | `majuscules-accentuees` | 11 + 6 |
| Les lettres muettes en fin de mot | `lettres-muettes` | 11 + 6 |
| Les majuscules | `majuscules` | 11 + 8 |
| Les mots en -tion, -sion, -ssion | `tion-sion` | 11 + 6 |
| Les mots invariables courants | `mots-invariables` | 11 + 6 |
| Les noms en -é, -ée, -té, -tié | `noms-ee-te` | 11 + 6 |
| Les pronoms en et y | `en-y` | 11 + 6 |
| Les trois groupes de verbes | `conj-groupes` | 8 + 8 |
| leur ou leurs | `leur-leurs` | 12 + 8 |
| m devant m, b, p | `m-devant-mbp` | 11 + 6 |
| ma ou m'a, ta ou t'a, mon ou m'ont, ton ou t'ont | `ma-m-a` | 11 + 7 |
| mes, mais, met ou mets | `mes-mais-met` | 11 + 8 |
| ni ou n'y | `ni-n-y` | 11 + 7 |
| on, ont ou on n' | `on-ont` | 11 + 8 |
| ou ou où | `ou-ou` | 12 + 8 |
| parce que ou par ce que | `parce-que` | 11 + 6 |
| Participe passé : pris, fini, dit, mis | `pp-terminaison` | 11 + 8 |
| Participe passé avec être ou avoir | `pp-etre-avoir` | 10 + 7 |
| Passé composé : être ou avoir ? | `pc-auxiliaire` | 11 + 8 |
| peu, peut ou peux | `peu-peut` | 12 + 8 |
| Plus-que-parfait et futur antérieur | `pqp-futur-anterieur` | 11 + 6 |
| près ou prêt | `pres-pret` | 11 + 8 |
| quand, quant ou qu'en | `quand-quant` | 12 + 8 |
| sais, sait, c'est ou s'est | `sais-sait` | 11 + 8 |
| sans ou s'en | `sans-s-en` | 11 + 8 |
| si, s'y ou ci | `si-s-y` | 11 + 8 |
| son ou sont | `son-sont` | 12 + 7 |
| Verbes en -cer, -ger, -eler, -eter, -yer | `verbes-cer-ger` | 11 + 9 |
| ça ou sa | `ca-sa` | 11 + 7 |

### Lycée (40 règles)

| Règle | Identifiant | Exercices (socle + avancés) |
|---|---|---|
| Accords délicats du verbe avec le sujet | `accords-sujet-delicats` | 8 + 6 |
| Adjectif ou adverbe : sentir bon, parler fort | `adjectif-adverbe` | 11 + 6 |
| Aucun, nul, plusieurs, certains : singulier ou pluriel ? | `aucun-nul` | 11 + 6 |
| censé ou sensé | `cense-sense` | 11 + 6 |
| davantage ou d'avantage | `davantage` | 11 + 6 |
| demi, mi, semi et nu | `demi-nu` | 11 + 7 |
| dont ou que | `dont-que` | 11 + 8 |
| Futur et conditionnel : courrai, enverrai, appellera | `conj-futur` | 8 + 7 |
| Impératif : va, cueille, aie, veuillez | `conj-imperatif` | 8 + 6 |
| Indicatif ou subjonctif | `modes-conjonctions` | 9 + 9 |
| L'accord avec « on » et le « vous » de politesse | `accord-on-vous` | 11 + 6 |
| L'accord des adjectifs de couleur | `couleurs` | 11 + 8 |
| L'impératif avec des pronoms : donne-le-moi, vas-y | `imperatif-pronoms` | 11 + 6 |
| L'interrogation indirecte | `interrogation-indirecte` | 11 + 8 |
| La concordance des temps | `concordance-temps` | 11 + 8 |
| La construction des verbes : à, de ou rien ? | `constructions-verbes` | 11 + 8 |
| La virgule | `virgule` | 11 + 8 |
| La voix passive | `passif` | 11 + 6 |
| Le conditionnel passé : j'aurais dû | `conditionnel-passe` | 11 + 8 |
| Le participe passé employé seul | `pp-seul` | 11 + 6 |
| Le pluriel des noms composés | `noms-composes` | 11 + 6 |
| Le subjonctif passé : que j'aie fini | `subjonctif-passe` | 11 + 6 |
| Les adverbes en -amment et -emment | `amment-emment` | 11 + 8 |
| Les deux-points et le point-virgule | `deux-points` | 11 + 6 |
| Les mots souvent mal orthographiés | `mots-difficiles` | 11 + 8 |
| Les pronoms relatifs : qui, que, où, lequel | `pronoms-relatifs` | 11 + 8 |
| Les préfixes il-, ir-, im- : illégal, irréel, immobile | `prefixes-in` | 11 + 6 |
| Les prépositions : à vélo, en voiture, au Portugal | `prepositions` | 11 + 6 |
| même ou mêmes | `meme` | 11 + 6 |
| notre ou nôtre, votre ou vôtre | `notre-notre` | 11 + 7 |
| Nous criions, nous payions, nous gagnions : verbes en -ier, -yer, -gner, -iller | `ier-yer-gner` | 11 + 6 |
| Participe passé avec avoir : le COD placé avant | `pp-cod-avant` | 9 + 7 |
| plutôt ou plus tôt | `plutot-plus-tot` | 12 + 7 |
| Présent : les verbes en -dre, -indre, -soudre, -cre | `conj-present` | 8 + 9 |
| Quel, quelle ou qu'elle | `quel-quelle-qu-elle` | 9 + 7 |
| quoique ou quoi que | `quoique` | 11 + 6 |
| Subjonctif présent : que nous croyions, que j'aie | `conj-subjonctif` | 8 + 8 |
| Tout, tous, toute, toutes | `tout` | 10 + 7 |
| voir ou voire | `voir-voire` | 11 + 6 |
| Écrire les nombres : vingt, cent, mille | `vingt-cent-mille` | 10 + 6 |

### Supérieur (16 règles)

| Règle | Identifiant | Exercices (socle + avancés) |
|---|---|---|
| Constructions fautives, barbarismes et pléonasmes | `constructions-fautives` | 8 + 10 |
| Excepté, vu, passé, compris, ci-joint : avant ou après le nom | `participes-invariables` | 11 + 6 |
| L'accord avec des sujets coordonnés : comme, ainsi que, avec, ou | `sujets-coordonnes` | 11 + 6 |
| Le genre des noms piégeux : un astérisque, une oasis | `genre-noms` | 11 + 6 |
| Les paronymes | `paronymes` | 8 + 7 |
| Les paronymes, 2e série : irruption, compréhensif, recouvrer | `paronymes-2` | 11 + 6 |
| Les pléonasmes : monter en haut, sortir dehors | `pleonasmes` | 11 + 6 |
| Participe passé : conclu, inclus, dû | `conj-participe` | 8 + 6 |
| Participe passé : coûter, valoir, courir, peser, vivre et verbes impersonnels | `pp-couter-valoir` | 11 + 6 |
| Participe passé des verbes pronominaux | `pp-pronominaux` | 8 + 8 |
| Participe passé suivi d'un infinitif | `pp-infinitif` | 8 + 7 |
| Participe présent ou adjectif verbal | `participe-present-adjectif` | 8 + 8 |
| Passé simple : il vainquit, il résolut, ils vinrent | `conj-passe-simple` | 8 + 8 |
| Passé simple ou subjonctif imparfait : il fut, qu'il fût | `subjonctif-imparfait` | 11 + 6 |
| Quelque, quelques, quel que | `quelque-quel-que` | 8 + 8 |
| Tel, tel que, tel quel | `tel-tel-que` | 11 + 6 |

## 1. Homophones

- [x] 🟠 mes / mais / met / mets — collège → `mes-mais-met`
- [x] 🟠 sans / s'en / sang / cent — collège → `sans-s-en`
- [x] 🟠 si / s'y / ci — collège → `si-s-y`
- [x] 🟠 ni / n'y — collège → `ni-n-y`
- [x] 🟠 près / prêt — collège → `pres-pret`
- [ ] 🟠 -é / -ée / -er / -ez / -ait (version complète) — collège
- [x] 🟠 quoique / quoi que — supérieur → `quoique`
- [x] 🟠 davantage / d'avantage — supérieur → `davantage`
- [x] 🟠 voir / voire — supérieur → `voir-voire`
- [x] 🟠 censé / sensé — supérieur → `cense-sense`
- [ ] 🟢 dans / d'en — collège
- [ ] 🟢 quelquefois / quelques fois — collège
- [ ] 🟢 tant / temps / t'en — collège
- [ ] 🟢 sitôt / si tôt, bientôt / bien tôt — lycée
- [ ] 🟢 tache / tâche, cote / côte / cotte — lycée

## 2. Accords

- [x] 🟠 Féminin des noms et des adjectifs — collège → `feminin`
- [x] 🟠 Chaque / chacun — collège → `chaque-chacun`
- [x] 🟠 Pluriel des noms composés (des grands-mères, des après-midi) — lycée → `noms-composes`
- [x] 🟠 Même / mêmes (adverbe ou adjectif) — lycée → `meme`
- [x] 🟠 Accord avec « on », le « vous » de politesse, le « nous » de modestie — lycée → `accord-on-vous`
- [x] 🟠 Participe passé employé seul, en tête de phrase — lycée → `pp-seul`
- [x] 🟠 Ci-joint, ci-inclus, excepté, vu, passé — supérieur → `participes-invariables`
- [x] 🟠 Sujets coordonnés (ou, ni, comme, ainsi que, avec) — supérieur → `sujets-coordonnes`
- [ ] 🟠 Noms collectifs (une foule de, un grand nombre de, la moitié de) — supérieur
- [x] 🟠 Participe passé des verbes impersonnels et de coûter, valoir, peser, courir — supérieur → `pp-couter-valoir`
- [ ] 🟢 Accord de « quelque chose », « personne », « rien » — lycée
- [ ] 🟢 Un millier, une dizaine, accord des ordinaux — lycée
- [ ] 🟢 Adjectifs composés (des enfants nouveau-nés, ivres morts) — supérieur
- [ ] 🟢 Accord de « possible » (le plus de fautes possible) — supérieur
- [ ] 🟢 Participe passé avec « en » et avec le « le » neutre — supérieur
- [ ] 🟢 Participe passé suivi d'un attribut (je l'ai trouvée belle) — supérieur

## 3. Conjugaison

- [x] 🟠 Plus-que-parfait et futur antérieur — collège → `pqp-futur-anterieur`
- [x] 🟠 Imparfait ou passé simple dans un récit — collège → `imparfait-passe-simple`
- [x] 🟠 Subjonctif passé — lycée → `subjonctif-passe`
- [ ] 🟠 Verbes en -indre et -soudre (complet) — lycée
- [x] 🟠 Passif et voix pronominale — lycée → `passif`
- [x] 🟠 Impératif + pronoms (donne-le-moi, vas-y, manges-en) — lycée → `imperatif-pronoms`
- [ ] 🟢 Verbes défectifs (falloir, pleuvoir, clore, frire) — supérieur
- [x] 🟢 Subjonctif imparfait (reconnaître, lire) — supérieur → `subjonctif-imparfait`

## 4. Orthographe d'usage (catégorie à créer)

- [x] 🟠 m devant m, b, p — collège → `m-devant-mbp`
- [x] 🟠 Le son « s » : s, ss, c, ç, sc — collège → `son-s`
- [x] 🟠 Lettres muettes en fin de mot (-ement, -ment, -ent) — collège → `lettres-muettes`
- [x] 🟠 Noms en -ée, -té, -tié (l'année, la beauté, la moitié) — collège → `noms-ee-te`
- [x] 🟠 Mots invariables courants (parmi, malgré, toujours, longtemps) — collège → `mots-invariables`
- [x] 🟠 Mots en -tion, -sion, -ssion, -xion — collège → `tion-sion`
- [x] 🟠 Préfixes : ac-, ap-, ad-, at-, ir-, il-, im- — lycée → `prefixes-in` (ac-, ap-… déjà dans `consonnes-doubles`)
- [x] 🟠 Élision et apostrophe (presqu'île, lorsqu'il, jusqu'à) — lycée → `elision`
- [ ] 🟠 Accent circonflexe : quand le garder (dû, sûr, mûr, jeûne) — supérieur
- [ ] 🟢 Le son « g » et « j » : g, ge, gu — collège
- [ ] 🟢 Noms en -ail / -aille, -eil / -eille, -euil / -euille — collège
- [ ] 🟢 Tréma (naïf, Noël, aigüe en 1990) — collège
- [ ] 🟢 Rectifications orthographiques de 1990 — supérieur
- [ ] 🟢 Abréviations et sigles (M., Mme, n°, etc.) — supérieur

## 5. Grammaire (catégorie à créer)

- [ ] 🟠 Classes de mots (nom, verbe, adjectif, adverbe, préposition…) — collège
- [x] 🟠 Attribut du sujet — collège → `attribut-sujet`
- [x] 🟠 Pronoms personnels COD et COI (le, la, lui, leur, en, y) — collège → `en-y` (le, la, lui, leur : `cod-coi`)
- [x] 🟠 Prépositions : à / de, en / dans (aller à vélo, en voiture) — lycée → `prepositions`
- [ ] 🟢 Discours direct et indirect — lycée
- [ ] 🟢 Propositions subordonnées (repérage) — lycée

## 6. Ponctuation et typographie (catégorie à créer)

- [x] 🟠 Point-virgule et deux-points — lycée → `deux-points`
- [x] 🟠 Les majuscules accentuées (À, É) — collège → `majuscules-accentuees`
- [ ] 🟠 Espaces avant ; : ! ? et dans les guillemets « » — supérieur
- [ ] 🟢 Guillemets et citations — lycée
- [ ] 🟢 Points de suspension et « etc. » — lycée
- [ ] 🟢 Nombres en chiffres ou en lettres, séparateurs, dates — supérieur

## 7. Bien écrire et vocabulaire

- [x] 🟠 Pléonasmes (règle dédiée et complète) — supérieur → `pleonasmes`
- [ ] 🟠 Anglicismes (« impacter », « faire sens », « en charge de ») — supérieur
- [ ] 🟠 Barbarismes et mots déformés (règle dédiée) — supérieur
- [x] 🟠 Paronymes, 2e série (éruption / irruption, compréhensible / compréhensif) — supérieur → `paronymes-2`
- [ ] 🟠 « Malgré que », « de manière à ce que » — supérieur
- [x] 🟠 Genre des noms piégeux (un astérisque, une acné, un pétale, une oasis) — supérieur → `genre-noms`
- [ ] 🟢 Registres de langue (familier, courant, soutenu) — lycée
- [ ] 🟢 Noms qui changent de genre (amour, délice, orgue) — supérieur

## 8. Écrits professionnels (catégorie à créer)

- [ ] 🟠 Formules d'appel et de politesse dans un courriel — supérieur
- [ ] 🟠 « Ci-joint », « veuillez trouver », « je vous prie de » — supérieur
- [ ] 🟢 Tournures critiquées des courriels (« suite à », « je reste à votre disposition ») — supérieur
- [ ] 🟢 Écrire une date, une heure, une somme d'argent — supérieur

## 9. Ajouts proposés (absents de la première liste)

Homophones
- [x] 🟠 ma / m'a, ta / t'a, mon / m'ont, ton / t'ont — collège → `ma-m-a`
- [x] 🟠 ce / ceux — collège → `ce-ceux`
- [x] 🟠 cet / cette — collège → `cet-cette`
- [x] 🟠 notre / nôtre, votre / vôtre — lycée → `notre-notre`
- [x] 🟠 du / dû, sur / sûr, mur / mûr — lycée → `du-du`
- [x] 🟠 parce que / par ce que — lycée → `parce-que`
- [x] 🟠 a / as, es / est, ai / aie / ait (les formes d'être et d'avoir qui se ressemblent) — collège → `a-as-es-est`
- [ ] 🟢 or / hors, cour / cours / court, vers / vert / verre, compte / conte / comte — collège
- [ ] 🟢 différent / différend, fond / fonds / fonts, pause / pose, repaire / repère — supérieur

Accords et grammaire
- [x] 🟠 tel, tel que, tel quel — supérieur → `tel-tel-que`
- [x] 🟠 aucun, nul, chaque, plusieurs, certains (singulier ou pluriel ?) — lycée → `aucun-nul`
- [x] 🟠 Adjectif ou adverbe (des fleurs qui sentent bon, ils parlent fort) — lycée → `adjectif-adverbe`

Conjugaison
- [x] 🟠 Verbes pronominaux : conjugaison et auxiliaire être — collège → `pronominaux-conj`
- [x] 🟠 Imparfait et subjonctif des verbes en -ier, -yer, -gner, -iller (nous criions, nous payions) — lycée → `ier-yer-gner`

Fonctions du site (ce ne sont pas des règles)
- [ ] Dictées courtes, lues par la synthèse vocale du navigateur
- [ ] Bilan par thème à la fin du parcours (test de niveau final)
