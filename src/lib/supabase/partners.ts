import { requireSupabase } from "./client";

export interface PartnerOrganizationRow {
  id: string;
  nom: string;
  description: string;
  site: string;
  telephone: string;
  email: string;
  actif: boolean;
}

export async function listPartnerOrganizations(activeOnly = true) {
  let query = requireSupabase().from("partners_organizations").select("id,nom,description,site,telephone,email,actif").order("nom");
  if (activeOnly) query = query.eq("actif", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PartnerOrganizationRow[];
}

export async function createPartnerOrganization(nom: string) {
  const { data, error } = await requireSupabase().from("partners_organizations").insert({ nom: nom.trim(), actif: true }).select("id,nom,description,site,telephone,email,actif").single();
  if (error) throw error;
  return data as PartnerOrganizationRow;
}

export async function setOrganizationFormations(organizationId: string, formationIds: string[]) {
  const client = requireSupabase();
  const { error: clearError } = await client.from("partner_organization_formations").delete().eq("organization_id", organizationId);
  if (clearError) throw clearError;
  if (!formationIds.length) return;
  const { error } = await client.from("partner_organization_formations").insert(formationIds.map((formation_id) => ({ organization_id: organizationId, formation_id })));
  if (error) throw error;
}