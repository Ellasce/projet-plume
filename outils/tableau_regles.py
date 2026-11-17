#!/usr/bin/env python3
"""
Projet Plume — met à jour le tableau des règles réalisées dans docs/FEUILLE-DE-ROUTE.md.

    python -I outils/tableau_regles.py

Le tableau est reconstruit à partir des fichiers contenu/regles/*.md (titre,
identifiant, niveau, nombre d'exercices). Il remplace tout ce qui se trouve entre
la ligne « ## Déjà réalisées » et la section suivante.
"""
import glob
import sys
import io
import os
import re

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEUILLE = os.path.join(RACINE, "docs", "FEUILLE-DE-ROUTE.md")
NIVEAUX = [("collège", "Collège"), ("lycée", "Lycée"), ("supérieur", "Supérieur")]


def lire_regle(chemin):
    texte = io.open(chemin, encoding="utf-8").read()
    titre = texte.split("\n", 1)[0].lstrip("# ").strip()
    ident = re.search(r"^Identifiant : (.+)$", texte, re.M).group(1).strip()
    niveau = re.search(r"^Niveau : (.+)$", texte, re.M).group(1).strip()
    essentiels = re.search(r"^## Exercices essentiels\n(.*?)(?=^## |\Z)", texte, re.M | re.S)
    avances = re.search(r"^## Exercices avancés\n(.*?)(?=^## |\Z)", texte, re.M | re.S)
    compter = lambda m: len(re.findall(r"^\d+\.", m.group(1), re.M)) if m else 0
    return {"titre": titre, "id": ident, "niveau": niveau, "ess": compter(essentiels), "av": compter(avances)}


def main():
    regles = [lire_regle(f) for f in sorted(glob.glob(os.path.join(RACINE, "contenu", "regles", "*.md")))]
    total_ex = sum(r["ess"] + r["av"] for r in regles)
    lignes = ["## Déjà réalisées (%d règles, %d exercices)" % (len(regles), total_ex), "",
              "Tableau mis à jour par `python -I outils/tableau_regles.py`. Toutes les phrases sont originales, sauf celles qui portent une ligne `Source :` (LanguageTool, Verbiste).", ""]
    for cle, nom in NIVEAUX:
        rs = sorted([r for r in regles if r["niveau"] == cle], key=lambda r: r["titre"].lower())
        lignes += ["### %s (%d règles)" % (nom, len(rs)), "", "| Règle | Identifiant | Exercices (socle + avancés) |", "|---|---|---|"]
        lignes += ["| %s | `%s` | %d + %d |" % (r["titre"], r["id"], r["ess"], r["av"]) for r in rs]
        lignes.append("")
    texte = io.open(FEUILLE, encoding="utf-8").read()
    debut = texte.index("## Déjà réalisées")
    fin = texte.index("\n## ", debut + 1) + 1
    texte = texte[:debut] + "\n".join(lignes) + "\n" + texte[fin:]
    io.open(FEUILLE, "w", encoding="utf-8", newline="").write(texte)
    print("%d règles, %d exercices -> docs/FEUILLE-DE-ROUTE.md" % (len(regles), total_ex))


if __name__ == "__main__":
    main()
