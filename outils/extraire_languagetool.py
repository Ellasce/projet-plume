#!/usr/bin/env python3
"""
Extrait les exemples des règles françaises de LanguageTool (LGPL-2.1+).

Entrée  : grammar.xml de LanguageTool
          https://github.com/languagetool-org/languagetool/blob/master/
          languagetool-language-modules/fr/src/main/resources/org/languagetool/rules/fr/grammar.xml
Sortie  : un fichier JSON de candidats (un par phrase fautive), à trier à la main.

Usage :
    python -I outils/extraire_languagetool.py chemin/grammar.xml outils/lt-candidats.json

Chaque candidat contient :
    id          identifiant stable « RULEGROUP_ID[n]#k »
    categorie   catégorie LanguageTool
    groupe      nom du groupe de règles
    message     explication de LanguageTool (balises <suggestion> retirées)
    phrase      phrase fautive, la faute entre crochets : « Il [c'est] trompé. »
    fautif      texte fautif
    correction  correction proposée (la première si plusieurs)
    corrections toutes les corrections proposées
    correctes   phrases correctes données par la même règle
"""
import json
import re
import sys
import xml.etree.ElementTree as ET


def texte_exemple(ex):
    """Renvoie (phrase avec [faute], texte fautif) pour un élément <example>."""
    avant = ex.text or ""
    marker = ex.find("marker")
    if marker is None:
        return avant.strip(), None
    fautif = "".join(marker.itertext())
    apres = marker.tail or ""
    return (avant + "[" + fautif + "]" + apres).strip(), fautif


def nettoyer(s):
    return re.sub(r"\s+", " ", s or "").strip()


def message_regle(regle, groupe):
    for parent in (regle, groupe):
        if parent is None:
            continue
        m = parent.find("message")
        if m is not None:
            return nettoyer("".join(m.itertext()))
    return ""


def main(entree, sortie):
    arbre = ET.parse(entree)
    candidats = []
    for cat in arbre.getroot().iter("category"):
        cat_id = cat.get("id") or cat.get("name")
        for enfant in cat:
            if enfant.tag == "rulegroup":
                groupe, regles = enfant, enfant.findall("rule")
            elif enfant.tag == "rule":
                groupe, regles = None, [enfant]
            else:
                continue
            gid = (groupe.get("id") if groupe is not None else enfant.get("id")) or "?"
            gnom = (groupe.get("name") if groupe is not None else enfant.get("name")) or ""
            for n, regle in enumerate(regles):
                if regle.get("default") == "off" or (groupe is not None and groupe.get("default") == "off"):
                    continue
                exemples = regle.findall("example")
                correctes = [nettoyer(texte_exemple(e)[0].replace("[", "").replace("]", ""))
                             for e in exemples if e.get("correction") is None and e.get("type") is None]
                for k, ex in enumerate(exemples):
                    corr = ex.get("correction")
                    if corr is None:
                        continue
                    phrase, fautif = texte_exemple(ex)
                    if not fautif or not corr.strip():
                        continue
                    toutes = [c.strip() for c in corr.split("|") if c.strip()]
                    candidats.append({
                        "id": "%s[%d]#%d" % (gid, n, k),
                        "categorie": cat_id,
                        "groupe": gnom,
                        "message": message_regle(regle, groupe),
                        "phrase": nettoyer(phrase),
                        "fautif": fautif,
                        "correction": toutes[0],
                        "corrections": toutes,
                        "correctes": correctes,
                    })
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(candidats, f, ensure_ascii=False, indent=1)
    print("%d candidats écrits dans %s" % (len(candidats), sortie))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
