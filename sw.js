/* Projet Plume — mode hors ligne (GPL-3.0-or-later).
 * Changez VERSION à chaque mise à jour pour rafraîchir le cache. */
var VERSION = "plume-v12";
var FICHIERS = [
  "/",
  "/css/style.css",
  "/js/fiche.js",
  "/js/app.js",
  "/contenu/genere/regles.js",
  "/contenu/structure.js",
  "/contenu/pages.js",
  "/img/icone.svg",
  "/manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FICHIERS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Réseau d'abord (pour avoir le contenu à jour), cache en secours hors ligne.
// Hors ligne, toute page non mise en cache retombe sur l'accueil : l'application
// affiche alors la bonne vue d'après l'adresse.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (rep) {
      if (rep.ok && new URL(e.request.url).origin === location.origin) {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) { c.put(e.request, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || (e.request.mode === "navigate" ? caches.match("/") : undefined);
      });
    })
  );
});
