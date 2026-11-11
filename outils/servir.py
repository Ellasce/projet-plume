#!/usr/bin/env python3
"""
Projet Plume — petit serveur local pour tester le site construit.

    python -I outils/servir.py [port]        (8000 par défaut)

Sert le dossier publication/ comme le fait Cloudflare Pages :
  /regles/a-a      → regles/a-a.html
  adresse inconnue → index.html (l'application affiche la bonne vue)
Lancer d'abord « python -I outils/construire.py ».
"""
import http.server
import os
import sys

DOSSIER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "publication")


class Serveur(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DOSSIER, **kwargs)

    def send_head(self):
        chemin = self.path.split("?", 1)[0].split("#", 1)[0]
        local = self.translate_path(chemin)
        if not os.path.isfile(local):
            if os.path.isfile(local.rstrip("/\\") + ".html"):
                self.path = chemin.rstrip("/") + ".html"
            else:
                self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print("Projet Plume : http://localhost:%d  (dossier publication/)" % port)
    http.server.ThreadingHTTPServer(("", port), Serveur).serve_forever()
