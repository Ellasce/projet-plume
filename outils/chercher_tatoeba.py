#!/usr/bin/env python3
"""
Cherche dans les phrases françaises de Tatoeba (CC BY 2.0 FR) des phrases
réelles pour fabriquer des exercices, et propose la version « fautive ».

Données : https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2
(décompresser en fra.tsv : une phrase par ligne, « id <tab> fra <tab> phrase »).

Usage :
    python -I outils/chercher_tatoeba.py fra.tsv MOTIF [options]

    MOTIF        expression régulière ; le groupe 1 (ou tout le motif) est
                 le passage visé par l'exercice
    --fautif X   forme fautive à mettre à la place du passage visé
                 (génère « {X>passage} », prêt pour contenu/regles/*.js)
    --min N      nombre de mots minimum (défaut 5)
    --max N      nombre de mots maximum (défaut 14)
    --nombre N   nombre de phrases proposées (défaut 40)
    --graine N   graine du tirage aléatoire (défaut 1)
    --exclure M  expression régulière : écarte les phrases qui la contiennent

Exemple (« a » verbe, à rendre fautif en « à ») :
    python -I outils/chercher_tatoeba.py fra.tsv "\\b(a)\\b" --fautif à --nombre 30

Les phrases sont des CANDIDATES : chacune doit être relue (procédure dans
docs/PROCEDURE-CREATION-REGLE.md). Garder l'identifiant pour l'attribution :
src: "tatoeba:<id>".
"""
import argparse
import json
import random
import re
import sys


def main():
    p = argparse.ArgumentParser()
    p.add_argument("fichier")
    p.add_argument("motif")
    p.add_argument("--fautif")
    p.add_argument("--min", type=int, default=5)
    p.add_argument("--max", type=int, default=14)
    p.add_argument("--nombre", type=int, default=40)
    p.add_argument("--graine", type=int, default=1)
    p.add_argument("--exclure")
    a = p.parse_args()

    motif = re.compile(a.motif)
    exclure = re.compile(a.exclure) if a.exclure else None
    trouvees = []
    with open(a.fichier, encoding="utf-8") as f:
        for ligne in f:
            morceaux = ligne.rstrip("\n").split("\t")
            if len(morceaux) < 3:
                continue
            ident, phrase = morceaux[0], morceaux[2].replace("’", "'").replace(" ", " ")
            mots = len(phrase.split())
            if not (a.min <= mots <= a.max):
                continue
            if exclure and exclure.search(phrase):
                continue
            # Une seule occurrence : l'exercice n'a alors qu'une réponse possible.
            occurrences = list(motif.finditer(phrase))
            if len(occurrences) != 1:
                continue
            trouvees.append((ident, phrase, occurrences[0]))

    random.Random(a.graine).shuffle(trouvees)
    sys.stdout.reconfigure(encoding="utf-8")
    print("# %d phrases correspondent ; %d proposées" % (len(trouvees), min(a.nombre, len(trouvees))))
    for ident, phrase, m in trouvees[: a.nombre]:
        g = 1 if m.groups() else 0
        debut, fin = m.span(g)
        cible = phrase[debut:fin]
        s = phrase[:debut] + "{" + a.fautif + ">" + cible + "}" + phrase[fin:] if a.fautif else phrase
        print(json.dumps({"src": "tatoeba:" + ident, "s": s}, ensure_ascii=False))


if __name__ == "__main__":
    main()
