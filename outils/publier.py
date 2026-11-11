#!/usr/bin/env python3
"""
Projet Plume — met le site en ligne (Cloudflare Pages).

    python -I outils/publier.py

1. construit le site dans publication/ (outils/construire.py : règles, pages
   statiques, sitemap) ;
2. l'envoie sur Cloudflare Pages (projet « projet-plume » → https://projet-plume.pages.dev).
Première fois : se connecter avec « npx wrangler login ».
"""
import os
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    r = subprocess.run([sys.executable, "-I", os.path.join(RACINE, "outils", "construire.py")])
    if r.returncode:
        sys.exit("Construction en échec : rien n'a été publié.")
    print("Envoi sur Cloudflare…")
    npx = "npx.cmd" if os.name == "nt" else "npx"
    commande = [npx, "wrangler", "pages", "deploy", ".", "--project-name", "projet-plume", "--branch", "main", "--commit-dirty=true"]
    sys.exit(subprocess.run(commande, cwd=os.path.join(RACINE, "publication")).returncode)


if __name__ == "__main__":
    main()
