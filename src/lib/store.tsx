import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DB, User, Notification, Formation } from "./types";
import { seedDB } from "./seed";
import { resetLock } from "./auth";
import { supabaseConfigured } from "./supabase/client";
import { requireSupabase } from "./supabase/client";
import { getCurrentProfile, hasAnySuperadmin, onAuthChange, signInWithUsername as supabaseSignIn, signOut as supabaseSignOut } from "./supabase/auth";
import { loadPublicContent, mapPublicContent } from "./supabase/content";
import { mapEniaContent } from "./supabase/enia";
import { loadRoleSnapshot } from "./supabase/snapshot";

const DB_KEY = "sn_db_v3";
const SESSION_KEY = "sn_session_v3";
// Nombre de secondes après lesquelles la session expire (JWT-like court)
const SESSION_TTL_S = 30 * 60; // 30 minutes

interface SessionData {
  userId: string;
  issuedAt: number; // ms
  expiresAt: number; // ms
}

function loadDB(): DB {
  // Supabase production mode never restores business/private data from localStorage.
  if (supabaseConfigured) return emptyDB();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.version && parsed.settings) {
        // migration : contenus ajoutés après coup (module ENIA 2.0, etc.)
        const ref = seedDB().settings;
        parsed.settings = {
          ...ref,
          ...parsed.settings,
          enia: parsed.settings.enia
            ? {
                ...ref.enia,
                ...parsed.settings.enia,
                bourse: { ...ref.enia.bourse, ...(parsed.settings.enia as any).bourse },
                lien: { ...ref.enia.lien, ...(parsed.settings.enia as any).lien },
              }
            : ref.enia,
          partenaires: (parsed.settings.partenaires ?? []).map((p: any, i: number) => ({ ordre: i, telephone: "", email: "", ...p })),
        };
        // migration : si la structure d'un module nouveau manque
        parsed.modules = (parsed.modules ?? []).map((m: any) => ({
          description: m.description ?? "",
          objectifs: m.objectifs ?? [],
          programme: m.programme ?? "",
          chapitres: m.chapitres ?? [],
          duree: m.duree ?? "",
          image: m.image ?? "",
          extra: m.extra ?? "",
          ...m,
        }));
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  // Premier lancement : base VIDE (plus aucune donnée de démonstration).
  // On garde seedDB comme structure de référence pour les types, mais on ne l'insère pas.
  const fresh = emptyDB();
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  } catch {
    /* ignore */
  }
  return fresh;
}

function emptyDB(): DB {
  const seed = seedDB();
  // On nettoie tout sauf la structure/paramètres par défaut essentiels
  return {
    ...seed,
    users: [],
    students: [],
    teachers: [],
    modules: [],
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
    // Contenus éditoriaux vides
    settings: {
      ...seed.settings,
      branding: {
        name: "SENTINELLES NUMÉRIQUES",
        subtitle: "Centre de Formation en Génie Informatique et Génie Industriel",
        tagline: "Formons aujourd'hui les talents numériques et industriels qui construiront l'avenir.",
        badge: "SENTINELLES • ACADEMY",
      },
      hero: {
        responsibleName: "—",
        responsibleTitle: "Administrateur Système",
        responsibleImage: "",
        highlight: "RESPONSABLE DU CENTRE",
      },
      formations: {
        informatique: { titre: "GÉNIE INFORMATIQUE", description: "" },
        industriel: { titre: "GÉNIE INDUSTRIEL", description: "" },
      },
      frais: {
        inscription: 0,
        informatique: [],
        industriel: [],
      },
      avantages: [],
      partenaires: [],
      annonces: [],
    },
  };
}

function loadSession(): SessionData | null {
  if (supabaseConfigured) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as SessionData;
      if (s.expiresAt > Date.now()) return s;
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
  return null;
}

interface StoreCtxType {
  db: DB;
  user: User | null;
  formationsMap: Record<string, string>;
  getFormationId: (code: "informatique" | "industriel") => string | undefined;
  login: (username: string, password: string, role?: string) => Promise<{ ok: boolean; error?: string; lockedUntil?: number; mustChangePassword?: boolean }>;
  logout: (options?: { full?: boolean }) => void;
  hasAnyAdmin: boolean;
  adminCheckReady: boolean;
  authReady: boolean;
  update: (fn: (db: DB) => DB) => void;
  nextStudentId: () => string;
  nextCertNumber: () => string;
  notify: (toId: string, title: string, body: string, type?: string) => void;
  log: (action: string) => void;
  modulesOf: (f: Formation) => DB["modules"];
  userName: (id: string) => string;
  studentOf: (userId: string) => DB["students"][number] | undefined;
  teacherOf: (userId: string) => DB["teachers"][number] | undefined;
}

