import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const source = process.argv[2];
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!source || !url || !serviceKey) {
  console.error("Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-local-catalog.mjs export.json");
  process.exit(1);
}

const db = JSON.parse(await readFile(source, "utf8"));
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const formations = new Map();
for (const code of ["informatique", "industriel"]) {
  const configured = db.settings?.formations?.[code];
  const { data, error } = await supabase.from("formations").upsert({ code, name: configured?.titre || (code === "informatique" ? "Génie Informatique" : "Génie Industriel"), description: configured?.description || "", active: true }, { onConflict: "code" }).select("id").single();
  if (error) throw error;
  formations.set(code, data.id);
}

const moduleMap = new Map();
for (const module of db.modules || []) {
  const formationId = formations.get(module.formation);
  if (!formationId) continue;
  const { data, error } = await supabase.from("modules").upsert({ formation_id: formationId, numero: module.numero, titre: module.titre, icon: module.icon || "book-open", description: module.description || "", objectifs: module.objectifs || [], programme: module.programme || "", duree: module.duree || "", extra: module.extra || "", active: true }, { onConflict: "formation_id,numero" }).select("id").single();
  if (error) throw error;
  moduleMap.set(module.id, data.id);
  await supabase.from("chapters").delete().eq("module_id", data.id);
  if (module.chapitres?.length) {
    const { error: chapterError } = await supabase.from("chapters").insert(module.chapitres.map((chapter, index) => ({ module_id: data.id, titre: chapter.titre, description: chapter.description || "", ordre: index + 1 })));
    if (chapterError) throw chapterError;
  }
  await supabase.from("module_notions").delete().eq("module_id", data.id);
  if (module.notions?.length) {
    const { error: notionError } = await supabase.from("module_notions").insert(module.notions.map((notion) => ({ module_id: data.id, notion })));
    if (notionError) throw notionError;
  }
}

console.log(`Import terminé : ${moduleMap.size} modules. Aucun utilisateur, mot de passe ou token n'a été importé.`);