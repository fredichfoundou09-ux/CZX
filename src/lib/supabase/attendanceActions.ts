import { requireSupabase } from "./client";

export async function recordAttendance(payload: { scheduleId: string; date: string; salle: string; records: Array<{ studentId: string; statut: "present" | "absent" | "retard"; heure?: string }> }) {
  const { data, error } = await requireSupabase().functions.invoke("record-attendance", { body: payload });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.records ?? [];
}