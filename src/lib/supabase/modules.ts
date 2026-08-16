import { requireSupabase } from "./client";
import type { ModuleRow } from "./types";
import { uploadSecure } from "./storage";

export async function listModules(filters: { formationId?: string; active?: boolean; search?: string } = {}) {
  let query = requireSupabase().from("modules").select("*, formations(code, name), chapters(*), module_notions(*)").order("numero");
  if (filters.formationId) query = query.eq("formation_id", filters.formationId);
  if (typeof filters.active === "boolean") query = query.eq("active", filters.active);
  if (filters.search) query = query.ilike("titre", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function saveModule(payload: Partial<ModuleRow>, chapters: Array<{ id?: string; titre: string; description: string; ordre: number }> = [], notions: string[] = []) {
  const client = requireSupabase();
  const { data, error } = await client.from("modules").upsert(payload).select().single();
  if (error) throw error;
  if (chapters.length) {
    const { error: chapterError } = await client.from("chapters").upsert(chapters.map((chapter) => ({ ...chapter, module_id: data.id })));
    if (chapterError) throw chapterError;
  }
  const { error: clearError } = await client.from("module_notions").delete().eq("module_id", data.id);
  if (clearError) throw clearError;
  if (notions.length) {
    const { error: notionError } = await client.from("module_notions").insert(notions.map((notion) => ({ module_id: data.id, notion })));
    if (notionError) throw notionError;
  }
  return data as ModuleRow;
}

export async function deleteModule(id: string) {
  const { error } = await requireSupabase().from("modules").delete().eq("id", id);
  if (error) throw error;
}

export async function updateModuleDetails(id: string, payload: { description: string; objectifs: string[]; programme: string; duree: string; extra: string; image: string; chapitres: Array<{ titre: string; description: string }> }) {
  const client = requireSupabase();
  let imagePath: string | null | undefined;
  if (!payload.image) imagePath = null;
  else if (payload.image.startsWith("data:")) {
    const blob = await (await fetch(payload.image)).blob();
    imagePath = await uploadSecure("public-media", `modules/${id}`, new File([blob], "module.jpg", { type: blob.type || "image/jpeg" }));
  } else if (!payload.image.startsWith("http")) imagePath = payload.image;

  const { error } = await client.from("modules").update({ description: payload.description, objectifs: payload.objectifs, programme: payload.programme, duree: payload.duree, extra: payload.extra, ...(imagePath !== undefined ? { image_path: imagePath } : {}) }).eq("id", id);
  if (error) throw error;
  const { error: clearError } = await client.from("chapters").delete().eq("module_id", id);
  if (clearError) throw clearError;
  if (payload.chapitres.length) {
    const { error: chapterError } = await client.from("chapters").insert(payload.chapitres.map((chapter, ordre) => ({ module_id: id, titre: chapter.titre, description: chapter.description, ordre })));
    if (chapterError) throw chapterError;
  }
  return imagePath;
}