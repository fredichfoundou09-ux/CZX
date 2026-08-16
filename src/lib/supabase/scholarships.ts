import { requireSupabase } from "./client";
export async function getMyScholarship(studentId: string) { const { data, error } = await requireSupabase().from("scholarships").select("*").eq("student_id", studentId).maybeSingle(); if (error) throw error; return data; }
export async function updateScholarship(studentId: string, payload: Record<string, unknown>) { const { data, error } = await requireSupabase().from("scholarships").upsert({ student_id: studentId, ...payload }).select().single(); if (error) throw error; return data; }
