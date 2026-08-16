import type { DB } from "./types";

/**
 * Empty production-compatible structure used only when Supabase is not yet
 * configured. It intentionally contains no account or business demo record.
 */
export function seedDB(): DB {
  return {
    version: 3,
    settings: {
      branding: {
        name: "SENTINELLES NUMÉRIQUES",
        subtitle: "Centre de Formation en Génie Informatique et Génie Industriel",
        tagline: "",
        badge: "SENTINELLES • ACADEMY",
      },
      hero: {
        responsibleName: "",
        responsibleTitle: "",
        responsibleImage: "",
        highlight: "RESPONSABLE DU CENTRE",
      },
      infos: {
        debut: "",
        lieu: "",
        duree: "",
        whatsapp: [],
        inscription: "",
      },
      frais: { inscription: 0, informatique: [], industriel: [] },
      formations: {
        informatique: { titre: "GÉNIE INFORMATIQUE", description: "" },
        industriel: { titre: "GÉNIE INDUSTRIEL", description: "" },
      },
      avantages: [],
      partenaires: [],
      annonces: [],
      apropos: { titre: "À propos", texte: "" },
      enia: {
        enabled: false,
        nom: "ENIA 2.0",
        sousTitre: "École du Numérique et de l'Intelligence Artificielle",
        accroche: "",
        presentationTitre: "C'est quoi ENIA 2.0 ?",
        presentation: "",
        affiche: "",
        afficheTelechargeable: false,
        bourse: {
          titre: "Bourse ENIA 2.0",
          intro: "",
          avantages: [],
          concretementTitre: "Concrètement",
          concretement: "",
        },
        highlightTitre: "BOURSE 100 % GRATUITE",
        highlights: [],
        fraisTitre: "Frais scolaires",
        frais: [],
        piecesTitre: "Pièces à fournir",
        piecesNote: "",
        pieces: [],
        lien: { nom: "Site officiel ENIA 2.0", url: "", description: "", actif: false },
      },
      bourse: { title: "", subtitle: "", button: "" },
      preInscription: { enabled: true, title: "Pré-inscription en ligne", description: "" },
      contact: { email: "", adresse: "" },
    },
    modules: [],
    users: [],
    students: [],
    teachers: [],
    registrations: [],
    courses: [],
    schedule: [],
    attendance: [],
    payments: [],
    tests: [],
    results: [],
    grades: [],
    messages: [],
    notifications: [],
    certificates: [],
    scholarships: [],
    log: [],
  };
}