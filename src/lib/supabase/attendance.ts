import { requireSupabase } from "./client";

export async function listAttendance(filters: { studentId?: string; moduleId?: string; date?: string } = {}) {
  let query = requireSupabase().from("attendance").select("*, modules(titre), teachers(prenom, nom), schedule(jour, heure_debut, heure_fin)").order("date", { ascending: false });
  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.moduleId) query = query.eq("module_id", filters.moduleId);
  if (filters.date) query = query.eq("date", filters.date);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveAttendance(rows: Array<Record<string, unknown>>) {
  const { data, error } = await requireSupabase().from("attendance").upsert(rows, { onConflict: "student_id,schedule_id,date" }).select();
  if (error) throw error;
  return data ?? [];
}
