/*
 * Projet Plume — textes des pages de présentation (licence CC BY-SA 4.0)
 * Utilisés à la fois par l'application (js/app.js) et par le générateur de
 * pages statiques (outils/generer_site.js) : on ne les écrit qu'ici.
 */
window.PLUME_PAGES = {
  accueil: {
    titre: "La Plume de Diderot — l'orthographe libre et gratuite",
    description: "Entraînez-vous à l'orthographe, à la grammaire et à la conjugaison françaises gratuitement, sans compte ni publicité. Cours et exercices libres.",
    html: `<div class="presentation">
<h1>Le savoir libre, pour tous</h1>
<p class="accroche">Entraînez-vous à l'orthographe, à la grammaire et à la conjugaison gratuitement, sans compte ni publicité.</p>
<ul class="valeurs">
<li><strong>Libre</strong><span>Le code et les cours sont sous licences libres : chacun peut les utiliser, les copier et les améliorer.</span></li>
<li><strong>Gratuit</strong><span>Toutes les règles et tous les exercices sont ouverts, sans abonnement ni module payant.</span></li>
<li><strong>Sans collecte de données</strong><span>Pas de compte, pas de traceur, pas de publicité. Votre progression reste sur votre appareil.</span></li>
</ul>
</div>`,
    suite: `<p>Le Projet Plume propose des fiches de règles claires et des exercices corrigés : homophones, accords, participe passé, conjugaison, tournures fautives. Chaque règle s'apprend en quelques minutes, puis revient au bon moment pour être retenue.</p>`
  },

  projet: {
    titre: "Le Projet Plume",
    description: "Le Projet Plume est un site libre et gratuit pour apprendre l'orthographe française : pas de compte, pas de publicité, aucune donnée collectée.",
    html: `<h1>Le Projet Plume</h1>
<div class="fiche-texte">
<p><strong>La Plume de Diderot est le site du Projet Plume : un site libre et gratuit pour bien écrire le français.</strong> On y trouve des fiches de règles et des exercices d'orthographe, de grammaire et de conjugaison, du collège au niveau adulte.</p>

<h2>Pourquoi ce projet ?</h2>
<p>Bien écrire sert à tout : étudier, chercher un emploi, se faire comprendre. Ce savoir ne devrait pas dépendre d'un abonnement. Le Projet Plume part d'une idée simple : <strong>le savoir libre, pour tous</strong>.</p>
<ul>
<li><strong>Libre</strong> : le code du site et les cours sont publiés sous licences libres. Chacun peut les lire, les copier, les corriger et les réutiliser, y compris dans une classe ou une association.</li>
<li><strong>Gratuit</strong> : tout est ouvert. Il n'y a ni abonnement, ni module payant, ni publicité.</li>
<li><strong>Sans collecte de données</strong> : il n'y a pas de compte, pas de traceur, pas de statistiques de visite. Le site ne sait rien de vous.</li>
</ul>

<h2>Pourquoi « Diderot » ?</h2>
<p>Au XVIII<sup>e</sup> siècle, Denis Diderot a dirigé avec d'Alembert l'<em>Encyclopédie</em>, qui voulait rassembler les connaissances de son temps et les mettre à la portée de tous. Le site lui emprunte cette idée : un savoir partagé, que chacun peut lire et enrichir.</p>

<h2>Comment ça marche ?</h2>
<ul>
<li><strong>Une règle = une fiche courte</strong>, avec un test pratique pour ne plus hésiter.</li>
<li><strong>Des exercices variés</strong> : choisir le bon mot, corriger une phrase, trier, conjuguer. Chaque réponse est expliquée.</li>
<li><strong>L'essentiel d'abord</strong> : une dizaine d'exercices suffisent pour acquérir une règle. Les cas difficiles sont proposés ensuite, dans « Aller plus loin ».</li>
<li><strong>La mémoire sur la durée</strong> : les exercices ratés reviennent vite, les exercices réussis reviennent de plus en plus tard (répétition espacée).</li>
<li><strong>À votre rythme</strong> : suivez le parcours conseillé, ou choisissez librement un thème dans l'onglet Cours.</li>
</ul>

<h2>Vos données</h2>
<p>Votre progression est enregistrée <strong>uniquement dans votre navigateur</strong>, sur votre appareil. Elle n'est jamais envoyée sur Internet. La page <a href="/progres">Ma progression</a> explique comment la conserver et la transférer d'un appareil à l'autre.</p>

<h2>Comment ce projet a été fait</h2>
<p>Le Projet Plume a été réalisé, faute de mieux, <strong>en grande partie avec une intelligence artificielle</strong> (Claude, d'Anthropic) : sans équipe ni moyens pour tout écrire à la main, c'était la seule façon de le faire exister. Les règles et les exercices sont vérifiés et relus, mais des erreurs peuvent rester.</p>
<p><strong>Si quelqu'un souhaite reprendre le projet et tout refaire à la main, c'est bienvenu.</strong> Le code et les contenus sont libres : ils sont faits pour être copiés, corrigés et améliorés.</p>

<h2>Licences</h2>
<ul>
<li>Code du site : <a href="/COPYING">GNU GPL version 3</a> ou ultérieure.</li>
<li>Fiches, explications et exercices rédigés pour le projet : Creative Commons BY-SA 4.0.</li>
<li>Les phrases d'exercice sont écrites pour le projet. Phrases issues de LanguageTool : LGPL 2.1 ou ultérieure. Conjugaisons vérifiées avec Verbiste (Pierre Sarrazin) : GPL 2 ou ultérieure. Chaque exercice repris indique sa source sous la correction.</li>
</ul>
<p>Seules des ressources sous licence libre sont utilisées. La terminologie suit le document officiel <em>Grammaire du français — Terminologie grammaticale</em> (Éduscol, 2020). Les rectifications orthographiques de 1990 sont acceptées.</p>

<h2>Signaler une erreur</h2>
<p>Sous chaque correction, une ligne indique la règle et le numéro de l'exercice. Ce numéro suffit pour retrouver la phrase et la corriger. Les exercices sont relus un par un avant d'être marqués comme validés.</p>
<h2>Contact</h2>
<p>Une erreur, une idée, l'envie de participer ou de reprendre le projet ? Écrivez à <a href="mailto:projet-plume@proton.me">projet-plume@proton.me</a>.</p>
</div>`
  },

  progression: {
    titre: "Ma progression",
    description: "Comment votre progression est enregistrée sur le Projet Plume, comment la conserver, l'exporter et la transférer sur un autre appareil.",
    html: `<h2>Comment votre progression est conservée</h2>
<div class="fiche-texte">
<ul>
<li><strong>Enregistrement automatique</strong> : après chaque réponse, votre progression est enregistrée dans votre navigateur, sur cet appareil. Vous pouvez fermer la page : vous reprendrez où vous en étiez.</li>
<li><strong>Rien ne part sur Internet</strong> : il n'y a pas de compte. Personne d'autre que vous ne peut voir votre progression.</li>
<li><strong>Un appareil, un navigateur</strong> : la progression de votre téléphone n'apparaît pas sur votre ordinateur, ni celle de Chrome dans Firefox.</li>
</ul>
<p><strong>Elle peut être perdue si :</strong></p>
<ul>
<li>vous effacez les données de navigation ou les « données de sites » ;</li>
<li>vous utilisez la navigation privée (tout est effacé à la fermeture) ;</li>
<li>le navigateur fait de la place tout seul : certains navigateurs peuvent effacer les données d'un site qui n'a pas été visité depuis plusieurs semaines.</li>
</ul>
<p><strong>Pour la garder en sécurité :</strong></p>
<ul>
<li><strong>Exportez-la</strong> de temps en temps : le bouton « Exporter » crée un petit fichier <code>.json</code> à garder où vous voulez.</li>
<li><strong>Pour changer d'appareil</strong> : exportez sur l'ancien, puis utilisez « Importer » sur le nouveau.</li>
<li><strong>Installez le site comme une application</strong> (menu du navigateur, « Installer » ou « Ajouter à l'écran d'accueil ») : les données d'une application installée sont mieux protégées.</li>
</ul>
</div>`
  }
};
