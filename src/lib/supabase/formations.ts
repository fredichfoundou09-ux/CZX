import { requireSupabase } from "./client";
import type { FormationRow, ModuleRow } from "./types";

export async function listFormations() {
  const { data, error } = await requireSupabase().from("formations").select("*").eq("active", true).order("name");
  if (error) throw error;
  return (data ?? []) as FormationRow[];
}

export async function listFormationModules(formationId: string) {
  const { data, error } = await requireSupabase().from("modules").select("*").eq("formation_id", formationId).eq("active", true).order("numero");
  if (error) throw error;
  return (data ?? []) as ModuleRow[];
}

export async function getModuleWithChapters(moduleId: string) {
  const [{ data: module, error: moduleError }, { data: chapters, error: chapterError }] = await Promise.all([
    requireSupabase().from("modules").select("*").eq("id", moduleId).single(),
    requireSupabase().from("chapters").select("*").eq("module_id", moduleId).order("ordre"),
  ]);
  if (moduleError) throw moduleError;
  if (chapterError) throw chapterError;
  return { module: module as ModuleRow, chapters: chapters ?? [] };
}

export async function upsertFormation(payload: Partial<FormationRow>) {
  const { data, error } = await requireSupabase().from("formations").upsert(payload).select().single();
  if (error) throw error;
  return data as FormationRow;
}
