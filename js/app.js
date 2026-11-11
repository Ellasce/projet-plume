/*
 * Projet Plume — application (code sous licence GPL-3.0-or-later)
 * Aucune dépendance, aucun serveur : la progression reste sur l'appareil.
 */
(function () {
  "use strict";

  /* ---------- Réglages ---------- */
  var CLE_STOCKAGE = "plume.progression.v1";
  var TAILLE_SESSION = 10;
  var MAX_REVISIONS = 3;
  var JOUR = 24 * 60 * 60 * 1000;
  // Intervalle (en jours) avant la prochaine révision, selon la « boîte » de l'exercice.
  var INTERVALLES = [0, 1, 3, 7, 14, 30, 60];
  var BOITE_MAX = INTERVALLES.length - 1;
  var BOITE_MAITRISE = 2; // une réponse juste deux fois de suite = exercice maîtrisé
  var SEUIL_ACQUIS = 0.8;

  /* ---------- Contenu ---------- */
  // Les règles sont rédigées dans contenu/regles/*.md et assemblées par
  // outils/construire.py dans contenu/genere/regles.js. Chaque exercice a un
  // identifiant stable « règle.numéro » (ex. « tout.12 »), visible sous la correction.
  var SEULEMENT_VALIDES = false; // true : le site ne montre que les exercices marqués ✔
  var REGLES = [];          // liste à plat, dans l'ordre du parcours
  var REGLE_PAR_ID = {};
  var EXO_PAR_ID = {};

  (window.PLUME_REGLES || []).forEach(function (regle) {
    if (REGLE_PAR_ID[regle.id]) { console.warn("Plume : règle en double :", regle.id); return; }
    regle.toutesLesVersions = regle.exercices; // pour la page Relecture
    if (SEULEMENT_VALIDES) regle.exercices = regle.exercices.filter(function (e) { return e.statut === "valide"; });
    regle.toutesLesVersions.forEach(function (exo) {
      exo.regle = regle;
      EXO_PAR_ID[exo.id] = exo;
    });
    REGLES.push(regle);
    REGLE_PAR_ID[regle.id] = regle;
  });

  /* ---------- Organisation : catégories, niveaux, parcours ---------- */
  var STRUCTURE = window.PLUME_STRUCTURE;
  var CATEGORIES = STRUCTURE.categories;
  var CAT_PAR_ID = {}, SOUS_PAR_ID = {};
  var NIVEAU_PAR_ID = {};
  var ORDRE_THEMATIQUE = []; // règles dans l'ordre des catégories (onglets Cours et Règles)
  STRUCTURE.niveaux.forEach(function (n) { NIVEAU_PAR_ID[n.id] = n; });
  CATEGORIES.forEach(function (cat) {
    CAT_PAR_ID[cat.id] = cat;
    cat.sous.forEach(function (sous) {
      SOUS_PAR_ID[sous.id] = sous;
      sous.categorie = cat;
      sous.regles = sous.regles.filter(function (id) {
        if (!REGLE_PAR_ID[id]) { console.warn("Plume : règle inconnue dans la structure :", id); return false; }
        return true;
      }).map(function (id) {
        var r = REGLE_PAR_ID[id];
        r.categorie = cat;
        r.sous = sous;
        r.niveau = r.niveau || (STRUCTURE.niveauRegle || {})[id] || null;
        r.liees = [];
        ORDRE_THEMATIQUE.push(r);
        return r;
      });
    });
  });
  REGLES.forEach(function (r) {
    if (!r.categorie) console.warn("Plume : règle absente de la structure :", r.id);
  });
  // Liens réciproques entre règles
  Object.keys(STRUCTURE.liens || {}).forEach(function (id) {
    STRUCTURE.liens[id].forEach(function (autre) {
      var a = REGLE_PAR_ID[id], b = REGLE_PAR_ID[autre];
      if (!a || !b || !a.liees || !b.liees) return;
      if (a.liees.indexOf(b) === -1) a.liees.push(b);
      if (b.liees.indexOf(a) === -1) b.liees.push(a);
    });
  });
  // Parcours conseillé : ordre de la structure, puis les règles oubliées.
  REGLES = STRUCTURE.parcours.map(function (id) { return REGLE_PAR_ID[id]; }).filter(Boolean)
    .concat(REGLES.filter(function (r) { return STRUCTURE.parcours.indexOf(r.id) === -1; }));

  /* ---------- Progression (stockage local) ---------- */
  // Format des données enregistrées. À augmenter quand il change, en ajoutant
  // la conversion correspondante dans migrer().
  //   1 : exercices repérés par leur position ; 2 : identifiants « règle.numéro »,
  //       champs « version » et « derniere » (dernière règle travaillée).
  var VERSION_DONNEES = 2;
  var stockage = { ok: true, persistant: null, demande: false };

  function etatVide() {
    return { version: VERSION_DONNEES, exos: {}, regles: {}, xp: 0, serie: 0, dernierJour: null, testFait: false, derniere: null };
  }

  // Complète et convertit des données lues (stockage ou fichier importé).
  function normaliserEtat(e) {
    if (!e || typeof e !== "object" || !e.exos || typeof e.exos !== "object") throw new Error("format");
    var versionLue = e.version || 1;
    var vide = etatVide();
    for (var k in vide) if (!(k in e)) e[k] = vide[k];
    e.version = versionLue;
    return migrer(e);
  }

  function charger() {
    try {
      var brut = localStorage.getItem(CLE_STOCKAGE);
      if (brut) return normaliserEtat(JSON.parse(brut));
    } catch (err) {
      // Stockage indisponible (navigation privée…) ou données illisibles :
      // on continue avec une progression en mémoire.
      if (err && err.message !== "format") stockage.ok = false;
    }
    return etatVide();
  }

  function migrer(e) {
    if (e.version < 2) {
      // Version 1 : les exercices étaient repérés par leur position dans un fichier.
      var anciens = window.PLUME_ANCIENS_IDS || {};
      var exos = {};
      Object.keys(e.exos).forEach(function (id) { exos[anciens[id] || id] = e.exos[id]; });
      e.exos = exos;
    }
    // Une sauvegarde venue d'une version plus récente du site est gardée telle quelle.
    if (e.version < VERSION_DONNEES) e.version = VERSION_DONNEES;
    return e;
  }

  // Enregistre tout de suite. En cas d'échec (navigation privée, stockage plein),
  // la progression reste en mémoire et la page « Ma progression » le signale.
  function sauver() {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
      stockage.ok = true;
    } catch (err) {
      stockage.ok = false;
    }
  }

  // Demande au navigateur de ne pas effacer nos données quand il manque de place.
  function demanderPersistance() {
    if (stockage.demande || !navigator.storage || !navigator.storage.persist) return;
    stockage.demande = true;
    navigator.storage.persist().then(function (p) { stockage.persistant = p; }).catch(function () { /* sans gravité */ });
  }
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(function (p) { stockage.persistant = p; }).catch(function () { /* sans gravité */ });
  }

  var etat = charger();

  function suiviExo(id) {
    return etat.exos[id] || { boite: 0, du: 0, vus: 0, justes: 0 };
  }

  function enregistrerReponse(exo, juste) {
    var s = suiviExo(exo.id);
    s.vus++;
    if (juste) {
      s.justes++;
      s.boite = Math.min(s.boite + 1, BOITE_MAX);
      etat.xp += 10;
    } else {
      s.boite = 0;
    }
    s.du = Date.now() + INTERVALLES[s.boite] * JOUR;
    etat.exos[exo.id] = s;
    etat.derniere = { regle: exo.regle.id, date: Date.now() };
    majSerie();
    sauver();
    demanderPersistance();
  }

  function aujourdhui() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function majSerie() {
    var auj = aujourdhui();
    if (etat.dernierJour === auj) return;
    var hier = new Date(Date.now() - JOUR);
    var cleHier = hier.getFullYear() + "-" + (hier.getMonth() + 1) + "-" + hier.getDate();
    etat.serie = etat.dernierJour === cleHier ? etat.serie + 1 : 1;
    etat.dernierJour = auj;
  }

  function serieActuelle() {
    if (!etat.dernierJour) return 0;
    var hier = new Date(Date.now() - JOUR);
    var cleHier = hier.getFullYear() + "-" + (hier.getMonth() + 1) + "-" + hier.getDate();
    return (etat.dernierJour === aujourdhui() || etat.dernierJour === cleHier) ? etat.serie : 0;
  }

  /* ---------- Maîtrise ---------- */
  // Chaque règle a un socle « essentiel » (le parcours, la règle acquise) et des
  // exercices « avancés » (avance: true) pour aller plus loin depuis l'onglet Cours.
  function essentiels(regle) {
    var e = regle.exercices.filter(function (x) { return !x.avance; });
    return e.length ? e : regle.exercices;
  }
  function avances(regle) {
    return regle.exercices.filter(function (x) { return x.avance; });
  }
  function maitriseDe(exos) {
    if (!exos.length) return 0;
    var total = 0;
    exos.forEach(function (exo) {
      total += Math.min(suiviExo(exo.id).boite, BOITE_MAITRISE) / BOITE_MAITRISE;
    });
    return total / exos.length;
  }
  function maitrise(regle) { return maitriseDe(essentiels(regle)); }
  function maitriseAvancee(regle) { return maitriseDe(avances(regle)); }

  function statut(regle) {
    var m = maitrise(regle);
    if (m >= SEUIL_ACQUIS) return "acquise";
    if (etat.regles[regle.id] && etat.regles[regle.id].test) return "test";
    var commence = regle.exercices.some(function (exo) { return suiviExo(exo.id).vus > 0; });
    return commence ? "en-cours" : "nouvelle";
  }

  function regleSuivante() {
    for (var i = 0; i < REGLES.length; i++) {
      var st = statut(REGLES[i]);
      if (st !== "acquise" && st !== "test") return REGLES[i];
    }
    return null;
  }

  function revisionsDues(saufRegleId) {
    var maintenant = Date.now();
    return Object.keys(etat.exos)
      .filter(function (id) {
        var s = etat.exos[id];
        var exo = EXO_PAR_ID[id];
        return exo && exo.regle.id !== saufRegleId && s.boite > 0 && s.du <= maintenant;
      })
      .map(function (id) { return EXO_PAR_ID[id]; });
  }

  /* ---------- Utilitaires ---------- */
  function melanger(t) {
    for (var i = t.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = t[i]; t[i] = t[j]; t[j] = x;
    }
    return t;
  }

  // esc() et rendreFiche() sont dans js/fiche.js (partagés avec outils/generer_site.js).
  var esc = window.PlumeFiche.esc, rendreFiche = window.PlumeFiche.rendreFiche;

  // Découpe une phrase « faute » en mots cliquables.
  // {fautif>correct} marque la faute ; sans accolades, la phrase est correcte.
  function analyserPhrase(s) {
    var morceaux = [];
    var re = /\{([^>}]*)>([^}]*)\}/g;
    var dernier = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > dernier) morceaux.push({ texte: s.slice(dernier, m.index) });
      morceaux.push({ texte: m[1], correction: m[2], faute: true });
      dernier = re.lastIndex;
    }
    if (dernier < s.length) morceaux.push({ texte: s.slice(dernier) });

    var jetons = [];
    // Une faute de plusieurs mots (« au coiffeur ») est découpée en mots séparés,
    // pour ne pas trahir la réponse : cliquer sur n'importe lequel compte.
    morceaux.forEach(function (mc) {
      mc.texte.split(/(\s+)/).forEach(function (bout) {
        if (bout === "") return;
        if (/^\s+$/.test(bout)) jetons.push({ espace: true, texte: bout });
        else jetons.push({ texte: bout, faute: !!mc.faute });
      });
    });
    // La ponctuation isolée (« ? », « : ») n'est pas cliquable.
    jetons.forEach(function (j) {
      j.cliquable = !j.espace && /[\p{L}\p{N}]/u.test(j.texte);
    });
    return { jetons: jetons, aUneFaute: morceaux.some(function (x) { return x.faute; }) };
  }

  function phraseCorrigee(s) {
    var re = /\{([^>}]*)>([^}]*)\}/g, html = "", dernier = 0, m;
    while ((m = re.exec(s))) {
      html += esc(s.slice(dernier, m.index)) + "<mark>" + esc(m[2]) + "</mark>";
      dernier = re.lastIndex;
    }
    return html + esc(s.slice(dernier));
  }

  /* ---------- Rendu ---------- */
  var app = document.getElementById("app");
  var PAGES = window.PLUME_PAGES;

  // Icônes au trait (SVG), dessinées pour Plume : elles prennent la couleur du texte.
  function icone(chemins) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + chemins + "</svg>";
  }
  var ONGLETS = [
    { id: "accueil", href: "/", titre: "Accueil",
      icone: icone('<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v11h4.5v-6h4v6h4.5V9"/>') },
    { id: "cours", href: "/cours", titre: "Cours",
      icone: icone('<path d="M2.5 5.5h6a3.5 3.5 0 0 1 3.5 3.5v11a2.5 2.5 0 0 0-2.5-2.5h-7z"/><path d="M21.5 5.5h-6A3.5 3.5 0 0 0 12 9v11a2.5 2.5 0 0 1 2.5-2.5h7z"/>') },
    { id: "regles", href: "/regles", titre: "Règles",
      icone: icone('<path d="M6 2.5h8.5l4 4v15H6z"/><path d="M14 2.5V7h4.5"/><path d="M9 12h6.5M9 15.5h6.5M9 8.5h2.5"/>') },
    { id: "reviser", href: "/reviser", titre: "Réviser",
      icone: icone('<path d="M20 11.5A8 8 0 0 0 6 6.3L4 8.5"/><path d="M4 3.5v5h5"/><path d="M4 12.5a8 8 0 0 0 14 5.2l2-2.2"/><path d="M20 20.5v-5h-5"/>') },
    { id: "progres", href: "/progres", titre: "Progrès",
      icone: icone('<path d="M3 20.5h18"/><path d="M6.5 17v-5M12 17V6.5M17.5 17v-8"/>') },
    { id: "projet", href: "/projet", titre: "Le projet",
      icone: icone('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.5h.01"/>') }
  ];

  function majOnglets(actif) {
    var nav = document.getElementById("onglets");
    nav.innerHTML = ONGLETS.map(function (o) {
      return '<a href="' + o.href + '"' + (o.id === actif ? ' class="actif" aria-current="page"' : "") + ">"
        + '<span class="onglet-icone" aria-hidden="true">' + o.icone + "</span><span>" + o.titre + "</span></a>";
    }).join("");
  }

  // onglet : identifiant de l'onglet actif, ou null pendant une session (barre masquée).
  function afficher(html, onglet) {
    app.innerHTML = html;
    window.scrollTo(0, 0);
    document.body.classList.toggle("en-session", onglet === null);
    majOnglets(onglet);
    var s = serieActuelle();
    document.getElementById("serie").textContent = s > 0 ? "🔥 " + s + " j" : "";
    var h1 = app.querySelector("h1");
    var t = h1 ? h1.textContent.trim() : "";
    document.title = onglet === "accueil" || !t ? PAGES.accueil.titre : t + (/Projet Plume/.test(t) ? "" : " — Projet Plume");
  }

  function barre(valeur) {
    var pct = Math.round(valeur * 100);
    return '<div class="jauge" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div>';
  }

  function moyenne(regles) {
    if (!regles.length) return 0;
    return regles.reduce(function (a, r) { return a + maitrise(r); }, 0) / regles.length;
  }

  function reglesDeCategorie(cat) {
    return cat.sous.reduce(function (t, s) { return t.concat(s.regles); }, []);
  }

  var LIBELLES = {
    "acquise": "Acquise",
    "test": "Validée au test",
    "en-cours": "En cours",
    "nouvelle": "Nouvelle"
  };

  function lien(href, texte, classe) {
    return '<a href="' + href + '"' + (classe ? ' class="' + classe + '"' : "") + ">" + texte + "</a>";
  }

  function ariane(morceaux) {
    return '<nav class="ariane" aria-label="Fil d\'Ariane">' + morceaux.map(function (m, i) {
      return i < morceaux.length - 1 ? lien(m[1], esc(m[0])) : '<span aria-current="page">' + esc(m[0]) + "</span>";
    }).join('<span class="sep" aria-hidden="true">›</span>') + "</nav>";
  }

  function etiquetteNiveau(r) {
    return r.niveau && NIVEAU_PAR_ID[r.niveau] ? '<span class="tag niveau-' + r.niveau + '">' + esc(NIVEAU_PAR_ID[r.niveau].titre) + "</span>" : "";
  }

  /* --- Filtre par niveau (préférence locale) --- */
  function niveauChoisi() {
    try { return localStorage.getItem("plume.niveau") || "tous"; } catch (e) { return "tous"; }
  }
  function choisirNiveau(n) {
    try { localStorage.setItem("plume.niveau", n); } catch (e) { /* ignoré */ }
  }
  function visible(r) {
    var n = niveauChoisi();
    return n === "tous" || r.niveau === n;
  }
  function filtreNiveaux() {
    var n = niveauChoisi();
    var utilises = STRUCTURE.niveaux.filter(function (niv) {
      return REGLES.some(function (r) { return r.niveau === niv.id; });
    });
    return '<div class="filtres" role="group" aria-label="Filtrer par niveau">'
      + [{ id: "tous", titre: "Tous" }].concat(utilises).map(function (niv) {
        return '<button class="puce' + (n === niv.id ? " active" : "") + '" data-niveau="' + niv.id + '" aria-pressed="' + (n === niv.id) + '">' + esc(niv.titre) + "</button>";
      }).join("") + "</div>";
  }

  /* --- Recherche (sans tenir compte des accents ni des majuscules) --- */
  function sansAccents(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function chercher(requete, dansFiche) {
    var mots = sansAccents(requete).split(/\s+/).filter(Boolean);
    if (!mots.length) return null;
    return ORDRE_THEMATIQUE.filter(function (r) {
      var texte = sansAccents(r.titre + " " + r.resume + " " + (dansFiche ? r.fiche : ""));
      return visible(r) && mots.every(function (m) { return texte.indexOf(m) !== -1; });
    });
  }
  function champRecherche(cible) {
    return '<div class="recherche"><input type="search" id="recherche" data-cible="' + cible + '" placeholder="Rechercher une règle (ex. : quelque, pallier, subjonctif)" aria-label="Rechercher une règle"></div>';
  }

  /* --- Cartes de règles --- */
  function carteRegle(r) {
    var st = statut(r);
    return '<li class="regle st-' + st + '"><a href="/regle/' + encodeURIComponent(r.id) + '">'
      + '<span class="regle-titre">' + esc(r.titre) + "</span>"
      + '<span class="regle-resume">' + esc(r.resume) + "</span>"
      + barre(maitrise(r))
      + '<span class="badge">' + LIBELLES[st] + (st === "acquise" && avances(r).length && maitriseAvancee(r) >= SEUIL_ACQUIS ? " ★" : "") + "</span></a></li>";
  }
  function ligneLecture(r) {
    return '<li><a href="/regles/' + encodeURIComponent(r.id) + '"><span class="lecture-titre">' + esc(r.titre) + "</span>"
      + '<span class="regle-resume">' + esc(r.resume) + "</span></a>" + etiquetteNiveau(r) + "</li>";
  }

  /* --- Accueil --- */
  // Règle à proposer : celle qu'on travaillait la dernière fois, sinon la suivante du parcours.
  function regleAReprendre() {
    var d = etat.derniere && REGLE_PAR_ID[etat.derniere.regle];
    if (d && statut(d) === "en-cours") return d;
    return regleSuivante();
  }

  function vueAccueil() {
    var suivante = regleAReprendre();
    var revs = revisionsDues(null).length;
    var acquises = REGLES.filter(function (r) { return statut(r) === "acquise"; }).length;
    var debutant = Object.keys(etat.exos).length === 0;
    var html = '<section class="accueil">';

    // Nouveau visiteur : la présentation d'abord. Sinon : reprendre d'abord.
    if (debutant) html += PAGES.accueil.html;

    if (suivante) {
      var st = statut(suivante);
      html += '<div class="carte-continuer"><span class="etiquette">' + (st === "en-cours" ? "Reprendre · " : "") + esc(suivante.categorie.titre + " · " + suivante.sous.titre) + "</span>"
        + "<h2>" + esc(suivante.titre) + "</h2>"
        + '<p class="regle-resume">' + esc(suivante.resume) + "</p>" + barre(maitrise(suivante))
        + '<div class="ligne-boutons">' + lien("/session/" + encodeURIComponent(suivante.id), st === "nouvelle" ? "Commencer" : "Continuer", "bouton principal")
        + lien("/regle/" + encodeURIComponent(suivante.id), "Lire la fiche", "bouton")
        + (debutant ? lien("/projet", "Découvrir le projet", "bouton") : "") + "</div></div>";
    } else {
      html += '<div class="carte-continuer"><h2>Bravo !</h2><p class="bravo">Tout le parcours est acquis. Continuez les révisions pour l\'ancrer.</p></div>';
    }

    html += '<div class="stats">'
      + '<a class="stat" href="/reviser"><strong>' + revs + "</strong><span>à réviser</span></a>"
      + '<a class="stat" href="/progres"><strong>' + acquises + " / " + REGLES.length + "</strong><span>règles acquises</span></a>"
      + '<a class="stat" href="/progres"><strong>' + serieActuelle() + " j</strong><span>série</span></a></div>";

    if (!etat.testFait) {
      html += '<div class="encart"><p><strong>Nouveau ici ?</strong> Le test de positionnement (' + REGLES.length
        + " questions) repère ce que vous savez déjà, pour ne pas le refaire.</p>" + lien("/test", "Passer le test", "bouton") + "</div>";
    }

    html += '<h2 class="titre-section">Parcours conseillé</h2><p class="note">Un ordre progressif qui mélange les thèmes. Vous pouvez aussi choisir librement dans l\'onglet Cours.</p><ol class="parcours">';
    REGLES.forEach(function (r, i) {
      var st = statut(r);
      html += '<li class="st-' + st + (r === suivante ? " courante" : "") + '"><a href="/regle/' + encodeURIComponent(r.id) + '">'
        + '<span class="pastille" aria-hidden="true">' + (st === "acquise" || st === "test" ? "✔" : i + 1) + "</span>"
        + '<span class="parcours-titre">' + esc(r.titre) + '<small>' + esc(r.categorie.titre) + "</small></span></a></li>";
    });
    html += "</ol>";
    if (!debutant) {
      html += '<div class="encart rappel-projet"><p><strong>Le savoir libre, pour tous.</strong> Libre, gratuit, sans collecte de données.</p>'
        + lien("/projet", "Découvrir le Projet Plume", "bouton petit") + "</div>";
    }
    html += "</section>";
    afficher(html, "accueil");
  }

  /* --- Cours : catégories --- */
  function vueCours() {
    var html = '<section class="cours"><h1>Cours</h1><p class="sous-titre">Choisissez un thème. Chaque règle a une fiche et des exercices.</p>'
      + champRecherche("cours") + filtreNiveaux() + '<div id="resultats"></div><div id="contenu-cours" class="grille-categories">';
    CATEGORIES.forEach(function (cat) {
      var regles = reglesDeCategorie(cat).filter(visible);
      if (!regles.length) return;
      html += '<a class="carte-categorie" href="/cours/' + cat.id + '">'
        + '<span class="cat-icone" aria-hidden="true">' + cat.icone + "</span>"
        + "<h2>" + esc(cat.titre) + "</h2><p>" + esc(cat.description) + "</p>"
        + '<span class="cat-meta">' + regles.length + " règle" + (regles.length > 1 ? "s" : "") + " · " + Math.round(moyenne(regles) * 100) + " %</span>"
        + barre(moyenne(regles)) + "</a>";
    });
    html += "</div></section>";
    afficher(html, "cours");
  }

  /* --- Cours : une catégorie et ses sous-catégories --- */
  function vueCategorie(id) {
    var cat = CAT_PAR_ID[id];
    if (!cat) return vueCours();
    var regles = reglesDeCategorie(cat).filter(visible);
    var html = '<section class="categorie">' + ariane([["Cours", "/cours"], [cat.titre]])
      + '<h1><span aria-hidden="true">' + cat.icone + "</span> " + esc(cat.titre) + "</h1>"
      + '<p class="sous-titre">' + esc(cat.description) + "</p>" + barre(moyenne(regles))
      + '<div class="ligne-boutons">' + lien("/session/categorie/" + cat.id, "S'entraîner sur tout le thème", "bouton principal") + "</div>"
      + filtreNiveaux();
    cat.sous.forEach(function (sous) {
      var rs = sous.regles.filter(visible);
      if (!rs.length) return;
      html += '<section class="sous-categorie"><div class="sous-tete"><h2>' + esc(sous.titre) + "</h2>"
        + (rs.length > 1 ? lien("/session/sous/" + sous.id, "S'entraîner sur ces " + rs.length + " règles", "lien-discret") : "")
        + '</div><ol class="regles">' + rs.map(carteRegle).join("") + "</ol></section>";
    });
    if (!regles.length) html += '<p class="note">Aucune règle de ce niveau dans ce thème.</p>';
    html += "</section>";
    afficher(html, "cours");
  }

  /* --- Navigation entre règles voisines --- */
  function voisines(r, liste) {
    var i = liste.indexOf(r);
    return { avant: i > 0 ? liste[i - 1] : null, apres: i < liste.length - 1 ? liste[i + 1] : null };
  }
  function piedRegle(r, prefixe, liste) {
    var v = voisines(r, liste);
    var html = '<nav class="voisines" aria-label="Règles voisines">'
      + (v.avant ? '<a class="voisine" href="' + prefixe + encodeURIComponent(v.avant.id) + '"><small>← Précédente</small>' + esc(v.avant.titre) + "</a>" : "<span></span>")
      + (v.apres ? '<a class="voisine suivante" href="' + prefixe + encodeURIComponent(v.apres.id) + '"><small>Suivante →</small>' + esc(v.apres.titre) + "</a>" : "<span></span>")
      + "</nav>";
    if (r.liees && r.liees.length) {
      html += '<section class="liees"><h2>Règles liées</h2><ul>' + r.liees.map(function (l) {
        return "<li>" + lien(prefixe + encodeURIComponent(l.id), esc(l.titre)) + "</li>";
      }).join("") + "</ul></section>";
    }
    return html;
  }

  // Encart « Aller plus loin » : sur la fiche (Cours), il lance les exercices avancés ;
  // dans le bilan d'une session du parcours, il renvoie vers la règle complète (Cours).
  // La fiche se découpe en deux : le cours de base, et la partie « Pour aller plus loin »
  // (présentée dans le volet « Approfondir » de l'onglet Cours).
  var MARQUE_PLUS_LOIN = /\n\s*\*\*Pour aller plus loin\*\*\s*\n/;
  function decouperFiche(texte) {
    var m = MARQUE_PLUS_LOIN.exec(texte);
    return m ? { base: texte.slice(0, m.index), plusLoin: texte.slice(m.index + m[0].length) } : { base: texte, plusLoin: "" };
  }

  // Exemple corrigé d'un exercice, pour présenter l'approfondissement.
  function exempleCorrige(exo) {
    if (exo.t === "faute") return /\{/.test(exo.s) ? phraseCorrigee(exo.s) : esc(exo.s);
    if (exo.t === "choix") return esc(exo.s).replace("___", "<mark>" + esc(exo.o[exo.a]) + "</mark>");
    if (exo.t === "conj") return "<em>" + esc(exo.v) + "</em>, " + esc(exo.temps) + " : " + esc(exo.pr) + (/'$/.test(exo.pr) || !exo.pr ? "" : " ") + "<mark>" + esc(exo.r) + "</mark>";
    return "";
  }

  // Volet « Ce que vous allez approfondir », déplié par le bouton Approfondir.
  function voletApprofondissement(r) {
    var av = avances(r);
    var texte = decouperFiche(r.fiche).plusLoin;
    var html = '<div class="volet-plus-loin" id="volet-plus-loin" hidden><h3>Ce que vous allez approfondir</h3>';
    if (texte) html += '<div class="fiche-texte">' + rendreFiche(texte) + "</div>";
    else if (av.every(function (e) { return e.t === "conj"; })) {
      html += "<p>Les formes plus rares ou plus irrégulières :</p>";
    }
    // Exemples : d'abord ceux qui montrent une correction, puis les autres.
    var exemples = av.filter(function (e) { return e.t !== "tri"; }).sort(function (a, b) {
      return (sansFaute(a) ? 1 : 0) - (sansFaute(b) ? 1 : 0);
    });
    var nb = Math.min(exemples.length, texte ? 3 : 6);
    if (nb) {
      html += '<p class="sous-titre-volet">' + (texte ? "Quelques exemples" : "Exemples") + "</p><ul class=\"exemples-plus-loin\">"
        + exemples.slice(0, nb).map(function (e) { return "<li>" + exempleCorrige(e) + "</li>"; }).join("") + "</ul>";
    }
    var types = {};
    av.forEach(function (e) {
      // [singulier, pluriel]
      var t = e.t === "conj" ? ["forme à conjuguer", "formes à conjuguer"] : e.t === "tri" ? ["exercice de tri", "exercices de tri"]
        : e.t === "choix" ? ["choix multiple", "choix multiples"] : /\{/.test(e.s) ? ["phrase à corriger", "phrases à corriger"]
        : ["phrase piège sans faute", "phrases pièges sans faute"];
      if (!types[t[0]]) types[t[0]] = { n: 0, formes: t };
      types[t[0]].n++;
    });
    html += '<p class="note">' + av.length + " exercices : " + Object.keys(types).map(function (k) {
      return types[k].n + " " + types[k].formes[types[k].n > 1 ? 1 : 0];
    }).join(", ") + ".</p>"
      + lien("/session/" + encodeURIComponent(r.id) + "/avance", maitriseAvancee(r) > 0 ? "Continuer les exercices avancés" : "Lancer les exercices avancés", "bouton principal")
      + "</div>";
    return html;
  }

  // Encart « Aller plus loin » : sur la fiche (Cours), « Approfondir » déplie le volet de
  // présentation ; dans le bilan d'une session, il renvoie vers la règle complète (Cours).
  function encartAllerPlusLoin(r, surLaFiche) {
    var n = avances(r).length, acquise = statut(r) === "acquise";
    var html = '<div class="encart plus-loin"><h2>Aller plus loin</h2><p>'
      + n + " exercice" + (n > 1 ? "s avancés" : " avancé") + " : cas particuliers, pièges et phrases plus difficiles."
      + (surLaFiche && !acquise ? " Conseillé une fois la règle acquise." : "") + "</p>";
    if (maitriseAvancee(r) > 0) html += barre(maitriseAvancee(r));
    if (surLaFiche) {
      html += '<button class="bouton' + (acquise ? " principal" : "") + '" data-action="deplier-plus-loin" aria-expanded="false" aria-controls="volet-plus-loin">'
        + (maitriseAvancee(r) > 0 ? "Continuer l'approfondissement" : "Approfondir") + ' <span class="chevron" aria-hidden="true">▾</span></button>'
        + voletApprofondissement(r);
    } else {
      html += lien("/regle/" + encodeURIComponent(r.id) + "/plus-loin", "Voir la règle complète", "bouton principal");
    }
    return html + "</div>";
  }

  function deplierPlusLoin(bouton, defiler) {
    var volet = document.getElementById("volet-plus-loin");
    if (!volet) return;
    var ouvrir = volet.hidden;
    volet.hidden = !ouvrir;
    if (bouton) bouton.setAttribute("aria-expanded", String(ouvrir));
    if (ouvrir && defiler !== false) volet.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* --- Cours : fiche d'une règle, avec exercices --- */
  function vueRegle(id, ouvrirPlusLoin) {
    var r = REGLE_PAR_ID[id];
    if (!r) return vueCours();
    var st = statut(r);
    var aPlusLoin = avances(r).length > 0;
    var html = '<article class="fiche">'
      + ariane([["Cours", "/cours"], [r.categorie.titre, "/cours/" + r.categorie.id], [r.sous.titre]])
      + '<div class="tags">' + etiquetteNiveau(r) + '<span class="tag st-' + st + '">' + LIBELLES[st] + "</span></div>"
      + "<h1>" + esc(r.titre) + "</h1>" + barre(maitrise(r))
      + '<div class="ligne-boutons">' + lien("/session/" + encodeURIComponent(r.id), "S'entraîner (" + essentiels(r).length + " exercices essentiels)", "bouton principal") + "</div>"
      + '<div class="fiche-texte">' + rendreFiche(decouperFiche(r.fiche).base) + "</div>"
      + '<div class="ligne-boutons">' + lien("/session/" + encodeURIComponent(r.id), "S'entraîner sur cette règle", "bouton principal") + "</div>"
      + (aPlusLoin ? encartAllerPlusLoin(r, true) : "")
      + piedRegle(r, "/regle/", r.sous.regles.length > 1 ? r.sous.regles : ORDRE_THEMATIQUE)
      + "</article>";
    afficher(html, "cours");
    if (ouvrirPlusLoin && aPlusLoin) {
      var b = app.querySelector('[data-action="deplier-plus-loin"]');
      deplierPlusLoin(b, false);
      app.querySelector(".plus-loin").scrollIntoView({ block: "start" });
    }
  }

  /* --- Règles : consultation seule, sans exercices --- */
  function vueRegles() {
    var html = '<section class="regles-index"><h1>Règles</h1><p class="sous-titre">Toutes les fiches, à consulter sans faire d\'exercices.</p>'
      + champRecherche("regles") + filtreNiveaux() + '<div id="resultats"></div><div id="contenu-regles">';
    var sommaire = '<nav class="sommaire" aria-label="Sommaire">';
    CATEGORIES.forEach(function (cat) {
      var rs = reglesDeCategorie(cat).filter(visible);
      if (!rs.length) return;
      sommaire += '<a href="/regles" data-ancre="cat-' + cat.id + '">' + cat.icone + " " + esc(cat.titre) + "</a>";
      html += '<section class="bloc-regles" id="cat-' + cat.id + '"><h2><span aria-hidden="true">' + cat.icone + "</span> " + esc(cat.titre) + "</h2>";
      cat.sous.forEach(function (sous) {
        var rss = sous.regles.filter(visible);
        if (!rss.length) return;
        html += "<h3>" + esc(sous.titre) + '</h3><ul class="liste-lecture">' + rss.map(ligneLecture).join("") + "</ul>";
      });
      html += "</section>";
    });
    sommaire += "</nav>";
    html = html.replace('<div id="contenu-regles">', sommaire + '<div id="contenu-regles">');
    html += "</div></section>";
    afficher(html, "regles");
  }

  function vueLecture(id) {
    var r = REGLE_PAR_ID[id];
    if (!r) return vueRegles();
    var html = '<article class="fiche lecture">'
      + ariane([["Règles", "/regles"], [r.categorie.titre + " · " + r.sous.titre]])
      + '<div class="tags">' + etiquetteNiveau(r) + "</div>"
      + "<h1>" + esc(r.titre) + "</h1>"
      + '<p class="chapeau">' + esc(r.resume) + "</p>"
      + '<div class="fiche-texte">' + rendreFiche(r.fiche) + "</div>"
      + '<p class="note">' + lien("/session/" + encodeURIComponent(r.id), "S'entraîner sur cette règle →") + "</p>"
      + piedRegle(r, "/regles/", ORDRE_THEMATIQUE.filter(visible).indexOf(r) !== -1 ? ORDRE_THEMATIQUE.filter(visible) : ORDRE_THEMATIQUE)
      + "</article>";
    afficher(html, "regles");
  }

  // Résultats de recherche, mis à jour pendant la frappe sans redessiner la page.
  function majRecherche(champ) {
    var cible = champ.getAttribute("data-cible");
    var res = chercher(champ.value, cible === "regles");
    var zone = document.getElementById("resultats");
    var contenu = document.getElementById(cible === "regles" ? "contenu-regles" : "contenu-cours");
    var sommaire = app.querySelector(".sommaire");
    if (!res) { zone.innerHTML = ""; contenu.hidden = false; if (sommaire) sommaire.hidden = false; return; }
    contenu.hidden = true;
    if (sommaire) sommaire.hidden = true;
    zone.innerHTML = res.length
      ? '<p class="note">' + res.length + " règle" + (res.length > 1 ? "s trouvées" : " trouvée") + "</p>"
        + (cible === "regles" ? '<ul class="liste-lecture">' + res.map(ligneLecture).join("") + "</ul>" : '<ol class="regles">' + res.map(carteRegle).join("") + "</ol>")
      : '<p class="note">Aucune règle ne correspond à « ' + esc(champ.value) + " ».</p>";
  }

  /* --- Réviser --- */
  function erreursRecentes() {
    return Object.keys(etat.exos).filter(function (id) {
      var s = etat.exos[id];
      return EXO_PAR_ID[id] && s.vus > 0 && s.boite === 0;
    }).map(function (id) { return EXO_PAR_ID[id]; });
  }

  function vueReviser() {
    var dues = revisionsDues(null);
    var erreurs = erreursRecentes();
    var html = '<section class="reviser"><h1>Réviser</h1>';

    html += '<div class="encart"><h2>Révisions du jour</h2>';
    if (dues.length) {
      html += "<p>" + dues.length + " exercice" + (dues.length > 1 ? "s reviennent" : " revient") + " aujourd'hui, au bon moment pour être mémorisé" + (dues.length > 1 ? "s" : "") + ".</p>"
        + lien("/revisions", "Commencer les révisions", "bouton principal");
    } else {
      var prochaines = Object.keys(etat.exos).map(function (k) { return etat.exos[k]; }).filter(function (s) { return s.boite > 0; })
        .map(function (s) { return s.du; }).sort(function (a, b) { return a - b; });
      html += "<p>Rien à réviser pour l'instant." + (prochaines.length ? " Prochaine révision le " + new Date(prochaines[0]).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + "." : "") + "</p>";
    }
    html += "</div>";

    html += '<div class="encart"><h2>Mes erreurs</h2>';
    if (erreurs.length) {
      var parRegle = {};
      erreurs.forEach(function (e) { parRegle[e.regle.id] = (parRegle[e.regle.id] || 0) + 1; });
      html += "<p>" + erreurs.length + " exercice" + (erreurs.length > 1 ? "s ratés" : " raté") + " lors de votre dernière tentative :</p><ul class=\"liste-erreurs\">"
        + Object.keys(parRegle).map(function (id) {
          return "<li>" + lien("/regle/" + encodeURIComponent(id), esc(REGLE_PAR_ID[id].titre)) + ' <span class="compte">' + parRegle[id] + "</span></li>";
        }).join("") + "</ul>" + lien("/erreurs", "Refaire mes erreurs", "bouton principal");
    } else {
      html += "<p>Aucune erreur en attente. 👍</p>";
    }
    html += "</div>";

    html += '<h2 class="titre-section">Entraînement mélangé par thème</h2><div class="grille-categories">';
    CATEGORIES.forEach(function (cat) {
      var rs = reglesDeCategorie(cat);
      html += '<a class="carte-categorie compacte" href="/session/categorie/' + cat.id + '"><span class="cat-icone" aria-hidden="true">' + cat.icone + "</span>"
        + "<h2>" + esc(cat.titre) + '</h2><span class="cat-meta">' + Math.round(moyenne(rs) * 100) + " %</span>" + barre(moyenne(rs)) + "</a>";
    });
    html += "</div></section>";
    afficher(html, "reviser");
  }

  /* --- Ma progression --- */
  function vueProgres() {
    var acquises = REGLES.filter(function (r) { return statut(r) === "acquise"; }).length;
    var reussis = Object.keys(etat.exos).filter(function (id) { return etat.exos[id].justes > 0; }).length;
    var total = Object.keys(EXO_PAR_ID).length;
    var html = '<section class="progres"><h1>Ma progression</h1>'
      + '<div class="stats">'
      + '<div class="stat"><strong>' + acquises + " / " + REGLES.length + "</strong><span>règles acquises</span></div>"
      + '<div class="stat"><strong>' + reussis + " / " + total + "</strong><span>exercices réussis</span></div>"
      + '<div class="stat"><strong>' + etat.xp + "</strong><span>points</span></div></div>";

    // État de la sauvegarde
    var derniere = etat.derniere && etat.derniere.date
      ? new Date(etat.derniere.date).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : null;
    html += '<div class="encart sauvegarde"><h2>Sauvegarde</h2>';
    if (stockage.ok) {
      html += '<p class="etat-ok">✔ Votre progression est enregistrée automatiquement sur cet appareil'
        + (derniere ? " (dernier enregistrement : " + derniere + ")" : "") + ".</p>";
    } else {
      html += '<p class="etat-ko">✘ Ce navigateur refuse d\'enregistrer (navigation privée ou stockage plein). Votre progression sera perdue à la fermeture de la page : exportez-la.</p>';
    }
    if (stockage.persistant === true) html += '<p class="note">Stockage protégé : le navigateur s\'est engagé à ne pas effacer ces données automatiquement.</p>';
    else if (stockage.persistant === false) html += '<p class="note">Stockage non protégé : le navigateur peut effacer ces données s\'il manque de place. Pensez à exporter.</p>';
    html += '<div class="ligne-boutons"><button class="bouton petit principal" data-action="exporter">Exporter (fichier .json)</button>'
      + '<label class="bouton petit">Importer<input type="file" accept="application/json,.json" data-action="importer" hidden></label>'
      + '<button class="bouton petit danger" data-action="reinitialiser">Réinitialiser</button></div></div>';

    html += '<h2 class="titre-section">Par thème</h2>';
    CATEGORIES.forEach(function (cat) {
      var rs = reglesDeCategorie(cat);
      html += '<div class="progres-cat"><div class="progres-tete">' + lien("/cours/" + cat.id, cat.icone + " " + esc(cat.titre))
        + "<span>" + Math.round(moyenne(rs) * 100) + " %</span></div>" + barre(moyenne(rs)) + '<ul class="progres-sous">';
      cat.sous.forEach(function (sous) {
        html += "<li><span>" + esc(sous.titre) + "</span><span>" + sous.regles.filter(function (r) { return statut(r) === "acquise"; }).length
          + " / " + sous.regles.length + "</span></li>";
      });
      html += "</ul></div>";
    });

    html += '<div class="encart"><h2>Test de positionnement</h2><p>' + (etat.testFait ? "Vous l'avez déjà passé. Vous pouvez le refaire pour mettre à jour votre parcours." : "Une question par règle, pour repérer ce que vous savez déjà.")
      + "</p>" + lien("/test", etat.testFait ? "Refaire le test" : "Passer le test", "bouton") + "</div>";

    html += PAGES.progression.html;
    html += '<p class="note">' + lien("/projet", "Le Projet Plume : présentation, licences et sources") + "</p></section>";
    afficher(html, "progres");
  }

  /* --- Relecture (administrateurs) : page hors menu, adresse /relecture --- */
  // Les décisions sont gardées dans ce navigateur, puis exportées en fichier et
  // reportées dans contenu/regles/*.md par outils/appliquer_relectures.py.
  var CLE_RELECTURE = "plume.relecture";
  var STATUTS = { "a-relire": "À relire", "valide": "Validé", "a-corriger": "À corriger" };

  function relectures() {
    try { return JSON.parse(localStorage.getItem(CLE_RELECTURE)) || {}; } catch (e) { return {}; }
  }
  function enregistrerRelecture(id, changement) {
    var r = relectures();
    var actuel = r[id] || {};
    for (var k in changement) actuel[k] = changement[k];
    actuel.date = new Date().toISOString();
    r[id] = actuel;
    try { localStorage.setItem(CLE_RELECTURE, JSON.stringify(r)); } catch (e) { window.alert("Impossible d'enregistrer dans ce navigateur."); }
  }
  function statutEffectif(exo) {
    var d = relectures()[exo.id];
    return d && d.statut ? d.statut : exo.statut || "a-relire";
  }
  function filtreRelecture() {
    try { return localStorage.getItem("plume.relecture.filtre") || "a-relire"; } catch (e) { return "a-relire"; }
  }

  // Présentation lisible d'un exercice, avec sa réponse.
  function apercuExercice(exo) {
    if (exo.t === "faute") {
      if (!/\{/.test(exo.s)) return '<p class="apercu">' + esc(exo.s) + ' <span class="tag">phrase correcte</span></p>';
      return '<p class="apercu">' + esc(exo.s).replace(/\{([^&]*?)&gt;([^}]*)\}/g, function (m, f, c) {
        return "<del>" + f + "</del> <mark>" + c + "</mark>";
      }) + "</p>";
    }
    if (exo.t === "choix") {
      return '<p class="apercu">' + esc(exo.s).replace("___", "<mark>" + esc(exo.o[exo.a]) + "</mark>") + '</p><p class="note">Choix proposés : '
        + exo.o.map(function (o, i) { return i === exo.a ? "<strong>" + esc(o) + "</strong>" : esc(o); }).join(" / ") + "</p>";
    }
    if (exo.t === "tri") {
      return '<p class="apercu">Tri : ' + esc(exo.consigne) + '</p><ul class="apercu-tri">' + exo.items.map(function (it) {
        return "<li>" + esc(it[0]) + " → <strong>" + esc(exo.c[it[1]]) + "</strong></li>";
      }).join("") + "</ul>";
    }
    if (exo.t === "conj") {
      return '<p class="apercu">' + esc(exo.v) + ", " + esc(exo.temps) + " : " + esc(exo.pr) + (/'$/.test(exo.pr) || !exo.pr ? "" : " ")
        + "<mark>" + esc(exo.r) + "</mark></p>" + (exo.o && exo.o.length ? '<p class="note">Pièges proposés : ' + esc(exo.o.join(", ")) + "</p>" : "");
    }
    return "";
  }

  function vueRelecture(regleId) {
    var decisions = relectures();
    var filtre = filtreRelecture();
    var r = REGLE_PAR_ID[regleId] || ORDRE_THEMATIQUE[0];
    var tous = Object.keys(EXO_PAR_ID).map(function (id) { return EXO_PAR_ID[id]; });
    var compte = { "a-relire": 0, "valide": 0, "a-corriger": 0 };
    tous.forEach(function (e) { compte[statutEffectif(e)]++; });
    var nbDecisions = Object.keys(decisions).length;

    var html = '<section class="relecture"><h1>Relecture</h1>'
      + '<p class="note">Page réservée aux relecteurs (hors menu). Vos décisions sont gardées dans ce navigateur : exportez-les, puis reportez-les dans les fichiers avec <code>python -I outils/appliquer_relectures.py fichier.json</code>.</p>'
      + '<div class="stats"><div class="stat"><strong>' + compte["a-relire"] + '</strong><span>à relire</span></div>'
      + '<div class="stat"><strong>' + compte["valide"] + '</strong><span>validés</span></div>'
      + '<div class="stat"><strong>' + compte["a-corriger"] + '</strong><span>à corriger</span></div></div>'
      + '<div class="ligne-boutons"><button class="bouton petit principal" data-action="exporter-relectures"' + (nbDecisions ? "" : " disabled") + ">Exporter mes relectures (" + nbDecisions + ")</button>"
      + '<button class="bouton petit danger" data-action="effacer-relectures"' + (nbDecisions ? "" : " disabled") + ">Effacer mes relectures</button></div>";

    // Choix de la règle et du filtre
    html += '<div class="relecture-choix"><label>Règle <select id="relecture-regle">'
      + ORDRE_THEMATIQUE.map(function (x) {
        var n = x.toutesLesVersions.filter(function (e) { return statutEffectif(e) === "a-relire"; }).length;
        return '<option value="' + esc(x.id) + '"' + (x === r ? " selected" : "") + ">" + esc(x.titre) + (n ? " — " + n + " à relire" : " ✔") + "</option>";
      }).join("") + "</select></label>"
      + '<div class="filtres">' + [["a-relire", "À relire"], ["a-corriger", "À corriger"], ["valide", "Validés"], ["tous", "Tous"]].map(function (f) {
        return '<button class="puce' + (filtre === f[0] ? " active" : "") + '" data-filtre-relecture="' + f[0] + '">' + f[1] + "</button>";
      }).join("") + "</div></div>";

    html += '<p class="note">Fichier : <code>contenu/regles/' + esc(r.id) + '.md</code> · ' + lien("/regles/" + encodeURIComponent(r.id), "voir la fiche") + "</p>";

    var liste = r.toutesLesVersions.filter(function (e) { return filtre === "tous" || statutEffectif(e) === filtre; });
    if (!liste.length) html += '<p class="encart">Aucun exercice dans ce filtre pour cette règle.</p>';
    liste.forEach(function (e) {
      var st = statutEffectif(e), d = decisions[e.id] || {};
      var commentaire = d.commentaire !== undefined ? d.commentaire : (e.commentaire || "");
      html += '<article class="carte-relecture st-' + st + '" id="relire-' + esc(e.id) + '">'
        + '<div class="relecture-tete"><strong>n° ' + e.num + "</strong> · " + (e.avance ? "avancé" : "essentiel")
        + ' <span class="tag statut-' + st + '">' + STATUTS[st] + (d.statut ? " (non exporté)" : "") + "</span></div>"
        + apercuExercice(e)
        + '<p class="explication"><strong>Pourquoi :</strong> ' + esc(e.e || "—") + "</p>"
        + (rappelCible(e) ? '<div class="note rappel-relecture"><strong>Rappel affiché :</strong> ' + rendreFiche(rappelCible(e)) + "</div>" : "")
        + (e.src ? creditSource(e.src) : "")
        + '<textarea class="commentaire" data-commentaire="' + esc(e.id) + '" rows="2" placeholder="Commentaire (ce qui ne va pas, correction proposée…)">' + esc(commentaire) + "</textarea>"
        + '<div class="ligne-boutons">'
        + '<button class="bouton petit' + (st === "valide" ? " principal" : "") + '" data-relire="' + esc(e.id) + '" data-statut="valide">✔ Valider</button>'
        + '<button class="bouton petit' + (st === "a-corriger" ? " danger-plein" : "") + '" data-relire="' + esc(e.id) + '" data-statut="a-corriger">✎ À corriger</button>'
        + (d.statut ? '<button class="bouton petit" data-relire="' + esc(e.id) + '" data-statut="">Annuler</button>' : "")
        + "</div></article>";
    });
    html += "</section>";
    afficher(html, "");
  }

  function exporterRelectures() {
    var donnees = { version: 1, date: new Date().toISOString(), relectures: relectures() };
    var blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "relectures-" + aujourdhui() + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function relireAction(cible) {
    var id = cible.getAttribute("data-relire"), statut = cible.getAttribute("data-statut");
    var y = window.scrollY;
    if (!statut) {
      var r = relectures(); delete r[id];
      try { localStorage.setItem(CLE_RELECTURE, JSON.stringify(r)); } catch (e) { /* ignoré */ }
    } else {
      var champ = app.querySelector('[data-commentaire="' + id + '"]');
      enregistrerRelecture(id, { statut: statut, commentaire: champ ? champ.value : "" });
    }
    vueRelecture(EXO_PAR_ID[id].regle.id);
    window.scrollTo(0, y);
  }

  function vueProjet() {
    afficher('<article class="fiche page-projet">' + PAGES.projet.html + "</article>", "projet");
  }

  /* ---------- Sessions d'exercices ---------- */
  var session = null;

  // Une phrase « faute » peut être présentée de trois façons. On évite d'abuser
  // du « trouve la faute » : il ne sort qu'une fois sur quatre environ.
  var POIDS_MODES = [["trou", 0.45], ["corrige", 0.30], ["repere", 0.25]];
  var MAX_PHRASES_CORRECTES = 1; // phrases sans faute par session

  function sansFaute(exo) {
    return exo.t === "faute" && !/\{/.test(exo.s);
  }

  function tirerMode(eviter) {
    var r = Math.random(), cumul = 0;
    for (var i = 0; i < POIDS_MODES.length; i++) {
      cumul += POIDS_MODES[i][1];
      if (r < cumul && POIDS_MODES[i][0] !== eviter) return POIDS_MODES[i][0];
    }
    return eviter === "trou" ? "corrige" : "trou";
  }

  function preparerQuestion(exo, modeImpose, eviter) {
    var q = { exo: exo };
    if (exo.t === "choix") {
      q.mode = "choix";
      q.options = exo.o.slice();
      q.bonne = exo.a;
    } else if (exo.t === "tri") {
      q.mode = "tri";
      q.reponses = {};
    } else if (exo.t === "conj") {
      // Conjugaison : à taper (60 %) ou à choisir (40 %). Le test impose la saisie.
      q.correct = exo.r;
      q.mode = (modeImpose || Math.random() < 0.6) && eviter !== "conj-saisie" ? "conj-saisie" : "conj-choix";
      if (q.mode === "conj-choix") {
        q.options = melanger([exo.r].concat(exo.o));
        q.bonne = q.options.indexOf(exo.r);
      }
    } else {
      q.analyse = analyserPhrase(exo.s);
      var m = /\{([^>}]*)>([^}]*)\}/.exec(exo.s);
      if (m) { q.fautif = m[1]; q.correct = m[2]; }
      q.mode = !m ? "repere" : (modeImpose || tirerMode(eviter));
      if (q.mode === "trou") {
        q.options = melanger([q.fautif, q.correct]);
        q.bonne = q.options.indexOf(q.correct);
      }
    }
    return q;
  }

  function demarrerSession(mode, regleId) {
    var exos = [];
    if (mode === "regle" || mode === "avance") {
      var r = REGLE_PAR_ID[regleId];
      if (!r) return vueAccueil();
      // « regle » : le socle essentiel (parcours) ; « avance » : les exercices pour aller plus loin.
      var reserve = mode === "avance" ? avances(r) : essentiels(r);
      var revisions = mode === "avance" ? [] : melanger(revisionsDues(r.id)).slice(0, MAX_REVISIONS);
      var maintenant = Date.now();
      // D'abord les exercices pas encore maîtrisés ou dus, puis les autres pour compléter.
      var tries = melanger(reserve.slice()).sort(function (a, b) {
        var sa = suiviExo(a.id), sb = suiviExo(b.id);
        var pa = (sa.boite < BOITE_MAITRISE || sa.du <= maintenant) ? 0 : 1;
        var pb = (sb.boite < BOITE_MAITRISE || sb.du <= maintenant) ? 0 : 1;
        return pa - pb || sa.boite - sb.boite;
      });
      var correctes = 0, voulus = Math.max(TAILLE_SESSION - revisions.length, 6);
      tries.forEach(function (exo) {
        if (exos.length >= voulus) return;
        if (sansFaute(exo)) { if (correctes >= MAX_PHRASES_CORRECTES) return; correctes++; }
        exos.push(exo);
      });
      // Les révisions sont glissées au milieu de la session.
      revisions.forEach(function (rev, i) {
        exos.splice(Math.min(exos.length, 2 + i * 3), 0, rev);
      });
    } else if (mode === "categorie" || mode === "sous") {
      // Entraînement mélangé sur plusieurs règles : au plus 3 exercices par règle,
      // en priorité ceux qui ne sont pas maîtrisés ou qui sont à revoir.
      var groupe = mode === "categorie" ? (CAT_PAR_ID[regleId] && reglesDeCategorie(CAT_PAR_ID[regleId]))
        : (SOUS_PAR_ID[regleId] && SOUS_PAR_ID[regleId].regles);
      if (!groupe) return vueCours();
      var maint = Date.now();
      var parRegle = {}, nbCorrectes = 0;
      // Le socle de chaque règle, plus ses exercices avancés si la règle est déjà acquise.
      melanger(groupe.reduce(function (t, r) { return t.concat(statut(r) === "acquise" ? r.exercices : essentiels(r)); }, [])).sort(function (a, b) {
        var sa = suiviExo(a.id), sb = suiviExo(b.id);
        return ((sa.boite < BOITE_MAITRISE || sa.du <= maint) ? 0 : 1) - ((sb.boite < BOITE_MAITRISE || sb.du <= maint) ? 0 : 1);
      }).forEach(function (exo) {
        if (exos.length >= TAILLE_SESSION || (parRegle[exo.regle.id] || 0) >= 3) return;
        if (sansFaute(exo)) { if (nbCorrectes >= MAX_PHRASES_CORRECTES) return; nbCorrectes++; }
        parRegle[exo.regle.id] = (parRegle[exo.regle.id] || 0) + 1;
        exos.push(exo);
      });
      melanger(exos);
    } else if (mode === "erreurs") {
      exos = melanger(erreursRecentes()).slice(0, TAILLE_SESSION);
    } else if (mode === "revisions") {
      exos = melanger(revisionsDues(null)).slice(0, TAILLE_SESSION);
    } else if (mode === "test") {
      // Une phrase « trouve la faute » par règle : moins de chances de répondre au hasard.
      exos = REGLES.map(function (r) {
        var candidats = essentiels(r).filter(function (e) { return e.t === "faute" && /\{/.test(e.s); });
        return melanger(candidats.length ? candidats : essentiels(r).slice())[0];
      });
    }
    if (!exos.length) return mode === "erreurs" || mode === "revisions" ? vueReviser() : vueAccueil();
    var file = exos.map(function (exo) { return preparerQuestion(exo, mode === "test" ? "repere" : null); });
    // Où revenir à la fin de la session
    var retour = { href: "/", titre: "Retour à l'accueil" };
    if (mode === "regle" || mode === "avance") retour = { href: "/regle/" + encodeURIComponent(regleId), titre: "Retour à la fiche" };
    else if (mode === "categorie") retour = { href: "/cours/" + regleId, titre: "Retour au thème" };
    else if (mode === "sous") retour = { href: "/cours/" + SOUS_PAR_ID[regleId].categorie.id, titre: "Retour au thème" };
    else if (mode === "erreurs" || mode === "revisions") retour = { href: "/reviser", titre: "Retour à Réviser" };
    session = { mode: mode, regleId: regleId, file: file, index: 0, justes: 0, total: 0, reposes: {}, resultatsTest: {}, retour: retour };
    // Comme dans un cours : d'abord la règle expliquée simplement, puis l'application.
    if (mode === "regle" || mode === "avance") { session.intro = true; return vueIntro(); }
    vueQuestion();
  }

  // « La règle en bref » : la section « En bref » du fichier de la règle si elle
  // existe, sinon le début de la fiche (la règle et son test, avant les pièges).
  function texteEnBref(r) {
    if (r.bref) return r.bref;
    var blocs = decouperFiche(r.fiche).base.trim().split(/\n\s*\n/), garde = [];
    for (var i = 0; i < blocs.length && garde.length < 3; i++) {
      if (garde.length && /^\*\*(Les pièges|Pièges|Autres pièges|Autres cas|À retenir|Radicaux)/.test(blocs[i].trim())) break;
      garde.push(blocs[i]);
    }
    return garde.join("\n\n");
  }

  function vueIntro() {
    var r = REGLE_PAR_ID[session.regleId], avance = session.mode === "avance";
    var texte = avance ? (decouperFiche(r.fiche).plusLoin || texteEnBref(r)) : texteEnBref(r);
    var html = '<section class="session intro-regle">'
      + '<div class="session-tete"><a href="' + session.retour.href + '" class="quitter" aria-label="Quitter la session">✕</a>' + barre(0) + "</div>"
      + '<p class="session-regle">' + (avance ? "Pour aller plus loin" : "La règle en bref") + "</p>"
      + "<h1>" + esc(r.titre) + "</h1>"
      + '<div class="fiche-texte">' + rendreFiche(texte) + "</div>"
      + '<div class="ligne-boutons"><button class="bouton principal" data-action="commencer">Commencer les exercices (' + session.file.length + ")</button>"
      + lien("/regles/" + encodeURIComponent(r.id), "Lire la fiche complète", "bouton") + "</div></section>";
    afficher(html, null);
    app.querySelector('[data-action="commencer"]').focus();
  }

  function commencerExercices() {
    if (!session || !session.intro) return;
    session.intro = false;
    vueQuestion();
  }

  /* --- « Revoir la règle » : seulement le point de la fiche qui concerne la phrase --- */
  // La fiche est découpée en unités : chaque élément de liste, chaque paragraphe
  // (avec ses exemples). On garde l'unité qui partage le plus de mots avec
  // l'exercice. Une ligne « Rappel : » dans le fichier de la règle a la priorité.
  function unitesFiche(texte) {
    var unites = [];
    texte.trim().split(/\n\s*\n/).forEach(function (bloc) {
      var courant = [];
      bloc.split("\n").forEach(function (l) {
        if (/^\s*- /.test(l)) {
          if (courant.length) { unites.push(courant.join("\n")); courant = []; }
          unites.push(l.trim());
        } else courant.push(l);
      });
      if (courant.length) unites.push(courant.join("\n"));
    });
    // On écarte les titres de liste (« **Les pièges** : ») et les blocs qui ne
    // contiennent que des exemples : ils n'expliquent rien à eux seuls.
    return unites.filter(function (u) {
      var seulementExemples = u.split("\n").every(function (l) { return /^\s*>/.test(l) || !l.trim(); });
      return !seulementExemples && u.replace(/\*\*/g, "").trim().length > 25;
    });
  }

  function jetonsDe(s) {
    var t = {};
    String(s).toLowerCase().replace(/\*\*/g, "").replace(/’/g, "'").split(/[^a-z0-9àâäçéèêëîïôöùûüœ'-]+/).forEach(function (m) {
      m = m.replace(/^['-]+|['-]+$/g, "");
      if (m) t[m] = true;
    });
    return t;
  }

  function rappelCible(exo) {
    if (exo.rappel) return exo.rappel;
    var poids = {};
    function ajouter(texte, p, min) {
      Object.keys(jetonsDe(texte)).forEach(function (m) { if (m.length >= min) poids[m] = Math.max(poids[m] || 0, p); });
    }
    if (exo.t === "faute") {
      var m = /\{([^>}]*)>([^}]*)\}/.exec(exo.s);
      if (m) { ajouter(m[1], 3, 1); ajouter(m[2], 3, 1); }
    } else if (exo.t === "choix") {
      exo.o.forEach(function (o) { ajouter(o, 3, 1); });
    } else if (exo.t === "conj") {
      ajouter(exo.v, 4, 1); ajouter(exo.r, 3, 1);
    }
    (String(exo.e || "").match(/«[^»]*»/g) || []).forEach(function (q) { ajouter(q, 2, 3); });
    ajouter(exo.e || "", 1, 4);

    // Un exercice essentiel se rapporte au cours de base ; un exercice avancé
    // peut aussi se rapporter à la partie « Pour aller plus loin ».
    var parties = decouperFiche(exo.regle.fiche);
    var unites = unitesFiche(exo.avance ? parties.base + "\n\n" + parties.plusLoin : parties.base);
    var jetons = unites.map(jetonsDe);
    // Un mot présent dans presque toutes les unités (« a », « verbe »…) ne départage rien.
    function rarete(mot) {
      var n = jetons.filter(function (j) { return j[mot]; }).length;
      return n ? Math.log(1 + unites.length / n) - Math.log(2) : 0;
    }
    var meilleure = null, meilleurScore = 0;
    unites.forEach(function (u, i) {
      var score = 0;
      Object.keys(poids).forEach(function (mot) { if (jetons[i][mot]) score += poids[mot] * rarete(mot); });
      score = score / Math.log(8 + Object.keys(jetons[i]).length); // léger avantage aux unités courtes
      if (score > meilleurScore) { meilleurScore = score; meilleure = u; }
    });
    return meilleurScore >= 1.3 ? meilleure : null;
  }

  function blocRappel(exo) {
    var cible = rappelCible(exo);
    var complet = '<div class="fiche-texte">' + rendreFiche(exo.regle.fiche) + "</div>";
    // Aucun passage précis : on montre l'essentiel de la règle (et son test).
    if (!cible) cible = texteEnBref(exo.regle);
    return '<details class="rappel"><summary>Revoir la règle</summary>'
      + '<div class="fiche-texte rappel-cible">' + rendreFiche(cible) + "</div>"
      + '<details class="rappel-complet"><summary>Voir toute la fiche</summary>' + complet + "</details></details>";
  }

  // Phrase avec la faute remplacée par un trou « ___ ».
  function phraseATrou(s) {
    return esc(s.replace(/\{[^>}]*>[^}]*\}/, "___")).replace("___", '<span class="trou">_____</span>');
  }

  function vueQuestion() {
    var q = session.file[session.index];
    var exo = q.exo;
    session.repondu = false;
    var prefixes = { categorie: "Thème", sous: "Thème", erreurs: "Mes erreurs", revisions: "Révision", regle: "Révision", avance: "Révision" };
    var titre = session.mode === "test" ? "Test de positionnement"
      : ((session.mode === "regle" || session.mode === "avance") && exo.regle.id === session.regleId
        ? exo.regle.titre + (session.mode === "avance" ? " · avancé" : "") : prefixes[session.mode] + " · " + exo.regle.titre);
    var html = '<section class="session">'
      + '<div class="session-tete"><a href="' + session.retour.href + '" class="quitter" aria-label="Quitter la session">✕</a>' + barre(session.index / session.file.length) + "</div>"
      + '<p class="session-regle">' + esc(titre) + "</p>";

    if (q.mode === "repere") {
      html += '<p class="consigne">Cliquez sur la faute, ou sur « Aucune faute ».</p><p class="phrase">';
      q.analyse.jetons.forEach(function (j, i) {
        if (j.espace) html += " ";
        else if (j.cliquable) html += '<button class="mot" data-jeton="' + i + '">' + esc(j.texte) + "</button>";
        else html += '<span class="ponct">' + esc(j.texte) + "</span>";
      });
      html += '</p><div class="choix-bas"><button class="bouton aucune" data-action="aucune">Aucune faute</button></div>';
    } else if (q.mode === "choix" || q.mode === "trou") {
      html += '<p class="consigne">Choisissez la bonne réponse.</p>'
        + '<p class="phrase">' + (q.mode === "trou" ? phraseATrou(exo.s) : esc(exo.s).replace("___", '<span class="trou">_____</span>')) + "</p>"
        + '<div class="options">';
      q.options.forEach(function (opt, i) {
        html += '<button class="bouton option" data-option="' + i + '"><kbd>' + (i + 1) + "</kbd> " + esc(opt) + "</button>";
      });
      html += "</div>";
    } else if (q.mode === "corrige") {
      var m = /\{([^>}]*)>[^}]*\}/.exec(exo.s);
      html += '<p class="consigne">Ce passage contient une faute. Récrivez-le correctement.</p>'
        + '<p class="phrase">' + esc(exo.s.slice(0, m.index)) + '<mark class="a-corriger">' + esc(m[1]) + "</mark>" + esc(exo.s.slice(m.index + m[0].length)) + "</p>"
        + '<form class="saisie" data-action="valider-saisie" autocomplete="off">'
        + '<input type="text" id="saisie" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Votre correction" placeholder="Votre correction">'
        + '<button class="bouton principal" type="submit">Valider</button></form>';
    } else if (q.mode === "conj-saisie" || q.mode === "conj-choix") {
      html += '<p class="consigne">Conjuguez « <strong>' + esc(exo.v) + "</strong> » " + esc(exo.temps) + ".</p>"
        + '<p class="phrase conj">' + (exo.pr ? '<span class="pronom">' + esc(exo.pr) + "</span>" + (/'$/.test(exo.pr) ? "" : " ") : "")
        + '<span class="trou">_____</span></p>';
      if (q.mode === "conj-saisie") {
        html += '<form class="saisie" data-action="valider-saisie" autocomplete="off">'
          + '<input type="text" id="saisie" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Forme conjuguée" placeholder="Forme conjuguée">'
          + '<button class="bouton principal" type="submit">Valider</button></form>';
      } else {
        html += '<div class="options">';
        q.options.forEach(function (opt, i) {
          html += '<button class="bouton option" data-option="' + i + '"><kbd>' + (i + 1) + "</kbd> " + esc(opt) + "</button>";
        });
        html += "</div>";
      }
    } else if (q.mode === "tri") {
      html += '<p class="consigne">' + esc(exo.consigne || "Classez chaque élément dans la bonne colonne.") + "</p><div class=\"tri\">";
      exo.items.forEach(function (it, i) {
        html += '<div class="tri-ligne" data-ligne="' + i + '"><span class="tri-texte">' + esc(it[0]) + '</span><div class="tri-choix">';
        exo.c.forEach(function (cat, k) {
          html += '<button class="bouton petit tri-btn" data-tri="' + i + '" data-cat="' + k + '">' + esc(cat) + "</button>";
        });
        html += "</div></div>";
      });
      html += '</div><button class="bouton principal valider-tri" data-action="valider-tri" disabled>Valider</button>';
    }
    html += '<div id="retour" class="retour-panneau" aria-live="polite"></div></section>';
    afficher(html, null);
    var champ = document.getElementById("saisie");
    if (champ) champ.focus();
  }

  // Compare une réponse tapée à la réponse attendue : apostrophes, espaces et
  // majuscules ne comptent pas. La ponctuation finale est ignorée, sauf quand
  // l'exercice porte justement sur la ponctuation (une virgule à ajouter, par exemple).
  function normaliser(s, garderPonctuation) {
    var t = String(s).replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim().replace(/\s+([,;:.!?])/g, "$1");
    if (!garderPonctuation) t = t.replace(/[.!?;:,]+$/, "").trim();
    return t.toLowerCase();
  }

  function repondre(juste, detail) {
    if (session.repondu) return;
    session.repondu = true;
    var q = session.file[session.index];
    var exo = q.exo;
    session.total++;
    if (juste) session.justes++;

    if (session.mode === "test") {
      session.resultatsTest[exo.regle.id] = juste;
    } else {
      enregistrerReponse(exo, juste);
      // Une erreur ? L'exercice revient un peu plus loin, présenté autrement (une seule fois).
      if (!juste && !session.reposes[exo.id]) {
        session.reposes[exo.id] = true;
        session.file.splice(Math.min(session.file.length, session.index + 4), 0, preparerQuestion(exo, null, q.mode));
      }
    }

    // Marquage visuel
    app.querySelectorAll(".session button:not([data-action='suivant']), .session input").forEach(function (b) { b.disabled = true; });
    if (q.mode === "repere") {
      q.analyse.jetons.forEach(function (j, i) {
        var b = app.querySelector('[data-jeton="' + i + '"]');
        if (!b) return;
        if (j.faute) b.classList.add("est-faute");
        if (detail.jeton === i) b.classList.add(juste ? "bon" : "mauvais");
      });
      if (detail.aucune) app.querySelector(".aucune").classList.add(juste ? "bon" : "mauvais");
    } else if (q.options) {
      app.querySelectorAll(".option").forEach(function (b) {
        var i = Number(b.getAttribute("data-option"));
        if (i === q.bonne) b.classList.add("bon");
        else if (i === detail.option) b.classList.add("mauvais");
      });
    } else if (q.mode === "corrige" || q.mode === "conj-saisie") {
      app.querySelector("#saisie").classList.add(juste ? "bon" : "mauvais");
    } else if (q.mode === "tri") {
      exo.items.forEach(function (it, i) {
        app.querySelector('[data-ligne="' + i + '"]').classList.add(q.reponses[i] === it[1] ? "ok" : "ko");
        var bonBouton = app.querySelector('[data-tri="' + i + '"][data-cat="' + it[1] + '"]');
        bonBouton.classList.add("bon");
      });
    }

    var corrige;
    if (exo.t === "faute") corrige = q.analyse.aUneFaute ? phraseCorrigee(exo.s) : esc(exo.s);
    else if (exo.t === "choix") corrige = esc(exo.s).replace("___", "<mark>" + esc(exo.o[exo.a]) + "</mark>");
    else if (exo.t === "conj") corrige = esc(exo.pr) + (/'$/.test(exo.pr) || !exo.pr ? "" : " ") + "<mark>" + esc(exo.r) + "</mark>"
      + (exo.alt && exo.alt.length ? ' <span class="note">(aussi accepté : ' + esc(exo.alt.join(", ")) + ")</span>" : "");
    else corrige = "";

    var panneau = document.getElementById("retour");
    panneau.className = "retour-panneau visible " + (juste ? "ok" : "ko");
    panneau.innerHTML = '<p class="verdict">' + (juste ? "✔ Bonne réponse !" : "✘ Pas tout à fait.") + "</p>"
      + ((q.mode === "corrige" || q.mode === "conj-saisie") && !juste ? '<p class="note">Votre réponse : « ' + esc(detail.saisie || "") + " »</p>" : "")
      + (corrige ? '<p class="corrige">' + corrige + "</p>" : "")
      + '<p class="explication">' + esc(exo.e) + "</p>"
      + creditSource(exo.src)
      + '<p class="num-exo">Règle « ' + esc(exo.regle.titre) + " » · exercice " + exo.num
      + ' <span class="num-fichier">(contenu/regles/' + esc(exo.regle.id) + ".md)</span></p>"
      + blocRappel(exo)
      + '<button class="bouton principal" data-action="suivant">Continuer</button>';
    panneau.querySelector('[data-action="suivant"]').focus();
  }

  // Mention de la source sous la correction (obligation des licences CC BY, GPL, LGPL).
  function creditSource(src) {
    if (!src) return "";
    var texte;
    if (src === "verbiste") texte = "Conjugaison : Verbiste, de Pierre Sarrazin (licence GPL).";
    else if (/^tatoeba:\d+$/.test(src)) {
      var n = src.slice(8);
      texte = 'Phrase d\'origine : <a href="https://tatoeba.org/fr/sentences/show/' + n + '" target="_blank" rel="noopener">Tatoeba n° ' + n + "</a> (licence CC BY 2.0 FR), modifiée pour l'exercice.";
      return '<p class="source">' + texte + "</p>";
    } else texte = "Phrase issue de LanguageTool (licence LGPL).";
    return '<p class="source">' + esc(texte) + "</p>";
  }

  function validerSaisie() {
    var q = session.file[session.index];
    var champ = document.getElementById("saisie");
    var valeur = champ.value;
    if (!normaliser(valeur)) { champ.focus(); return; }
    var ponctuation = /[,;:.!?]/.test(q.correct + " " + (q.fautif || ""));
    var acceptees = [q.correct].concat(q.exo.alt || []).map(function (x) { return normaliser(x, ponctuation); });
    repondre(acceptees.indexOf(normaliser(valeur, ponctuation)) !== -1, { saisie: valeur });
  }

  function choisirTri(i, k) {
    var q = session.file[session.index];
    q.reponses[i] = k;
    app.querySelectorAll('[data-tri="' + i + '"]').forEach(function (b) {
      b.classList.toggle("choisi", Number(b.getAttribute("data-cat")) === k);
    });
    app.querySelector(".valider-tri").disabled = Object.keys(q.reponses).length < q.exo.items.length;
  }

  function validerTri() {
    var q = session.file[session.index];
    var juste = q.exo.items.every(function (it, i) { return q.reponses[i] === it[1]; });
    repondre(juste, {});
  }

  function suivant() {
    session.index++;
    if (session.index >= session.file.length) return vueBilan();
    vueQuestion();
  }

  function vueBilan() {
    var s = session;
    var html = '<section class="bilan"><h1>' + (s.mode === "test" ? "Résultat du test" : "Session terminée") + "</h1>"
      + '<p class="score">' + s.justes + " / " + s.total + " bonnes réponses</p>";

    if (s.mode === "test") {
      etat.testFait = true;
      html += '<p>Les règles réussies sont marquées « Validées au test ». Le parcours commence par les autres ; vous pouvez toujours ouvrir une règle validée pour vous y entraîner.</p><ul class="liste-test">';
      REGLES.forEach(function (r) {
        var ok = s.resultatsTest[r.id];
        if (ok) etat.regles[r.id] = { test: true };
        else delete etat.regles[r.id];
        html += '<li class="' + (ok ? "ok" : "ko") + '">' + (ok ? "✔ " : "✘ ") + esc(r.titre) + "</li>";
      });
      html += "</ul>";
      sauver();
    } else if (s.mode === "regle") {
      var r = REGLE_PAR_ID[s.regleId];
      html += "<p>" + esc(r.titre) + "</p>" + barre(maitrise(r));
      if (statut(r) === "acquise") {
        html += '<p class="bravo">Règle acquise ! 🎉</p>';
        if (avances(r).length) html += encartAllerPlusLoin(r);
      } else html += '<p class="note">La règle est acquise quand les exercices essentiels ont été réussis deux fois de suite.</p>';
    } else if (s.mode === "avance") {
      var ra = REGLE_PAR_ID[s.regleId];
      html += "<p>" + esc(ra.titre) + " · exercices avancés</p>" + barre(maitriseAvancee(ra));
      if (maitriseAvancee(ra) >= SEUIL_ACQUIS) html += '<p class="bravo">Règle approfondie ! ★</p>';
    } else if (s.mode === "categorie" || s.mode === "sous") {
      var groupe = s.mode === "categorie" ? CAT_PAR_ID[s.regleId] : SOUS_PAR_ID[s.regleId];
      var rs = s.mode === "categorie" ? reglesDeCategorie(groupe) : groupe.regles;
      html += "<p>" + esc(groupe.titre) + "</p>" + barre(moyenne(rs));
    }

    var suivante = regleSuivante();
    var relance = location.pathname;
    html += '<div class="actions-principales">';
    if (s.mode === "regle" && statut(REGLE_PAR_ID[s.regleId]) !== "acquise") {
      html += lien(relance, "Refaire une session", "bouton principal");
    } else if (s.mode === "avance" && maitriseAvancee(REGLE_PAR_ID[s.regleId]) < SEUIL_ACQUIS) {
      html += lien(relance, "Encore des exercices avancés", "bouton principal");
    } else if (s.mode === "categorie" || s.mode === "sous") {
      html += lien(relance, "Encore une session", "bouton principal");
    } else if (suivante) {
      html += lien("/session/" + encodeURIComponent(suivante.id), "Règle suivante : " + esc(suivante.titre), "bouton principal");
    }
    html += lien(s.retour.href, esc(s.retour.titre), "bouton") + "</div></section>";
    session = null;
    afficher(html, "");
  }

  /* ---------- Événements ---------- */
  app.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (session && !session.repondu && ev.target.getAttribute("data-action") === "valider-saisie") validerSaisie();
  });

  app.addEventListener("click", function (ev) {
    var cible = ev.target.closest("button, [data-action]");
    if (!cible || cible.disabled) return;
    var action = cible.getAttribute("data-action");

    if (session && !session.repondu) {
      var q = session.file[session.index];
      if (cible.hasAttribute("data-jeton")) {
        var i = Number(cible.getAttribute("data-jeton"));
        return repondre(!!q.analyse.jetons[i].faute, { jeton: i });
      }
      if (action === "aucune") return repondre(!q.analyse.aUneFaute, { aucune: true });
      if (cible.hasAttribute("data-option")) {
        var o = Number(cible.getAttribute("data-option"));
        return repondre(o === q.bonne, { option: o });
      }
      if (cible.hasAttribute("data-tri")) {
        return choisirTri(Number(cible.getAttribute("data-tri")), Number(cible.getAttribute("data-cat")));
      }
      if (action === "valider-tri") return validerTri();
    }
    if (session && action === "commencer") return commencerExercices();
    if (session && action === "suivant") return suivant();
    if (cible.hasAttribute("data-niveau")) {
      choisirNiveau(cible.getAttribute("data-niveau"));
      var y = window.scrollY;
      router();
      window.scrollTo(0, y);
      return;
    }
    if (cible.hasAttribute("data-ancre")) {
      ev.preventDefault();
      var bloc = document.getElementById(cible.getAttribute("data-ancre"));
      if (bloc) bloc.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "deplier-plus-loin") return deplierPlusLoin(cible);
    if (cible.hasAttribute("data-relire")) return relireAction(cible);
    if (cible.hasAttribute("data-filtre-relecture")) {
      try { localStorage.setItem("plume.relecture.filtre", cible.getAttribute("data-filtre-relecture")); } catch (e) { /* ignoré */ }
      return router();
    }
    if (action === "exporter-relectures") return exporterRelectures();
    if (action === "effacer-relectures") {
      if (window.confirm("Effacer toutes vos décisions de relecture non exportées ?")) {
        try { localStorage.removeItem(CLE_RELECTURE); } catch (e) { /* ignoré */ }
        router();
      }
      return;
    }
    if (action === "exporter") return exporter();
    if (action === "reinitialiser") {
      if (window.confirm("Effacer toute votre progression sur cet appareil ? Cette action est irréversible.")) {
        etat = etatVide(); sauver(); router();
      }
    }
  });

  app.addEventListener("input", function (ev) {
    if (ev.target.id === "recherche") majRecherche(ev.target);
  });

  // Liens internes : on change d'adresse sans recharger la page (History API).
  // Un lien vers la page déjà affichée (« Refaire une session ») relance la vue.
  document.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("data-ancre") || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (href.charAt(0) !== "/" || href.charAt(1) === "/" || /\.[a-z0-9]+$/i.test(href) || href === "/COPYING") return;
    ev.preventDefault();
    naviguer(href);
  });

  // Relecture : changement de règle, et commentaire enregistré à la volée.
  app.addEventListener("change", function (ev) {
    if (ev.target.id === "relecture-regle") naviguer("/relecture/" + ev.target.value);
    if (ev.target.hasAttribute("data-commentaire")) {
      var id = ev.target.getAttribute("data-commentaire");
      var d = relectures()[id];
      enregistrerRelecture(id, { statut: d && d.statut ? d.statut : "a-corriger", commentaire: ev.target.value });
    }
  });

  app.addEventListener("change", function (ev) {
    if (ev.target.getAttribute("data-action") === "importer" && ev.target.files[0]) importer(ev.target.files[0]);
  });

  document.addEventListener("keydown", function (ev) {
    if (!session || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (session.intro) {
      if (ev.key === "Enter") { ev.preventDefault(); commencerExercices(); }
      return;
    }
    if (session.repondu) {
      if (ev.key === "Enter") { ev.preventDefault(); suivant(); }
      return;
    }
    if (ev.target.tagName === "INPUT") return; // la saisie gère elle-même « Entrée »
    var q = session.file[session.index];
    var n = Number(ev.key);
    if (q.options && n >= 1 && n <= q.options.length) repondre(n - 1 === q.bonne, { option: n - 1 });
    if (q.mode === "repere" && (ev.key === "0" || ev.key.toLowerCase() === "a")) repondre(!q.analyse.aUneFaute, { aucune: true });
  });

  function exporter() {
    var blob = new Blob([JSON.stringify(etat, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "projet-plume-progression-" + aujourdhui() + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function importer(fichier) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      try {
        etat = normaliserEtat(JSON.parse(lecteur.result)); sauver(); router();
        window.alert("Progression importée.");
      } catch (err) {
        window.alert("Ce fichier n'est pas une sauvegarde du Projet Plume valide.");
      }
    };
    lecteur.readAsText(fichier);
  }

  /* ---------- Navigation ---------- */
  function naviguer(href, remplacer) {
    if (href !== location.pathname) history[remplacer ? "replaceState" : "pushState"](null, "", href);
    router();
  }

  function router() {
    var chemin = decodeURIComponent(location.pathname).replace(/\.html$/, "");
    var parts = chemin.split("/").filter(Boolean);
    session = null;
    switch (parts[0]) {
      case "cours": return parts[1] ? vueCategorie(parts[1]) : vueCours();
      case "regle": return vueRegle(parts[1], parts[2] === "plus-loin");
      case "regles": return parts[1] ? vueLecture(parts[1]) : vueRegles();
      case "reviser": return vueReviser();
      case "progres": return vueProgres();
      case "projet": case "apropos": return vueProjet();
      case "relecture": return vueRelecture(parts[1]);
      case "session":
        if (parts[1] === "categorie" || parts[1] === "sous") return demarrerSession(parts[1], parts[2]);
        if (parts[2] === "avance") return demarrerSession("avance", parts[1]);
        return demarrerSession("regle", parts[1]);
      case "revisions": return demarrerSession("revisions");
      case "erreurs": return demarrerSession("erreurs");
      case "test": return demarrerSession("test");
      default: return vueAccueil();
    }
  }

  // Anciens liens « #/… » : on les convertit vers les nouvelles adresses.
  if (/^#\//.test(location.hash)) history.replaceState(null, "", location.hash.slice(1));

  window.addEventListener("popstate", router);
  router();

  // Mode hors ligne (uniquement quand le site est servi en http/https).
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register("/sw.js").catch(function () { /* sans gravité */ });
  }
})();
