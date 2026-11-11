#!/usr/bin/env node
/*
 * Projet Plume — vérificateur de contenu (GPL-3.0-or-later)
 * Usage : node outils/verifier_contenu.js [id-de-regle]
 *
 * À lancer après « python -I outils/construire.py » (qui, lui, vérifie le format
 * des fichiers contenu/regles/*.md). Charge le contenu généré, puis vérifie :
 *  - le format de chaque exercice (une seule faute, réponse dans les options…) ;
 *  - la cohérence avec contenu/structure.js (catégorie, niveau, parcours) ;
 *  - que chaque fichier chargé par index.html est aussi mis en cache par sw.js ;
 *  - la composition de chaque règle (nombre d'exercices, variété, phrases correctes).
 * Code de sortie 1 s'il y a des erreurs. Les « attentions » n'empêchent rien.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const racine = path.join(__dirname, "..");
const lire = (f) => fs.readFileSync(path.join(racine, f), "utf8");
const erreurs = [], attentions = [];
const err = (m) => erreurs.push(m), att = (m) => attentions.push(m);

// 1. Fichiers chargés par index.html, et cache hors ligne
const index = lire("gabarit.html");
const scriptsAbsolus = [...index.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const sw = lire("sw.js");
scriptsAbsolus.forEach((s) => { if (!sw.includes('"' + s + '"')) err("sw.js ne met pas en cache " + s + " (ajouter à FICHIERS et changer VERSION)"); });
const scripts = scriptsAbsolus.map((s) => s.replace(/^\//, ""));
// Le fichier généré doit être plus récent que les règles rédigées
const genere = path.join(racine, "contenu/genere/regles.js");
const dateGenere = fs.existsSync(genere) ? fs.statSync(genere).mtimeMs : 0;
fs.readdirSync(path.join(racine, "contenu/regles")).filter((f) => f.endsWith(".md")).forEach((f) => {
  if (fs.statSync(path.join(racine, "contenu/regles", f)).mtimeMs > dateGenere) err("contenu/regles/" + f + " a été modifié : relancer « python -I outils/construire.py »");
});

// 2. Chargement du contenu
const contexte = { window: {}, console };
vm.createContext(contexte);
scripts.filter((s) => s.startsWith("contenu/")).forEach((s) => vm.runInContext(lire(s), contexte, { filename: s }));
const W = contexte.window;
const regles = W.PLUME_REGLES || [];
const parId = {};
regles.forEach((r) => { if (parId[r.id]) err("règle en double : " + r.id); parId[r.id] = r; });

// 3. Structure
const S = W.PLUME_STRUCTURE;
const rangees = {};
S.categories.forEach((c) => c.sous.forEach((s) => s.regles.forEach((id) => {
  if (!parId[id]) err("structure : règle inconnue « " + id + " » dans " + s.id);
  if (rangees[id]) err("structure : « " + id + " » est rangée deux fois");
  rangees[id] = true;
})));
regles.forEach((r) => {
  if (!rangees[r.id]) err("structure : « " + r.id + " » n'est dans aucune sous-catégorie");
  if (!r.niveau) err(r.id + " : pas de niveau (ligne « Niveau : » du fichier)");
  if (S.parcours.indexOf(r.id) === -1) att("structure : « " + r.id + " » n'est pas dans le parcours conseillé");
});

// 4. Exercices
const RE_FAUTE = /\{([^>}]*)>([^}]*)\}/g;
const cible = process.argv[2];
const bilan = [];
regles.filter((r) => !cible || r.id === cible).forEach((r) => {
  const ou = (i) => r.id + "." + r.exercices[i].num;
  ["titre", "resume", "fiche"].forEach((k) => { if (!r[k]) err(r.id + " : champ « " + k + " » manquant"); });
  const vues = new Set();
  const types = {};
  let correctes = 0;
  r.exercices.forEach((e, i) => {
    if (!e.e) err(ou(i) + " : explication (e) manquante");
    if (e.src && !/^(verbiste|[A-Z0-9_]+\[\d+\]#\d+)$/.test(e.src)) err(ou(i) + " : source mal formée « " + e.src + " »");
    const cle = e.t + "|" + (e.s || e.consigne || e.v + e.pr + e.temps);
    if (vues.has(cle)) err(ou(i) + " : exercice en double");
    vues.add(cle);
    if (e.t === "faute") {
      const fautes = [...e.s.matchAll(RE_FAUTE)];
      const reste = e.s.replace(RE_FAUTE, "");
      if (/[{}>]/.test(reste)) err(ou(i) + " : accolade ou « > » mal formé : " + e.s);
      if (fautes.length > 1) err(ou(i) + " : plusieurs fautes dans une phrase (une seule autorisée)");
      if (fautes.length === 0) correctes++;
      fautes.forEach((m) => {
        if (m[1] === m[2]) err(ou(i) + " : la forme fautive est identique à la correction");
        if (!m[1].trim() || !m[2].trim()) err(ou(i) + " : forme fautive ou correction vide");
      });
      types[fautes.length ? "faute" : "correcte"] = (types[fautes.length ? "faute" : "correcte"] || 0) + 1;
    } else if (e.t === "choix") {
      if ((e.s.match(/___/g) || []).length !== 1) err(ou(i) + " : il faut exactement un trou « ___ »");
      if (!(e.a >= 0 && e.a < e.o.length)) err(ou(i) + " : index de réponse hors des options");
      if (new Set(e.o).size !== e.o.length) err(ou(i) + " : options en double");
      types.choix = (types.choix || 0) + 1;
    } else if (e.t === "tri") {
      if (!e.c || e.c.length !== 2) err(ou(i) + " : un tri a exactement 2 colonnes");
      if (!e.items || e.items.length < 4) err(ou(i) + " : un tri a au moins 4 éléments");
      else {
        if (!e.items.every((x) => x[1] === 0 || x[1] === 1)) err(ou(i) + " : colonne invalide (0 ou 1)");
        if (!e.items.some((x) => x[1] === 0) || !e.items.some((x) => x[1] === 1)) err(ou(i) + " : les deux colonnes doivent être utilisées");
      }
      types.tri = (types.tri || 0) + 1;
    } else if (e.t === "conj") {
      if (!e.r || !e.v || !e.temps) err(ou(i) + " : exercice de conjugaison incomplet");
      types.conj = (types.conj || 0) + 1;
    } else err(ou(i) + " : type inconnu « " + e.t + " »");
  });
  const n = r.exercices.length;
  const nAv = r.exercices.filter((e) => e.avance).length, nEss = n - nAv;
  // Socle essentiel : ce qui suffit pour « règle acquise ». Avancés : « Aller plus loin ».
  if (nEss < 8) att(r.id + " : socle essentiel de " + nEss + " exercices (viser 8 à 12)");
  if (nEss > 14) att(r.id + " : socle essentiel de " + nEss + " exercices, trop long à valider (viser 8 à 12 ; passer les autres en avance: true)");
  if (nAv < 5) att(r.id + " : seulement " + nAv + " exercices avancés (viser 5 à 20)");
  if (n && correctes / n > 0.25) att(r.id + " : " + Math.round(correctes / n * 100) + " % de phrases correctes (viser 10 à 20 %)");
  bilan.push(r.id.padEnd(28) + String(nEss).padStart(4) + String(nAv).padStart(5) + "  " + Object.entries(types).map(([k, v]) => k + ":" + v).join(" "));
});

console.log("Règle                        Ess.  Av.  Composition");
bilan.forEach((l) => console.log(l));
attentions.forEach((m) => console.log("ATTENTION  " + m));
erreurs.forEach((m) => console.log("ERREUR     " + m));
console.log("\n" + erreurs.length + " erreur(s), " + attentions.length + " attention(s).");
process.exit(erreurs.length ? 1 : 0);
