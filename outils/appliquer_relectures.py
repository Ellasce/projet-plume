#!/usr/bin/env python3
"""
Projet Plume — reporte les décisions de la page Relecture dans les fichiers des règles.

    python -I outils/appliquer_relectures.py relectures-AAAA-M-J.json

Pour chaque exercice relu (identifiant « règle.numéro ») :
  - ✔ Valider    → un ✔ est placé juste après le numéro : « 12. ✔ La phrase… »
  - ✎ À corriger → un ✎ est placé après le numéro, et le commentaire est écrit
                   sous l'exercice : « Commentaire : … »
Un exercice validé perd son ancien commentaire. Le script relance ensuite
outils/construire.py pour mettre l'application à jour.
"""
import json
import os
import re
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def appliquer(lignes, num, statut, commentaire):
    """Modifie la liste de lignes d'un fichier ; renvoie False si l'exercice est introuvable."""
    motif = re.compile(r"^%d\.\s+(?:[✔✎]\s*)?(.*)$" % num)
    for i, l in enumerate(lignes):
        m = motif.match(l)
        if not m:
            continue
        marque = {"valide": "✔ ", "a-corriger": "✎ "}.get(statut, "")
        lignes[i] = "%d. %s%s" % (num, marque, m.group(1))
        # Bloc de l'exercice : lignes en retrait qui suivent
        fin = i + 1
        while fin < len(lignes) and lignes[fin][:1].isspace() and lignes[fin].strip():
            fin += 1
        bloc = [j for j in range(i + 1, fin) if lignes[j].strip().startswith("Commentaire :")]
        for j in reversed(bloc):
            del lignes[j]
            fin -= 1
        if statut == "a-corriger" and commentaire.strip():
            lignes.insert(fin, "   Commentaire : " + " ".join(commentaire.split()))
        return True
    return False


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    donnees = json.load(open(sys.argv[1], encoding="utf-8"))
    relectures = donnees.get("relectures", donnees)
    par_fichier = {}
    for ident, d in relectures.items():
        regle, _, num = ident.rpartition(".")
        if not regle or not num.isdigit():
            print("ignoré (identifiant invalide) :", ident)
            continue
        par_fichier.setdefault(regle, []).append((int(num), d.get("statut", ""), d.get("commentaire", "")))

    sys.stdout.reconfigure(encoding="utf-8")
    total = 0
    for regle, decisions in sorted(par_fichier.items()):
        chemin = os.path.join(RACINE, "contenu", "regles", regle + ".md")
        if not os.path.exists(chemin):
            print("fichier introuvable :", chemin)
            continue
        lignes = open(chemin, encoding="utf-8").read().split("\n")
        for num, statut, commentaire in decisions:
            if appliquer(lignes, num, statut, commentaire):
                total += 1
                print("%s.%d : %s" % (regle, num, {"valide": "validé ✔", "a-corriger": "à corriger ✎"}.get(statut, "remis à relire")))
            else:
                print("%s.%d : exercice introuvable dans le fichier" % (regle, num))
        open(chemin, "w", encoding="utf-8", newline="\n").write("\n".join(lignes))
    print("\n%d décision(s) reportée(s). Reconstruction de l'application…" % total)
    subprocess.run([sys.executable, "-I", os.path.join(RACINE, "outils", "construire.py")], check=False)


if __name__ == "__main__":
    main()
