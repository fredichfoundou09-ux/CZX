import { requireSupabase } from "./client";
import type { DB, Formation, ScholarshipStatus } from "@/lib/types";
import type { AppRole } from "@/types/rbac";

async function queryRows(query: PromiseLike<{ data: any; error: any }>) {
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

const formationCode = (row: any): Formation => row?.formations?.code === "industriel" ? "industriel" : "informatique";

/** Loads only rows authorized by RLS and maps them into the transitional UI shape. */
export async function loadRoleSnapshot(role: AppRole): Promise<Partial<DB>> {
  const client = requireSupabase();
  const admin = role === "admin" || role === "superadmin";

  const [profiles, students, teachers, registrations, courses, schedule, attendance, payments, tests, results, grades, notifications, certificates, scholarships, audit] = await Promise.all([
    admin ? queryRows(client.from("profiles").select("id,username,name,email,phone,role,active,created_at")) : Promise.resolve([]),
    queryRows(client.from("students").select("*, formations(code), student_modules(module_id)")),
    queryRows(client.from("teachers").select("*, teacher_modules(module_id)")),
    admin ? queryRows(client.from("registrations").select("*, formations(code), registration_modules(module_id)")) : Promise.resolve([]),
    queryRows(client.from("courses").select("*")),
    queryRows(client.from("schedule").select("*, formations(code)")),
    queryRows(client.from("attendance").select("*")),
    queryRows(client.from("payments").select("*")),
    queryRows(client.from("tests").select("*, chapters(titre), questions(*, question_options(option_text, ordre))")),
    queryRows(client.from("test_results").select("*, test_answers(question_id,reponse)")),
    queryRows(client.from("grades").select("*")),
    queryRows(client.from("notifications").select("*")),
    queryRows(client.from("certificates").select("*, formations(code), certificate_modules(module_id)")),
    queryRows(client.from("scholarships").select("*")),
    admin ? queryRows(client.from("audit_logs").select("*, profiles(name)").order("created_at", { ascending: false }).limit(200)) : Promise.resolve([]),
  ]);

  const linked = new Map<string, string>();
  students.forEach((s: any) => { if (s.user_id) linked.set(s.user_id, s.id); });
  teachers.forEach((t: any) => { if (t.user_id) linked.set(t.user_id, t.id); });

  return {
    users: profiles.map((p: any) => ({ id: p.id, username: p.username, password: "", role: p.role, name: p.name, email: p.email || undefined, phone: p.phone || undefined, linkedId: linked.get(p.id), createdAt: p.created_at?.slice(0, 10) || "", actif: p.active })),
    students: students.map((s: any) => ({ id: s.id, userId: s.user_id || undefined, nom: s.nom, prenom: s.prenom, dateNaissance: s.date_naissance || "", sexe: s.sexe === "F" ? "F" : "M", telephone: s.telephone || "", whatsapp: s.whatsapp || "", email: s.email || "", adresse: s.adresse || "", niveau: s.niveau || "", formation: formationCode(s), modules: (s.student_modules ?? []).map((x: any) => x.module_id), photo: s.photo_path || "", dateInscription: s.date_inscription || "", statutPaiement: "impaye", statut: s.statut === "inactif" ? "inactif" : "actif" })),
    teachers: teachers.map((t: any) => ({ id: t.id, userId: t.user_id || undefined, nom: t.nom, prenom: t.prenom, specialite: t.specialite || "", email: t.email || "", phone: t.phone || "", modules: (t.teacher_modules ?? []).map((x: any) => x.module_id), photo: t.photo_path || "", infos: t.infos_pro || "" })),
    registrations: registrations.map((r: any) => ({ id: r.id, nom: r.nom, prenom: r.prenom, telephone: r.telephone, whatsapp: r.whatsapp || "", email: r.email, niveau: r.niveau || "", formation: formationCode(r), modules: (r.registration_modules ?? []).map((x: any) => x.module_id), montantEstime: Number(r.montant_estime || 0), formule: r.formule || "", date: r.created_at?.slice(0, 10) || "", statut: r.statut })),
    courses: courses.map((c: any) => ({ id: c.id, titre: c.titre, description: c.description || "", moduleId: c.module_id, teacherId: c.teacher_id, type: c.type, content: c.content || "", date: (c.date_publication || c.created_at || "").slice(0, 10) })),
    schedule: schedule.map((s: any) => ({ id: s.id, jour: s.jour, heureDebut: String(s.heure_debut || "").slice(0, 5), heureFin: String(s.heure_fin || "").slice(0, 5), moduleId: s.module_id, teacherId: s.teacher_id, salle: s.salle || "", formation: formationCode(s) })),
    attendance: attendance.map((a: any) => ({ id: a.id, studentId: a.student_id, date: a.date, moduleId: a.module_id, statut: a.statut, heure: String(a.heure || "").slice(0, 5), salle: a.salle || "", teacherId: a.teacher_id })),
    payments: payments.map((p: any) => ({ id: p.id, studentId: p.student_id, type: p.type, libelle: p.libelle, montant: Number(p.montant), date: p.date, mode: p.mode, statut: "paye", reste: 0 })),
    tests: tests.map((t: any) => ({ id: t.id, titre: t.titre, moduleId: t.module_id, chapitre: t.chapters?.titre, teacherId: t.teacher_id, questions: (t.questions ?? []).map((q: any) => ({ id: q.id, question: q.question, type: q.type, options: (q.question_options ?? []).sort((a: any, b: any) => a.ordre - b.ordre).map((o: any) => o.option_text), bonneReponse: q.bonne_reponse || "", points: Number(q.points), explication: q.explication || "" })), date: t.created_at?.slice(0, 10) || "", duree: t.duree, dateDebut: t.date_debut, dateFin: t.date_fin, niveau: t.niveau, tentativesMax: t.tentatives_max, corrections: t.corrections })),
    results: results.map((r: any) => ({ id: r.id, testId: r.test_id, studentId: r.student_id, note: Number(r.note), pourcentage: Number(r.pourcentage), date: r.created_at?.slice(0, 10) || "", answers: Object.fromEntries((r.test_answers ?? []).map((a: any) => [a.question_id, a.reponse])), reussi: r.reussi, valide: r.valide })),
    grades: grades.map((g: any) => ({ id: g.id, studentId: g.student_id, moduleId: g.module_id, note: Number(g.note), appreciation: g.appreciation || "", date: g.date })),
    notifications: notifications.map((n: any) => ({ id: n.id, toId: n.user_id || "all", title: n.title, body: n.body, date: n.created_at?.slice(0, 10) || "", lu: n.read, type: n.type })),
    certificates: certificates.map((c: any) => ({ id: c.id, studentId: c.student_id, numero: c.numero, formation: formationCode(c), modules: (c.certificate_modules ?? []).map((x: any) => x.module_id), periode: c.periode, resultat: c.resultat, note: Number(c.note), date: c.date })),
    scholarships: scholarships.map((s: any) => ({ id: s.id, studentId: s.student_id, statut: s.statut as ScholarshipStatus, date: s.date })),
    log: audit.map((l: any) => ({ id: l.id, date: l.created_at?.slice(0, 10) || "", user: l.profiles?.name || "Système", action: `${l.action} — ${l.description}` })),
  };
}