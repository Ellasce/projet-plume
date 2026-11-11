#!/usr/bin/env python3
"""
Projet Plume — construit l'application à partir des règles rédigées en texte.

    python -I outils/construire.py

Lit  : contenu/regles/*.md       (une règle par fichier, format décrit plus bas)
       outils/verbiste/*.xml      (pour vérifier les conjugaisons)
       outils/anciens-identifiants.json (pour garder la progression des utilisateurs)
Écrit : contenu/genere/regles.js  (NE PAS MODIFIER À LA MAIN)
        publication/               (le site complet, prêt à être mis en ligne ou testé
                                    avec « python -I outils/servir.py »)

Format d'un fichier de règle
----------------------------
    # Titre de la règle
    Identifiant : tout            (ne jamais le changer : la progression en dépend)
    Niveau : collège | lycée | supérieur
    Résumé : une phrase

    ## Analyse                    (facultatif, pour les relecteurs ; ignoré par l'application)
    ## En bref                    (facultatif : la règle en 3 ou 4 lignes, montrée avant les exercices ;
                                   sans cette section, l'application prend le début de la fiche)
    ## Fiche                      (le cours)
    ## Pour aller plus loin       (facultatif ; présenté avant les exercices avancés)
    ## Exercices essentiels       (le socle : 8 à 12)
    ## Exercices avancés          (facultatif)

Un exercice commence par son numéro en début de ligne : « 12. ». Le numéro ne
change jamais. Un ✔ juste après le numéro = validé ; ✎ = à corriger.

    12. ✔ Elle était [tout → toute] rouge de honte.       phrase avec faute
    13. Ils sont tout étonnés.                             phrase correcte (piège)
    14. Il lit ___ les soirs.                               choix multiple
        Choix : tout / **tous**                             (bonne réponse en gras)
    15. Tri : consigne                                      tri en deux colonnes
        Colonnes : Adverbe | Déterminant
        - Ils sont tout étonnés. → Adverbe
    16. croire · nous · subjonctif présent → croyions      conjugaison
        Pièges : croyons, croie                             (mauvaises réponses proposées)

Lignes facultatives, en retrait sous l'exercice :
    Pourquoi : explication affichée après la réponse (obligatoire en pratique)
    Source : LanguageTool (ID) | Verbiste
    Aussi accepté : autre graphie, autre graphie
    Commentaire : remarque de relecture
    Rappel : le point de règle à montrer dans « Revoir la règle » (sinon l'application
             choisit seule le passage de la fiche le plus proche de la phrase)
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NIVEAUX = {"collège": "college", "college": "college", "lycée": "lycee", "lycee": "lycee",
           "supérieur": "superieur", "superieur": "superieur"}
SECTIONS = {"analyse": None, "en bref": "bref", "fiche": "fiche", "pour aller plus loin": "plusloin",
            "exercices essentiels": "ess", "exercices avancés": "av", "exercices avances": "av"}

# --- Conjugaison (données Verbiste, GPL-2+) ---
TEMPS = {
    "présent": (("indicative", "present"), "au présent de l'indicatif"),
    "imparfait": (("indicative", "imperfect"), "à l'imparfait de l'indicatif"),
    "futur": (("indicative", "future"), "au futur simple"),
    "passé simple": (("indicative", "simple-past"), "au passé simple"),
    "conditionnel présent": (("conditional", "present"), "au conditionnel présent"),
    "subjonctif présent": (("subjunctive", "present"), "au subjonctif présent"),
    "impératif présent": (("imperative", "imperative-present"), "à l'impératif présent"),
    "participe passé": (("participle", "past-participle"), "au participe passé (masculin singulier)"),
}
PERSONNES = ["je", "tu", "il", "nous", "vous", "ils"]
PERSONNES_IMPERATIF = ["tu", "nous", "vous"]
_verbiste = None


def verbiste():
    global _verbiste
    if _verbiste is None:
        d = os.path.join(RACINE, "outils", "verbiste")
        verbes = {v.findtext("i"): v.findtext("t") for v in ET.parse(os.path.join(d, "verbs-fr.xml")).getroot().iter("v")}
        modeles = {t.get("name"): t for t in ET.parse(os.path.join(d, "conjugation-fr.xml")).getroot().iter("template")}
        _verbiste = (verbes, modeles)
    return _verbiste


def formes_verbiste(verbe, temps):
    verbes, modeles = verbiste()
    if verbe not in verbes:
        return None
    modele = verbes[verbe]
    radical = verbe[: len(verbe) - len(modele.split(":", 1)[1])]
    (mode, tps), _ = TEMPS[temps]
    noeud = modeles[modele].find(mode).find(tps)
    return [[radical + (i.text or "") for i in p.findall("i")] for p in noeud.findall("p")]


def pronom(temps, personne, forme):
    if temps == "participe passé":
        return ""
    if temps == "impératif présent":
        return "(" + personne + ")"
    pr = personne
    if pr == "je" and forme[:1].lower() in "aâàeéèêiîoôuûyh":
        pr = "j'"
    if temps == "subjonctif présent":
        pr = ("qu'" if pr in ("il", "ils") else "que ") + pr
    return pr


def tableau(verbe, temps, toutes):
    if temps == "participe passé":
        return "participe passé : " + ", ".join(f[0] for f in toutes if f)
    noms = PERSONNES_IMPERATIF if temps == "impératif présent" else PERSONNES
    morceaux = []
    for p, f in enumerate(toutes):
        if not f:
            continue
        if temps == "impératif présent":
            morceaux.append(f[0])
        else:
            pr = pronom(temps, noms[p], f[0])
            morceaux.append(pr + ("" if pr.endswith("'") else " ") + f[0])
    return ", ".join(morceaux)


# --- Lecture d'un fichier de règle ---
class Erreur(Exception):
    pass


def lire_regle(chemin, erreurs, attentions):
    nom = os.path.basename(chemin)
    lignes = open(chemin, encoding="utf-8").read().split("\n")
    regle = {"titre": None, "id": None, "niveau": None, "resume": "", "fiche": [], "plusloin": [], "bref": [], "exercices": []}
    section = "entete"
    courant = None  # exercice en cours de lecture
    vus = set()

    def err(no, msg):
        erreurs.append("%s, ligne %d : %s" % (nom, no, msg))

    def clore():
        nonlocal courant
        if courant:
            finir_exercice(courant, regle, err, attentions, nom)
            regle["exercices"].append(courant)
        courant = None

    for no, brut in enumerate(lignes, 1):
        ligne = brut.rstrip()
        if ligne.startswith("# ") and regle["titre"] is None:
            regle["titre"] = ligne[2:].strip()
            continue
        if ligne.startswith("## "):
            clore()
            titre = ligne[3:].strip().lower()
            if titre not in SECTIONS:
                err(no, "section inconnue « %s » (attendu : Analyse, En bref, Fiche, Pour aller plus loin, Exercices essentiels, Exercices avancés)" % ligne[3:].strip())
                section = None
            else:
                section = SECTIONS[titre]
            continue
        if section == "entete":
            m = re.match(r"^(Identifiant|Niveau|Résumé)\s*:\s*(.*)$", ligne)
            if m:
                cle, val = m.group(1), m.group(2).strip()
                if cle == "Identifiant":
                    regle["id"] = val
                elif cle == "Niveau":
                    if val.lower() not in NIVEAUX:
                        err(no, "niveau inconnu « %s » (collège, lycée ou supérieur)" % val)
                    regle["niveau"] = NIVEAUX.get(val.lower())
                else:
                    regle["resume"] = val
            elif ligne.strip():
                err(no, "ligne inattendue avant la première section : « %s »" % ligne.strip())
            continue
        if section in ("fiche", "plusloin", "bref"):
            regle[section].append(brut)
            continue
        if section in ("ess", "av"):
            m = re.match(r"^(\d+)\.\s+(?:(✔|✎)\s*)?(.*)$", ligne)
            if m:
                clore()
                num = int(m.group(1))
                if num in vus:
                    err(no, "le numéro %d est utilisé deux fois" % num)
                vus.add(num)
                statut = {"✔": "valide", "✎": "a-corriger"}.get(m.group(2), "a-relire")
                courant = {"num": num, "avance": section == "av", "statut": statut, "_principal": m.group(3).strip(), "_suite": [], "_ligne": no}
            elif ligne.strip():
                if not courant:
                    err(no, "texte hors d'un exercice numéroté : « %s »" % ligne.strip())
                elif not brut[:1].isspace():
                    err(no, "les lignes d'un exercice doivent être en retrait (commencer par des espaces)")
                else:
                    courant["_suite"].append((no, ligne.strip()))
    clore()

    if not regle["titre"]:
        erreurs.append(nom + " : titre manquant (ligne « # Titre »)")
    if not regle["id"]:
        erreurs.append(nom + " : « Identifiant : » manquant")
    elif regle["id"] + ".md" != nom:
        erreurs.append(nom + " : l'identifiant « %s » ne correspond pas au nom du fichier" % regle["id"])
    if not regle["niveau"]:
        erreurs.append(nom + " : « Niveau : » manquant")
    fiche = "\n".join(regle["fiche"]).strip()
    plus = "\n".join(regle["plusloin"]).strip()
    if not fiche:
        erreurs.append(nom + " : section « ## Fiche » vide")
    resultat = {
        "id": regle["id"], "titre": regle["titre"], "resume": regle["resume"], "niveau": regle["niveau"],
        "fiche": fiche + ("\n\n**Pour aller plus loin**\n" + plus if plus else ""),
        "exercices": regle["exercices"],
    }
    bref = "\n".join(regle["bref"]).strip()
    if bref:
        resultat["bref"] = bref
    return resultat


def finir_exercice(ex, regle, err, attentions, nom):
    principal, suite, no = ex.pop("_principal"), ex.pop("_suite"), ex.pop("_ligne")
    champs, items = {}, []
    for n, l in suite:
        m = re.match(r"^(Pourquoi|Source|Aussi accepté|Commentaire|Rappel|Choix|Colonnes|Pièges)\s*:\s*(.*)$", l)
        if m:
            champs[m.group(1)] = m.group(2).strip()
        elif l.startswith("- "):
            items.append((n, l[2:].strip()))
        else:
            err(n, "ligne non reconnue : « %s »" % l)
    m = re.search(r"\s+Choix\s*:\s*(.*)$", principal)
    if m:  # « Choix : » écrit sur la même ligne que la phrase
        champs["Choix"] = m.group(1).strip()
        principal = principal[: m.start()].strip()

    if principal.startswith("Tri :") or principal.startswith("Tri:"):
        ex["t"] = "tri"
        ex["consigne"] = principal.split(":", 1)[1].strip()
        cols = [c.strip() for c in champs.get("Colonnes", "").split("|")]
        if len(cols) != 2 or not all(cols):
            err(no, "un tri a besoin de « Colonnes : colonne 1 | colonne 2 »")
            cols = ["?", "?"]
        ex["c"] = cols
        ex["items"] = []
        for n, it in items:
            if "→" not in it:
                err(n, "élément de tri sans « → colonne »")
                continue
            texte, col = [x.strip() for x in it.rsplit("→", 1)]
            if col in cols:
                ex["items"].append([texte, cols.index(col)])
            elif col in ("1", "2"):
                ex["items"].append([texte, int(col) - 1])
            else:
                err(n, "colonne inconnue « %s » (attendu : %s)" % (col, " ou ".join(cols)))
    elif " · " in principal and "→" in principal and "[" not in principal:
        ex["t"] = "conj"
        gauche, reponse = [x.strip() for x in principal.rsplit("→", 1)]
        morceaux = [x.strip() for x in gauche.split("·")]
        if len(morceaux) != 3:
            err(no, "conjugaison attendue sous la forme « verbe · personne · temps → réponse »")
            return
        verbe, personne, temps = morceaux
        if temps not in TEMPS:
            err(no, "temps inconnu « %s » (possibles : %s)" % (temps, ", ".join(TEMPS)))
            return
        ex.update(v=verbe, temps=TEMPS[temps][1], r=reponse, pr=pronom(temps, personne, reponse))
        ex["o"] = [x.strip() for x in champs.get("Pièges", "").split(",") if x.strip()]
        # Vérification avec Verbiste
        toutes = formes_verbiste(verbe, temps)
        if toutes is None:
            attentions.append("%s, ligne %d : verbe « %s » absent de Verbiste (réponse non vérifiée)" % (nom, no, verbe))
        else:
            noms = PERSONNES_IMPERATIF if temps == "impératif présent" else PERSONNES
            p = 0 if temps == "participe passé" else (noms.index(personne) if personne in noms else -1)
            if p < 0:
                err(no, "personne inconnue « %s »" % personne)
            elif p < len(toutes) and toutes[p] and reponse not in toutes[p]:
                attentions.append("%s, ligne %d : Verbiste donne « %s », le fichier dit « %s »" % (nom, no, " / ".join(toutes[p]), reponse))
            if "Pourquoi" not in champs:
                champs["Pourquoi"] = "« %s » %s : %s." % (verbe, TEMPS[temps][1], tableau(verbe, temps, toutes))
    elif "Choix" in champs:
        ex["t"] = "choix"
        if principal.count("___") != 1:
            err(no, "un choix multiple a exactement un trou « ___ »")
        opts = [o.strip() for o in champs["Choix"].split("/")]
        bonnes = [i for i, o in enumerate(opts) if o.startswith("**") and o.endswith("**")]
        if len(bonnes) != 1:
            err(no, "mettre exactement une option en gras : **bonne réponse**")
            bonnes = [0]
        ex.update(s=principal, o=[o.strip("*").strip() for o in opts], a=bonnes[0])
    else:
        ex["t"] = "faute"
        fautes = re.findall(r"\[([^\]→]*)→([^\]]*)\]", principal)
        if len(fautes) > 1:
            err(no, "une seule faute par phrase")
        if principal.count("[") != len(fautes):
            err(no, "crochet mal formé : écrire [fautif → correct]")
        ex["s"] = re.sub(r"\[([^\]→]*)→([^\]]*)\]", lambda m: "{" + m.group(1).strip() + ">" + m.group(2).strip() + "}", principal)

    if champs.get("Pourquoi"):
        ex["e"] = champs["Pourquoi"]
    else:
        err(no, "explication manquante (ligne « Pourquoi : »)")
    if champs.get("Aussi accepté"):
        ex["alt"] = [x.strip() for x in champs["Aussi accepté"].split(",") if x.strip()]
    if champs.get("Commentaire"):
        ex["commentaire"] = champs["Commentaire"]
    if champs.get("Rappel"):
        ex["rappel"] = champs["Rappel"]
    src = champs.get("Source", "")
    if src:
        if re.match(r"^Tatoeba", src):
            # CC BY : chaque phrase imposerait de citer son auteur. Le projet n'en utilise plus.
            err(no, "les phrases de Tatoeba ne sont plus acceptées : écrire une phrase originale")
        ex["src"] = "verbiste" if src == "Verbiste" else (
                    re.match(r"^LanguageTool \((.+)\)$", src).group(1) if re.match(r"^LanguageTool \((.+)\)$", src) else src)


def main():
    dossier = os.path.join(RACINE, "contenu", "regles")
    erreurs, attentions, regles = [], [], []
    for f in sorted(os.listdir(dossier)):
        if f.endswith(".md"):
            r = lire_regle(os.path.join(dossier, f), erreurs, attentions)
            for e in r["exercices"]:
                e["id"] = "%s.%d" % (r["id"], e["num"])
            regles.append(r)
    sys.stdout.reconfigure(encoding="utf-8")
    for a in attentions:
        print("ATTENTION  " + a)
    if erreurs:
        for e in erreurs:
            print("ERREUR     " + e)
        sys.exit("\n%d erreur(s) : rien n'a été écrit." % len(erreurs))

    anciens = {}
    chemin_anciens = os.path.join(RACINE, "outils", "anciens-identifiants.json")
    if os.path.exists(chemin_anciens):
        anciens = json.load(open(chemin_anciens, encoding="utf-8"))

    sortie = os.path.join(RACINE, "contenu", "genere", "regles.js")
    os.makedirs(os.path.dirname(sortie), exist_ok=True)
    with open(sortie, "w", encoding="utf-8", newline="\n") as f:
        f.write("/*\n * FICHIER GÉNÉRÉ par outils/construire.py — NE PAS MODIFIER À LA MAIN.\n"
                " * Pour corriger une règle ou un exercice : modifier contenu/regles/<règle>.md,\n"
                " * puis lancer « python -I outils/construire.py ».\n"
                " * Licences : voir LICENCES.md (chaque exercice indique sa source).\n */\n")
        f.write("window.PLUME_REGLES = ")
        json.dump(regles, f, ensure_ascii=False, indent=1)
        f.write(";\nwindow.PLUME_ANCIENS_IDS = ")
        json.dump(anciens, f, ensure_ascii=False)
        f.write(";\n")
    n = sum(len(r["exercices"]) for r in regles)
    v = sum(1 for r in regles for e in r["exercices"] if e["statut"] == "valide")
    print("%d règles, %d exercices (%d validés) → %s" % (len(regles), n, v, os.path.relpath(sortie, RACINE)))
    # Pages statiques (une page HTML par adresse, sitemap…) dans publication/
    import shutil
    import subprocess
    dest = os.path.join(RACINE, "publication")
    shutil.rmtree(dest, ignore_errors=True)
    r = subprocess.run(["node", os.path.join(RACINE, "outils", "generer_site.js")])
    if r.returncode:
        sys.exit("La génération des pages a échoué.")


if __name__ == "__main__":
    main()
