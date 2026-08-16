import { DB, User } from "./types";

/* =========================================================
   INITIALISATION SÉLECTIVE — moteur de production
   Supprime définitivement les données réelles sélectionnées.
   Conserve toujours :
   l'architecture, la structure de la base, les rôles RBAC,
   la session et le compte Admin Sup en cours.
   ========================================================= */

export type InitKey =
  | "formations"
  | "modules"
  | "apprenants"
  | "formateurs"
  | "admins"
  | "partenaires"
  | "cours"
  | "supports"
  | "edt"
  | "presences"
  | "tests"
  | "notes"
  | "paiements"
  | "certificats"
  | "bourses"
  | "notifications"
  | "enia"
  | "autres";

export const INIT_ORDER: InitKey[] = [
  "formations",
  "modules",
  "apprenants",
  "formateurs",
  "admins",
  "partenaires",
  "cours",
  "supports",
  "edt",
  "presences",
  "tests",
  "notes",
  "paiements",
  "certificats",
  "bourses",
  "notifications",
  "enia",
  "autres",
];

export function categoryCount(db: DB, key: InitKey, currentUserId: string): number {
  switch (key) {
    case "formations":
      return db.settings.formations.informatique.titre || db.settings.formations.industriel.titre ? 2 : 0;
    case "modules":
      return db.modules.length;
    case "apprenants":
      return db.students.length;
    case "formateurs":
      return db.teachers.length;
    case "admins":
      return db.users.filter((u) => ["superadmin", "admin"].includes(u.role) && u.id !== currentUserId).length;
    case "partenaires":
      return db.settings.partenaires.length;
    case "cours":
      return db.courses.filter((c) => c.type === "cours" || c.type === "devoir").length;
    case "supports":
      return db.courses.filter((c) => c.type === "document").length;
    case "edt":
      return db.schedule.length;
    case "presences":
      return db.attendance.length;
    case "tests":
      return db.tests.length;
    case "notes":
      return db.grades.length;
    case "paiements":
      return db.payments.length;
    case "certificats":
      return db.certificates.length;
    case "bourses":
      return db.scholarships.length;
    case "notifications":
      return db.notifications.length;
    case "enia":
      return db.settings.enia.frais.length + db.settings.enia.pieces.length + db.settings.enia.bourse.avantages.length;
    case "autres":
      return db.registrations.length + db.messages.length;
    default:
      return 0;
  }
}

export interface InitResult {
  db: DB;
  recap: string[];
}

