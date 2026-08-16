import { requireSupabase } from "./client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createPublicRegistration(payload: Record<string, unknown>, moduleIds: string[]) {
  // PostgreSQL attend un uuid[] : on écarte les identifiants locaux non migrés
  // pour éviter une erreur de cast qui ferait échouer toute la pré-inscription.
  const safeModuleIds = (moduleIds ?? []).filter((id) => typeof id === "string" && UUID_RE.test(id));

  const { data, error } = await requireSupabase().rpc("create_public_registration_guarded", {
    p_nom: payload.nom,
    p_prenom: payload.prenom,
    p_telephone: payload.telephone,
    p_whatsapp: payload.whatsapp ?? "",
    p_email: payload.email,
    p_niveau: payload.niveau ?? "",
    p_formation_code: payload.formationCode,
    p_module_ids: safeModuleIds,
  });
  if (error) throw error;
  return data as { id: string; montant_estime: number; formule: string };
}

export async function listRegistrations(filters: { status?: string; search?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  let query = requireSupabase().from("registrations").select("*, formations(code,name), registration_modules(module_id)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (filters.status) query = query.eq("statut", filters.status);
  if (filters.search) query = query.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,email.ilike.%${filters.search}%,telephone.ilike.%${filters.search}%`);
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0, page, pageSize };
}

export async function updateRegistrationStatus(id: string, status: "en_attente" | "confirmee" | "refusee") {
  const { data, error } = await requireSupabase().from("registrations").update({ statut: status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRegistration(id: string) {
  const { error } = await requireSupabase().from("registrations").delete().eq("id", id);
  if (error) throw error;
}