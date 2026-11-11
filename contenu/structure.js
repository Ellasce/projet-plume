/*
 * Projet Plume — organisation du site (licence CC BY-SA 4.0)
 *
 * Ce fichier décide comment les règles sont rangées et présentées.
 * Il ne contient aucun exercice : on peut réorganiser librement sans
 * toucher à la progression des utilisateurs (les identifiants des règles
 * ne changent pas).
 *
 * - categories : catégories → sous-catégories → identifiants de règles
 * - niveaux    : niveaux disponibles (filtre et étiquette). Le niveau de chaque
 *               règle est écrit dans son fichier : « Niveau : lycée ».
 * - parcours   : ordre conseillé (bouton « Continuer » de l'accueil)
 * - liens      : règles liées entre elles (affichées en bas de la fiche ;
 *                le lien est automatiquement réciproque)
 */
window.PLUME_STRUCTURE = {
  niveaux: [
    { id: "college", titre: "Collège" },
    { id: "lycee", titre: "Lycée" },
    { id: "superieur", titre: "Supérieur" }
  ],

  categories: [
    {
      id: "homophones",
      titre: "Homophones",
      icone: "🎧",
      description: "Des mots qui se prononcent pareil mais ne s'écrivent pas pareil.",
      sous: [
        { id: "homophones-classiques", titre: "Les classiques",
          regles: ["a-a", "et-est", "on-ont", "son-sont", "ou-ou", "la-la", "leur-leurs", "peu-peut", "ca-sa"] },
        { id: "homophones-grammaticaux", titre: "Homophones grammaticaux",
          regles: ["infinitif-participe", "ce-se-ces-ses", "quel-quelle-qu-elle", "futur-conditionnel", "quelque-quel-que", "quand-quant", "plutot-plus-tot", "sais-sait", "ai-ais"] }
      ]
    },
    {
      id: "accords",
      titre: "Accords",
      icone: "🔗",
      description: "Accorder le participe passé, le verbe et les mots variables.",
      sous: [
        { id: "accords-base", titre: "Les bases",
          regles: ["accord-gn", "accord-sujet-verbe", "pluriel-noms", "cest-ce-sont"] },
        { id: "participe-passe", titre: "Participe passé",
          regles: ["pp-etre-avoir", "pp-cod-avant", "pp-pronominaux", "pp-infinitif"] },
        { id: "autres-accords", titre: "Autres accords",
          regles: ["tout", "vingt-cent-mille", "couleurs", "demi-nu", "accords-sujet-delicats", "participe-present-adjectif"] }
      ]
    },
    {
      id: "conjugaison",
      titre: "Conjugaison",
      icone: "⏱️",
      description: "Les trois groupes, les formes des verbes et le choix du mode.",
      sous: [
        { id: "bases-conjugaison", titre: "Les bases : les trois groupes",
          regles: ["conj-groupes", "conj-base-present", "tu-s", "verbes-cer-ger", "conj-base-imparfait", "conj-base-futur"] },
        { id: "temps-composes", titre: "Temps composés",
          regles: ["pc-auxiliaire", "pp-terminaison", "conditionnel-passe"] },
        { id: "formes-verbes", titre: "Formes pièges",
          regles: ["conj-present", "conj-futur", "conj-subjonctif", "conj-imperatif", "conj-passe-simple", "conj-participe"] },
        { id: "choisir-mode", titre: "Choisir le mode",
          regles: ["modes-conjonctions", "concordance-temps"] }
      ]
    },
    {
      id: "orthographe-usage",
      titre: "Orthographe d'usage",
      icone: "🔤",
      description: "L'orthographe des mots eux-mêmes : lettres doubles, accents, terminaisons.",
      sous: [
        { id: "lettres", titre: "Lettres et accents",
          regles: ["consonnes-doubles", "accents", "mots-difficiles"] },
        { id: "terminaisons", titre: "Terminaisons",
          regles: ["amment-emment"] },
        { id: "majuscules-traits", titre: "Majuscules et trait d'union",
          regles: ["majuscules", "trait-union"] }
      ]
    },
    {
      id: "grammaire",
      titre: "Grammaire",
      icone: "🧩",
      description: "Comprendre la phrase pour bien écrire : sujet, compléments, pronoms.",
      sous: [
        { id: "fonctions", titre: "Les compléments",
          regles: ["cod-coi", "constructions-verbes"] },
        { id: "pronoms-relatifs", titre: "Pronoms relatifs",
          regles: ["dont-que", "pronoms-relatifs"] },
        { id: "phrase", titre: "La phrase",
          regles: ["negation-ne", "interrogation-indirecte", "virgule"] }
      ]
    },
    {
      id: "bien-ecrire",
      titre: "Bien écrire",
      icone: "✒️",
      description: "Les tournures fautives et les mots qu'on confond.",
      sous: [
        { id: "usage", titre: "Usage et vocabulaire",
          regles: ["constructions-fautives", "paronymes"] }
      ]
    }
  ],

  // Les bases (collège) ouvrent le parcours ; le test de positionnement
  // les valide d'emblée pour ceux qui les maîtrisent.
  parcours: [
    "a-a", "et-est", "on-ont", "son-sont", "ou-ou", "la-la", "leur-leurs", "peu-peut",
    "ca-sa", "sais-sait", "accord-gn", "accord-sujet-verbe", "pluriel-noms", "tu-s", "verbes-cer-ger", "pc-auxiliaire", "pp-terminaison", "cod-coi", "consonnes-doubles", "accents",
    "conj-groupes", "conj-base-present", "conj-base-imparfait", "conj-base-futur",
    "infinitif-participe", "ce-se-ces-ses", "quel-quelle-qu-elle", "pp-etre-avoir",
    "conj-present", "futur-conditionnel", "conj-futur", "pp-cod-avant",
    "tout", "conj-imperatif", "vingt-cent-mille", "couleurs", "demi-nu", "amment-emment", "dont-que", "cest-ce-sont", "negation-ne", "trait-union", "majuscules", "conditionnel-passe", "ai-ais", "interrogation-indirecte", "mots-difficiles", "pronoms-relatifs", "virgule", "concordance-temps", "constructions-verbes", "conj-subjonctif",
    "accords-sujet-delicats", "modes-conjonctions", "pp-pronominaux", "quelque-quel-que",
    "quand-quant", "plutot-plus-tot", "participe-present-adjectif", "pp-infinitif", "conj-participe", "conj-passe-simple",
    "constructions-fautives", "paronymes"
  ],

  liens: {
    "concordance-temps": ["futur-conditionnel", "conditionnel-passe"],
    "pronoms-relatifs": ["dont-que", "ou-ou"],
    "constructions-verbes": ["cod-coi", "constructions-fautives"],
    "virgule": ["accord-sujet-verbe"],
    "sais-sait": ["ce-se-ces-ses"],
    "ai-ais": ["futur-conditionnel", "conj-base-imparfait"],
    "pp-terminaison": ["conj-participe", "infinitif-participe"],
    "verbes-cer-ger": ["conj-base-present"],
    "mots-difficiles": ["constructions-fautives"],
    "ca-sa": ["ce-se-ces-ses"],
    "cod-coi": ["pp-cod-avant", "leur-leurs", "dont-que"],
    "conditionnel-passe": ["futur-conditionnel"],
    "negation-ne": ["on-ont"],
    "trait-union": ["peu-peut", "vingt-cent-mille"],
    "tu-s": ["conj-imperatif"],
    "accord-gn": ["couleurs", "pluriel-noms"],
    "accord-sujet-verbe": ["accords-sujet-delicats", "leur-leurs"],
    "pc-auxiliaire": ["pp-etre-avoir"],
    "dont-que": ["constructions-fautives"],
    "a-a": ["et-est", "la-la"],
    "et-est": ["son-sont"],
    "on-ont": ["son-sont"],
    "ou-ou": ["la-la"],
    "peu-peut": ["a-a"],
    "pp-cod-avant": ["pp-etre-avoir", "pp-pronominaux", "pp-infinitif"],
    "pp-pronominaux": ["pp-infinitif"],
    "futur-conditionnel": ["conj-futur"],
    "conj-base-present": ["conj-present"],
    "conj-base-futur": ["conj-futur"],
    "conj-base-imparfait": ["conj-passe-simple"],
    "modes-conjonctions": ["conj-subjonctif"],
    "infinitif-participe": ["conj-participe", "pp-etre-avoir"],
    "quel-quelle-qu-elle": ["quelque-quel-que"],
    "participe-present-adjectif": ["paronymes"],
    "constructions-fautives": ["paronymes"]
  }
};
