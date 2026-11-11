#!/usr/bin/env node
/*
 * Projet Plume — génère le site statique dans publication/ (GPL-3.0-or-later)
 *
 *     node outils/generer_site.js        (appelé par outils/construire.py)
 *
 * Pourquoi un script maison plutôt qu'un outil de « prerendering » (Astro, Vite…) ?
 * Le site n'a ni framework ni étape de compilation : les règles sont déjà des
 * données (contenu/genere/regles.js). Il suffit d'écrire, pour chaque page, un
 * fichier HTML contenant le texte (titre, description, <h1>, fiche). Les moteurs
 * de recherche lisent ce HTML sans exécuter de JavaScript ; chez le visiteur,
 * js/app.js remplace ensuite ce contenu par la version interactive.
 *
 * Produit : une page .html par adresse, sitemap.xml, robots.txt, _redirects,
 * et la copie des fichiers du site (css, js, img, contenu).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const racine = path.join(__dirname, "..");
const sortie = path.join(racine, "publication");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const { esc, rendreFiche } = require("../js/fiche.js");

const site = JSON.parse(lire("outils/site.json"));
const contexte = { window: {} };
vm.createContext(contexte);
["contenu/genere/regles.js", "contenu/structure.js", "contenu/pages.js"].forEach((f) => vm.runInContext(lire(f), contexte, { filename: f }));
const REGLES = contexte.window.PLUME_REGLES;
const STRUCTURE = contexte.window.PLUME_STRUCTURE;
const PAGES = contexte.window.PLUME_PAGES;
const parId = Object.fromEntries(REGLES.map((r) => [r.id, r]));
const NIVEAUX = Object.fromEntries(STRUCTURE.niveaux.map((n) => [n.id, n.titre]));

// Place de chaque règle (catégorie, sous-catégorie) et règles liées
const place = {};
STRUCTURE.categories.forEach((cat) => cat.sous.forEach((sous) => sous.regles.forEach((id) => { place[id] = { cat, sous }; })));
const liees = {};
Object.entries(STRUCTURE.liens || {}).forEach(([a, autres]) => autres.forEach((b) => {
  (liees[a] = liees[a] || new Set()).add(b);
  (liees[b] = liees[b] || new Set()).add(a);
}));

const gabarit = lire("gabarit.html");
const pages = []; // { chemin, indexable }

function ecrire(fichier, contenu) {
  const cible = path.join(sortie, fichier);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, contenu);
}

function page({ chemin, titre, description, contenu, canonique, indexable = true }) {
  const html = gabarit
    .replace(/\{\{TITRE\}\}/g, esc(titre))
    .replace(/\{\{DESCRIPTION\}\}/g, esc(description))
    .replace(/\{\{CANONIQUE\}\}/g, site.url + (canonique || chemin))
    .replace("{{ROBOTS}}", indexable ? "index, follow" : "noindex, follow")
    .replace(/\{\{IMAGE\}\}/g, site.url + "/img/og.png")
    .replace("{{GITHUB}}", site.github ? ' · <a href="' + esc(site.github) + '" rel="noopener">Code source sur GitHub</a>' : "")
    .replace("{{CONTENU}}", contenu);
  ecrire(chemin === "/" ? "index.html" : chemin.slice(1) + ".html", html);
  if (indexable && !canonique) pages.push(chemin);
}

const lienRegle = (r) => '<li><a href="/regles/' + r.id + '">' + esc(r.titre) + "</a> — " + esc(r.resume) + "</li>";
const reglesDe = (cat) => cat.sous.flatMap((s) => s.regles.map((id) => parId[id]).filter(Boolean));
const pluriel = (n, mot) => n + " " + mot + (n > 1 ? "s" : "");

function listeThemes() {
  return '<ul class="liste-themes">' + STRUCTURE.categories.map((cat) =>
    '<li><a href="/cours/' + cat.id + '"><strong>' + esc(cat.titre) + "</strong></a> — " + esc(cat.description)
    + " (" + pluriel(reglesDe(cat).length, "règle") + ")</li>").join("") + "</ul>";
}

// --- Accueil ---
const nbExos = REGLES.reduce((n, r) => n + r.exercices.length, 0);
page({
  chemin: "/",
  titre: PAGES.accueil.titre,
  description: PAGES.accueil.description,
  contenu: '<section class="accueil">' + PAGES.accueil.html + PAGES.accueil.suite
    + "<p><strong>" + REGLES.length + " règles et " + nbExos + " exercices</strong>, du collège au niveau adulte.</p>"
    + '<p><a class="bouton principal" href="/cours">Voir les cours</a> <a class="bouton" href="/regles">Lire les règles</a> <a class="bouton" href="/projet">Découvrir le projet</a></p>'
    + "<h2>Les thèmes</h2>" + listeThemes() + "</section>",
});

// --- Cours ---
page({
  chemin: "/cours",
  titre: "Cours d'orthographe, de grammaire et de conjugaison — Projet Plume",
  description: "Tous les cours du Projet Plume par thème : homophones, accords, conjugaison, bien écrire. Fiches claires et exercices gratuits.",
  contenu: '<section class="cours"><h1>Cours</h1><p>Choisissez un thème. Chaque règle a une fiche et des exercices corrigés.</p>' + listeThemes() + "</section>",
});
STRUCTURE.categories.forEach((cat) => {
  page({
    chemin: "/cours/" + cat.id,
    titre: cat.titre + " : règles et exercices — Projet Plume",
    description: cat.description + " " + pluriel(reglesDe(cat).length, "règle") + " avec fiches et exercices gratuits.",
    contenu: '<section class="categorie"><nav class="ariane"><a href="/cours">Cours</a> › ' + esc(cat.titre) + "</nav><h1>" + esc(cat.titre) + "</h1><p>" + esc(cat.description) + "</p>"
      + cat.sous.map((s) => "<h2>" + esc(s.titre) + "</h2><ul>" + s.regles.map((id) => parId[id]).filter(Boolean).map(lienRegle).join("") + "</ul>").join("") + "</section>",
  });
});

// --- Règles ---
page({
  chemin: "/regles",
  titre: "Toutes les règles d'orthographe et de grammaire — Projet Plume",
  description: "Les " + REGLES.length + " fiches de règles du Projet Plume, classées par thème, à consulter librement.",
  contenu: '<section class="regles-index"><h1>Règles</h1><p>Toutes les fiches, à consulter sans faire d\'exercices.</p>'
    + STRUCTURE.categories.map((cat) => "<h2>" + esc(cat.titre) + "</h2>" + cat.sous.map((s) =>
      "<h3>" + esc(s.titre) + "</h3><ul>" + s.regles.map((id) => parId[id]).filter(Boolean).map(lienRegle).join("") + "</ul>").join("")).join("") + "</section>",
});
REGLES.forEach((r) => {
  const p = place[r.id];
  if (!p) return;
  const voisines = [...(liees[r.id] || [])].map((id) => parId[id]).filter(Boolean);
  const contenu = '<article class="fiche"><nav class="ariane"><a href="/regles">Règles</a> › <a href="/cours/' + p.cat.id + '">' + esc(p.cat.titre) + "</a> › " + esc(p.sous.titre) + "</nav>"
    + "<h1>" + esc(r.titre) + "</h1>"
    + '<p class="chapeau">' + esc(r.resume) + (NIVEAUX[r.niveau] ? " Niveau : " + esc(NIVEAUX[r.niveau].toLowerCase()) + "." : "") + "</p>"
    + '<div class="fiche-texte">' + rendreFiche(r.fiche.replace(/\*\*Pour aller plus loin\*\*/, "**Pour aller plus loin**\n")) + "</div>"
    + '<p><a class="bouton principal" href="/session/' + r.id + '" rel="nofollow">S\'entraîner : ' + pluriel(r.exercices.length, "exercice") + "</a></p>"
    + (voisines.length ? "<h2>Règles liées</h2><ul>" + voisines.map(lienRegle).join("") + "</ul>" : "")
    + "</article>";
  const meta = {
    titre: r.titre + " : règle et exercices — Projet Plume",
    description: (r.resume + " Fiche claire et " + pluriel(r.exercices.length, "exercice") + " corrigés, gratuits et sans inscription.").slice(0, 300),
    contenu,
  };
  page({ chemin: "/regles/" + r.id, ...meta });
  // Même fiche dans l'onglet Cours : l'adresse de référence reste /regles/…
  page({ chemin: "/regle/" + r.id, canonique: "/regles/" + r.id, ...meta });
});