export function initSelection(db: DB, keys: InitKey[], currentUser: User, actorName: string): InitResult {
  const has = (k: InitKey) => keys.includes(k);
  const recap: string[] = [];
  const date = new Date().toISOString().slice(0, 10);
  const stamp = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  let nd: DB = { ...db, settings: { ...db.settings } };

  /* ---------- formations ---------- */
  if (has("formations")) {
    nd = {
      ...nd,
      settings: {
        ...nd.settings,
        formations: {
          informatique: { titre: "GÉNIE INFORMATIQUE", description: "" },
          industriel: { titre: "GÉNIE INDUSTRIEL", description: "" },
        },
      },
    };
    recap.push("Formations réinitialisées");
  }

  /* ---------- modules ---------- */
  if (has("modules")) {
    nd = { ...nd, modules: [] };
    recap.push(`${db.modules.length} module(s) supprimé(s)`);
  }

  /* ---------- apprenants (+ cascades) ---------- */
  if (has("apprenants")) {
    const removedIds = new Set(db.students.map((s) => s.id));
    nd = {
      ...nd,
      students: [],
      attendance: nd.attendance.filter((a) => !removedIds.has(a.studentId)),
      payments: nd.payments.filter((p) => !removedIds.has(p.studentId)),
      grades: nd.grades.filter((g) => !removedIds.has(g.studentId)),
      results: nd.results.filter((r) => !removedIds.has(r.studentId)),
      certificates: nd.certificates.filter((c) => !removedIds.has(c.studentId)),
      scholarships: nd.scholarships.filter((s) => !removedIds.has(s.studentId)),
      users: nd.users.filter((u) => !(u.linkedId && removedIds.has(u.linkedId))),
    };
    recap.push(`${db.students.length} apprenant(s), comptes associés et données liées supprimés`);
  }

  /* ---------- formateurs (+ cascades) ---------- */
  if (has("formateurs")) {
    const removedIds = new Set(db.teachers.map((t) => t.id));
    nd = {
      ...nd,
      teachers: [],
      courses: nd.courses.filter((c) => !removedIds.has(c.teacherId)),
      schedule: nd.schedule.filter((s) => !removedIds.has(s.teacherId)),
      users: nd.users.filter((u) => !(u.linkedId && removedIds.has(u.linkedId))),
    };
    recap.push(`${db.teachers.length} formateur(s) et leurs contenus supprimés`);
  }

  /* ---------- administrateurs (sauf compte en cours) ---------- */
  if (has("admins")) {
    nd = { ...nd, users: nd.users.filter((u) => u.id === currentUser.id || !["superadmin", "admin"].includes(u.role)) };
    recap.push("Administrateurs supprimés (compte Admin Sup courant conservé)");
  }

  /* ---------- partenaires ---------- */
  if (has("partenaires")) {
    nd = { ...nd, settings: { ...nd.settings, partenaires: [] } };
    recap.push(`${db.settings.partenaires.length} partenaire(s) supprimé(s)`);
  }


  /* ---------- cours ---------- */
  if (has("cours")) {
    const n = nd.courses.filter((c) => c.type === "cours" || c.type === "devoir").length;
    nd = { ...nd, courses: nd.courses.filter((c) => c.type === "document") };
    recap.push(`${n} cours / devoir(s) supprimé(s)`);
  }

  /* ---------- supports ---------- */
  if (has("supports")) {
    const n = nd.courses.filter((c) => c.type === "document").length;
    nd = { ...nd, courses: nd.courses.filter((c) => c.type !== "document") };
    recap.push(`${n} support(s) supprimé(s)`);
  }

  /* ---------- emploi du temps ---------- */
  if (has("edt")) {
    nd = { ...nd, schedule: [] };
    recap.push(`${db.schedule.length} créneau(x) supprimé(s)`);
  }

  /* ---------- présences ---------- */
  if (has("presences")) {
    nd = { ...nd, attendance: [] };
    recap.push(`${db.attendance.length} présence(s) supprimée(s)`);
  }

  /* ---------- tests ---------- */
  if (has("tests")) {
    nd = { ...nd, tests: [], results: [] };
    recap.push(`${db.tests.length} test(s) et leurs résultats supprimés`);
  }

  /* ---------- notes ---------- */
  if (has("notes")) {
    nd = { ...nd, grades: [] };
    recap.push(`${db.grades.length} note(s) supprimée(s)`);
  }

  /* ---------- paiements ---------- */
  if (has("paiements")) {
    nd = { ...nd, payments: [] };
    recap.push(`${db.payments.length} paiement(s) supprimé(s)`);
  }

  /* ---------- certificats ---------- */
  if (has("certificats")) {
    nd = { ...nd, certificates: [] };
    recap.push(`${db.certificates.length} certificat(s) supprimé(s)`);
  }

  /* ---------- bourses ---------- */
  if (has("bourses")) {
    nd = { ...nd, scholarships: [] };
    recap.push(`${db.scholarships.length} dossier(s) de bourse supprimé(s)`);
  }

  /* ---------- notifications (conserve celles du compte courant) ---------- */
  if (has("notifications")) {
    nd = { ...nd, notifications: nd.notifications.filter((n) => n.toId === currentUser.id) };
    recap.push("Notifications purgées (les vôtres sont conservées)");
  }

  /* ---------- module ENIA 2.0 ---------- */
  if (has("enia")) {
    nd = {
      ...nd,
      settings: {
        ...nd.settings,
        enia: {
          ...nd.settings.enia,
          affiche: "",
          presentation: "",
          accroche: "",
          frais: [],
          pieces: [],
          highlights: [],
          bourse: { ...nd.settings.enia.bourse, intro: "", concretement: "", avantages: [] },
          lien: { ...nd.settings.enia.lien, url: "", actif: false },
        },
      },
    };
    recap.push("Contenu du module ENIA 2.0 réinitialisé");
  }

  /* ---------- autres données ---------- */
  if (has("autres")) {
    nd = { ...nd, registrations: [], messages: [] };
    recap.push("Pré-inscriptions, messages et autres données supprimés");
  }

  /* ---------- journal ---------- */
  nd = {
    ...nd,
    log: [
      {
        id: `LOG-${stamp()}`,
        date,
        user: actorName,
        action: `⚙️ Initialisation : ${keys.join(", ")} — ${recap.length} catégorie(s) traitée(s)`,
      },
      ...nd.log,
    ],
    notifications: [
      {
        id: `NTF-${stamp()}`,
        toId: currentUser.id,
        title: "Initialisation terminée",
        body: `${recap.length} catégorie(s) ont été réinitialisées. La plateforme est prête pour les données réelles.`,
        date,
        lu: false,
        type: "info",
      },
      ...nd.notifications,
    ],
  };

  return { db: nd, recap };
}