const StoreCtx = createContext<StoreCtxType>(null!);

function persist(db: DB) {
  if (supabaseConfigured) return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* quota */
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB);
  const [session, setSession] = useState<SessionData | null>(loadSession);
  const [formationsMap, setFormationsMap] = useState<Record<string, string>>({});
  const [serverHasAdmin, setServerHasAdmin] = useState<boolean | null>(supabaseConfigured ? null : false);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);

  useEffect(() => { persist(db); }, [db]);

  // Tick de vérification de la session (rafraîchit quand la session expire)
  useEffect(() => {
    if (supabaseConfigured) return;
    const t = setInterval(() => {
      setSession((cur) => {
        if (cur && cur.expiresAt <= Date.now()) {
          sessionStorage.removeItem(SESSION_KEY);
          return null;
        }
        return cur;
      });
    }, 1000 * 15);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const subscription = onAuthChange(async (_event, remoteSession) => {
      if (!remoteSession) {
        setSession(null);
        setAuthReady(true);
        return;
      }
      try {
        const profile = await getCurrentProfile();
        if (profile) {
          const now = Date.now();
          setSession({ userId: profile.id, issuedAt: now, expiresAt: (remoteSession.expires_at ?? Math.floor(now / 1000) + SESSION_TTL_S) * 1000 });
          setDb((current) => {
            const mirrored: User = { id: profile.id, username: profile.username, password: "", role: profile.role, name: profile.name, email: profile.email ?? undefined, phone: profile.phone ?? undefined, createdAt: profile.created_at.slice(0, 10), actif: profile.active };
            return { ...current, users: current.users.some((u) => u.id === profile.id) ? current.users.map((u) => u.id === profile.id ? { ...u, ...mirrored } : u) : [mirrored, ...current.users] };
          });
        }
      } finally {
        setAuthReady(true);
      }
    });
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  // The bootstrap decision must come from PostgreSQL, not another browser's localStorage.
  useEffect(() => {
    if (!supabaseConfigured) return;
    hasAnySuperadmin()
      .then(setServerHasAdmin)
      // Fail closed: an unknown server state must never expose bootstrap publicly.
      .catch(() => setServerHasAdmin(true));
  }, []);

  // Progressive hydration: Supabase is the source of truth for identity and
  // core catalogue, while legacy pages continue to consume the existing DB shape.
  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    const hydrate = async () => {
      try {
        const client = requireSupabase();
        const [{ data: catalogue, error: catalogueError }, { data: remoteSession }, { data: formRows, error: formError }, publicContent, eniaContent] = await Promise.all([
          client.from("modules").select("*, formations(code,name,description), chapters(*), module_notions(*)").order("numero"),
          client.auth.getSession(),
          client.from("formations").select("id, code"),
          loadPublicContent(),
          mapEniaContent(seedDB().settings.enia),
        ]);
        if (catalogueError) throw catalogueError;
        if (formError) throw formError;
        if (cancelled) return;

        const map: Record<string, string> = {};
        (formRows ?? []).forEach((r: any) => { map[r.code] = r.id; });
        setFormationsMap(map);

        setDb((current) => ({
          ...current,
          settings: { ...mapPublicContent(current.settings, publicContent), enia: eniaContent.enia, partenaires: eniaContent.partners.length ? eniaContent.partners : mapPublicContent(current.settings, publicContent).partenaires },
          modules: (catalogue ?? []).map((row: any) => ({
            id: row.id,
            formation: row.formations?.code === "industriel" ? "industriel" : "informatique",
            numero: row.numero,
            titre: row.titre,
            icon: row.icon || "book-open",
            notions: (row.module_notions ?? []).map((item: any) => item.notion),
            description: row.description || "",
            objectifs: row.objectifs ?? [],
            programme: row.programme || "",
            chapitres: (row.chapters ?? []).sort((a: any, b: any) => a.ordre - b.ordre).map((chapter: any) => ({ id: chapter.id, titre: chapter.titre, description: chapter.description })),
            duree: row.duree || "",
            image: row.image_path || "",
            extra: row.extra || "",
          })),
        }));

        if (!remoteSession.session) return;
        const profile = await getCurrentProfile();
        if (!profile || cancelled) return;
        const snapshot = await loadRoleSnapshot(profile.role);
        let linkedId: string | undefined;
        let remoteStudent: any = null;
        let remoteTeacher: any = null;
        if (profile.role === "student") {
          const { data } = await client.from("students").select("*, formations(code), student_modules(module_id)").eq("user_id", profile.id).maybeSingle();
          remoteStudent = data;
          linkedId = data?.id;
        } else if (profile.role === "teacher") {
          const { data } = await client.from("teachers").select("*, teacher_modules(module_id)").eq("user_id", profile.id).maybeSingle();
          remoteTeacher = data;
          linkedId = data?.id;
        }
        const mirroredUser: User = { id: profile.id, username: profile.username, password: "", role: profile.role, name: profile.name, email: profile.email ?? undefined, phone: profile.phone ?? undefined, linkedId, createdAt: profile.created_at.slice(0, 10), actif: profile.active };
        setDb((current) => {
          const snapshotUsers = snapshot.users ?? current.users;
          const snapshotStudents = snapshot.students ?? current.students;
          const snapshotTeachers = snapshot.teachers ?? current.teachers;
          return ({
          ...current,
          ...snapshot,
          users: snapshotUsers.some((item) => item.id === profile.id) ? snapshotUsers.map((item) => item.id === profile.id ? { ...item, ...mirroredUser } : item) : [mirroredUser, ...snapshotUsers],
          students: remoteStudent ? [
            {
              id: remoteStudent.id, userId: profile.id, nom: remoteStudent.nom, prenom: remoteStudent.prenom,
              dateNaissance: remoteStudent.date_naissance || "", sexe: remoteStudent.sexe === "F" ? "F" : "M",
              telephone: remoteStudent.telephone || "", whatsapp: remoteStudent.whatsapp || "", email: remoteStudent.email || "",
              adresse: remoteStudent.adresse || "", niveau: remoteStudent.niveau || "",
              formation: remoteStudent.formations?.code === "industriel" ? "industriel" : "informatique",
              modules: (remoteStudent.student_modules ?? []).map((item: any) => item.module_id), photo: remoteStudent.photo_path || "",
              dateInscription: remoteStudent.date_inscription, statutPaiement: "impaye", statut: remoteStudent.statut === "inactif" ? "inactif" : "actif",
            },
            ...snapshotStudents.filter((item) => item.userId !== profile.id),
          ] : snapshotStudents,
          teachers: remoteTeacher ? [
            {
              id: remoteTeacher.id, userId: profile.id, nom: remoteTeacher.nom, prenom: remoteTeacher.prenom,
              specialite: remoteTeacher.specialite || "", email: remoteTeacher.email || "", phone: remoteTeacher.phone || "",
              modules: (remoteTeacher.teacher_modules ?? []).map((item: any) => item.module_id), photo: remoteTeacher.photo_path || "",
              infos: remoteTeacher.infos_pro || "",
            },
            ...snapshotTeachers.filter((item) => item.userId !== profile.id),
          ] : snapshotTeachers,
        });});
        const now = Date.now();
        setSession({ userId: profile.id, issuedAt: now, expiresAt: (remoteSession.session.expires_at ?? Math.floor(now / 1000) + SESSION_TTL_S) * 1000 });
      } catch (error) {
        console.error("Hydratation Supabase impossible:", error);
      } finally {
        setAuthReady(true);
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, []);

  const user = useMemo(() => {
    if (!session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }, [session, db.users]);

  const update = (fn: (d: DB) => DB) => setDb((prev) => fn(prev));

  const login: StoreCtxType["login"] = async (username, password, role) => {
    if (supabaseConfigured) {
      try {
        const { session: remoteSession, profile } = await supabaseSignIn(username, password);
        const allowed = role === "superadmin"
          ? ["superadmin", "admin"]
          : role === "partner"
            ? ["partner", "partner_admin"]
            : role ? [role] : null;
        if (allowed && !allowed.includes(profile.role)) return { ok: false, error: "Ce compte n'appartient pas à l'espace sélectionné." };
        const now = Date.now();
        const sess: SessionData = { userId: profile.id, issuedAt: now, expiresAt: (remoteSession.expires_at ?? Math.floor(now / 1000) + SESSION_TTL_S) * 1000 };
        resetLock();
        setSession(sess);
        // Mirror only the non-sensitive profile locally so existing screens can resolve the session during migration.
        setDb((current) => {
          const localUser: User = {
            id: profile.id,
            username: profile.username,
            password: "",
            role: profile.role,
            name: profile.name,
            email: profile.email ?? undefined,
            phone: profile.phone ?? undefined,
            createdAt: profile.created_at.slice(0, 10),
            actif: profile.active,
          };
          const exists = current.users.some((item) => item.id === localUser.id);
          return { ...current, users: exists ? current.users.map((item) => item.id === localUser.id ? { ...item, ...localUser } : item) : [localUser, ...current.users] };
        });
        return { ok: true, mustChangePassword: profile.must_change_password === true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Identifiants incorrects." };
      }
    }
    return { ok: false, error: "Supabase n'est pas configuré. Renseignez les variables VITE_SUPABASE_* avant de vous connecter." };
  };

  const logout: StoreCtxType["logout"] = () => {
    if (supabaseConfigured) void supabaseSignOut();
    sessionStorage.removeItem(SESSION_KEY);
    // Nettoyage complet des données sensibles en session
    Object.keys(sessionStorage).filter((k) => k.startsWith("sn_")).forEach((k) => sessionStorage.removeItem(k));
    setSession(null);
    // Forcer un rechargement d'état : l'app étant un SPA sans backend persistant côté serveur,
    // on nettoie aussi toute donnée temporaire de formulaire
  };

  const adminCheckReady = !supabaseConfigured || serverHasAdmin !== null;
  const hasAnyAdmin = supabaseConfigured
    ? serverHasAdmin === true
    : db.users.some((u) => u.role === "superadmin" || u.role === "admin");

  const nextStudentId = () => {
    const year = new Date().getFullYear();
    const max = db.students.reduce((acc, s) => {
      const m = s.id.match(/SN-(\d{4})-(\d+)/);
      if (m && m[1] === String(year)) return Math.max(acc, parseInt(m[2], 10));
      return acc;
    }, 0);
    return `SN-${year}-${String(max + 1).padStart(5, "0")}`;
  };

  const nextCertNumber = () => `SN-CERT-${new Date().getFullYear()}-${String(db.certificates.length + 1).padStart(4, "0")}`;

  const notify = (toId: string, title: string, body: string, type = "info") => {
    const n: Notification = {
      id: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toId, title, body,
      date: new Date().toISOString().slice(0, 10), lu: false, type,
    };
    update((d) => ({ ...d, notifications: [n, ...d.notifications] }));
  };

  const log = (action: string) => {
    update((d) => ({
      ...d,
      log: [
        { id: `LOG-${Date.now()}`, date: new Date().toISOString().slice(0, 10), user: user?.name ?? "Système", action },
        ...d.log,
      ].slice(0, 200),
    }));
  };

  const modulesOf = (f: Formation) => db.modules.filter((m) => m.formation === f);
  const userName = (id: string) => {
    if (id === "all_students") return "Tous les apprenants";
    if (id === "all_teachers") return "Tous les enseignants";
    return db.users.find((u) => u.id === id)?.name ?? "Système";
  };
  const studentOf = (userId: string) => db.students.find((s) => s.userId === userId);
  const teacherOf = (userId: string) => db.teachers.find((t) => t.userId === userId);

  const getFormationId = (code: "informatique" | "industriel") => formationsMap[code];

  const value = useMemo<StoreCtxType>(
    () => ({ db, user, formationsMap, getFormationId, login, logout, hasAnyAdmin, adminCheckReady, authReady, update, nextStudentId, nextCertNumber, notify, log, modulesOf, userName, studentOf, teacherOf }),
    [db, user, formationsMap, hasAnyAdmin, adminCheckReady, authReady]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

// Clés partagées avec src/lib/auth (prefix sn_)
export const LOCK_KEY = "sn_lock";
export const ATT_KEY = "sn_att";
