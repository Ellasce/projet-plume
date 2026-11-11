/*
 * Projet Plume — mise en forme des fiches (GPL-3.0-or-later)
 * Partagé par l'application (navigateur) et par outils/generer_site.js (Node).
 */
(function (racine) {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Mini-markdown des fiches : paragraphes, listes « - », exemples « > », **gras**.
  function rendreFiche(texte) {
    var html = [];
    texte.trim().split(/\n\s*\n/).forEach(function (bloc) {
      var lignes = bloc.split("\n");
      var liste = null, exemples = null, para = [];
      function vider() {
        if (para.length) { html.push("<p>" + para.join(" ") + "</p>"); para = []; }
        if (liste) { html.push("<ul>" + liste.join("") + "</ul>"); liste = null; }
        if (exemples) { html.push('<div class="exemples">' + exemples.join("") + "</div>"); exemples = null; }
      }
      lignes.forEach(function (l) {
        var t = esc(l.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        if (/^- /.test(l.trim())) {
          if (!liste) { vider(); liste = []; }
          liste.push("<li>" + t.slice(2) + "</li>");
        } else if (/^&gt; /.test(t)) {
          if (!exemples) { vider(); exemples = []; }
          exemples.push("<p>" + t.slice(5) + "</p>");
        } else if (t) {
          if (liste || exemples) vider();
          para.push(t);
        }
      });
      vider();
    });
    return html.join("");
  }

  var api = { esc: esc, rendreFiche: rendreFiche };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else racine.PlumeFiche = api;
})(typeof window !== "undefined" ? window : this);