// --- Pages de présentation ---
page({ chemin: "/projet", titre: PAGES.projet.titre + " — le savoir libre, pour tous", description: PAGES.projet.description,
  contenu: '<article class="fiche page-projet">' + PAGES.projet.html + "</article>" });
page({ chemin: "/progres", titre: PAGES.progression.titre + " — Projet Plume", description: PAGES.progression.description, indexable: false,
  contenu: '<section class="progres"><h1>Ma progression</h1>' + PAGES.progression.html + "</section>" });

// --- Fichiers du site ---
function copier(src, dest = src) {
  const de = path.join(racine, src), vers = path.join(sortie, dest);
  fs.mkdirSync(path.dirname(vers), { recursive: true });
  fs.cpSync(de, vers, { recursive: true });
}
["css", "js", "img", "contenu/genere", "contenu/structure.js", "contenu/pages.js", "sw.js", "manifest.webmanifest", "COPYING"].forEach((f) => copier(f));

const aujourdhui = new Date().toISOString().slice(0, 10);
ecrire("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + pages.map((c) => "  <url><loc>" + site.url + (c === "/" ? "/" : c) + "</loc><lastmod>" + aujourdhui + "</lastmod></url>").join("\n") + "\n</urlset>\n");
ecrire("robots.txt", ["User-agent: *", "Disallow: /session/", "Disallow: /relecture", "Disallow: /revisions", "Disallow: /erreurs", "Disallow: /test", "",
  "Sitemap: " + site.url + "/sitemap.xml", ""].join("\n"));
// Toute adresse sans fichier (sessions d'exercices…) reçoit l'accueil ; l'application affiche la bonne vue.
ecrire("_redirects", "/* /index.html 200\n");

console.log(pages.length + " pages indexables (" + (pages.length + REGLES.length + 1) + " fichiers HTML), sitemap.xml, robots.txt → publication/");
