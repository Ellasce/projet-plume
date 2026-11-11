#!/usr/bin/env node
/*
 * Projet Plume — captures d'écran pour le README (docs/captures/*.png).
 *
 *   python -I outils/servir.py        (dans un autre terminal)
 *   node outils/captures.js
 *
 * Lance Edge ou Chrome sans fenêtre, avec un profil temporaire (votre
 * progression n'est pas touchée), et le pilote par le protocole DevTools.
 * Une progression de démonstration est créée pour la page « Progrès ».
 */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SITE = process.env.PLUME_SITE || "http://localhost:8000";
const SORTIE = path.join(__dirname, "..", "docs", "captures");
const PORT = 9333;
const LARGEUR = 1100, HAUTEUR = 760;

function trouverNavigateur() {
  const candidats = [
    process.env.PLUME_NAVIGATEUR,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  ].filter(Boolean);
  const trouve = candidats.find((c) => fs.existsSync(c));
  if (!trouve) throw new Error("Aucun navigateur Chrome / Edge / Chromium trouvé (variable PLUME_NAVIGATEUR).");
  return trouve;
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(SORTIE, { recursive: true });
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), "plume-captures-"));
  const nav = spawn(trouverNavigateur(), [
    "--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profil,
    "--no-first-run", "--hide-scrollbars", "--force-color-profile=srgb", "about:blank",
  ], { stdio: "ignore" });

  try {
    let cibles;
    for (let i = 0; i < 50 && !cibles; i++) {
      try { cibles = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch (e) { await pause(200); }
    }
    const page = cibles.find((c) => c.type === "page");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let n = 0;
    const attente = new Map();
    ws.addEventListener("message", (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && attente.has(m.id)) { attente.get(m.id)(m); attente.delete(m.id); }
    });
    const cdp = (method, params = {}) => new Promise((ok, ko) => {
      const id = ++n;
      attente.set(id, (m) => (m.error ? ko(new Error(method + " : " + m.error.message)) : ok(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
    const js = async (expr) => {
      const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error("Script de page : " + (r.exceptionDetails.exception || {}).description);
      return r.result.value;
    };
    const aller = async (url) => { await cdp("Page.navigate", { url: SITE + url }); await pause(1200); };
    const capturer = async (nom) => {
      const { data } = await cdp("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(SORTIE, nom), Buffer.from(data, "base64"));
      console.log("→ docs/captures/" + nom);
    };

    await cdp("Page.enable");
    await cdp("Emulation.setDeviceMetricsOverride", { width: LARGEUR, height: HAUTEUR, deviceScaleFactor: 2, mobile: false });
    await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });

    // 1. Accueil (premier visiteur).
    await aller("/");
    await capturer("accueil.png");

    // 2. Exercice : la règle d'abord, puis une question et sa correction.
    await js(`document.querySelector('[data-action="commencer"], .bouton.principal').click()`);
    await pause(600);
    await capturer("regle.png");
    await js(`(document.querySelector('[data-action="commencer"]') || {}).click && document.querySelector('[data-action="commencer"]').click()`);
    await pause(600);
    // Répond en choisissant la première proposition, quelle qu'elle soit, pour montrer la correction.
    await js(`(function () {
      var b = document.querySelector('.session .choix button, .session button[data-choix], .session .choix-bas ~ * button');
      if (!b) b = Array.from(document.querySelectorAll('.session button')).find(function (x) { return !x.dataset.action; });
      if (b) { b.click(); return true; }
      var f = document.querySelector('form.saisie input');
      if (f) { f.value = 'a'; f.form.requestSubmit(); return true; }
      return false;
    })()`);
    await pause(600);
    await capturer("exercice.png");

    // 3. Progrès, avec une progression de démonstration.
    const demo = await js(`(function () {
      var regles = window.PLUME_REGLES || [];
      var ordre = ((window.PLUME_STRUCTURE || {}).parcours || regles.map(function (r) { return r.id; }));
      var etat = { version: 2, exos: {}, regles: {}, xp: 1840, serie: 12, dernierJour: new Date().toISOString().slice(0, 10), testFait: true, derniere: null };
      var futur = Date.now() + 3 * 864e5;
      ordre.slice(0, 26).forEach(function (id, i) {
        var r = regles.find(function (x) { return x.id === id; });
        if (!r) return;
        r.exercices.forEach(function (e, j) {
          if (e.avance && i % 3) return;
          var boite = i < 14 ? 2 + (j % 3) : (j % 4 === 0 ? 0 : 1);
          etat.exos[e.id] = { boite: boite, du: futur, vus: 2 + (j % 3), justes: boite ? 2 : 1 };
        });
      });
      return JSON.stringify(etat);
    })()`);
    // Écrite avant le chargement de la page : la page d'exercice, en se fermant,
    // enregistre sa propre progression et écraserait celle-ci.
    await cdp("Page.addScriptToEvaluateOnNewDocument", {
      source: "try { localStorage.setItem('plume.progression.v1', " + JSON.stringify(demo) + "); } catch (e) {}",
    });
    await aller("/progres");
    await pause(1500);
    console.log("   démo :", await js(`(JSON.parse(localStorage.getItem("plume.progression.v1")).exos ? Object.keys(JSON.parse(localStorage.getItem("plume.progression.v1")).exos).length : 0) + " exercices ; " + document.querySelector(".stat strong, strong").textContent`));
    await capturer("progression.png");

    ws.close();
  } finally {
    nav.kill();
    await pause(500);
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch (e) { /* profil verrouillé : ignoré */ }
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
