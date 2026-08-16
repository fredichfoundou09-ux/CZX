import { requireSupabase } from "./client";

export async function listFeeSettings(formationId?: string) {
  let query = requireSupabase().from("fee_settings").select("*").eq("active", true).order("module_count");
  if (formationId) query = query.eq("formation_id", formationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveFeeSetting(payload: Record<string, unknown>) {
  const { data, error } = await requireSupabase().from("fee_settings").upsert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function studentFinanceSummary(studentId: string) {
  const { data, error } = await requireSupabase().from("student_financial_summary").select("*").eq("student_id", studentId).single();
  if (error) throw error;
  return data;
}

export async function teacherPayrollSummary(teacherId: string) {
  const { data, error } = await requireSupabase().from("teacher_payroll_summary").select("*").eq("teacher_id", teacherId).single();
  if (error) throw error;
  return data;
}