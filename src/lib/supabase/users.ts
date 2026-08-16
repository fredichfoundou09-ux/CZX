import { requireSupabase } from "./client";

export interface ManagedUserInput {
  role: "admin" | "teacher" | "student" | "partner_admin" | "partner";
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  nom?: string;
  prenom?: string;
  whatsapp?: string;
  adresse?: string;
  niveau?: string;
  formationCode?: "informatique" | "industriel";
  moduleIds?: string[];
  specialite?: string;
  infos?: string;
  typeContrat?: string;
  tarifHoraire?: number;
  organizationId?: string;
  poste?: string;
  contact?: string;
  partnerScope?: "viewer" | "academic" | "finance" | "institutional";
  startDate?: string;
  endDate?: string;
}

export async function createManagedUser(input: ManagedUserInput) {
  const { data, error } = await requireSupabase().functions.invoke("create-user", { body: input });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { ok: true; userId: string; entityId?: string; warnings?: string[] };
}

export async function setAccountActive(id: string, active: boolean) {
  const { data, error } = await requireSupabase().functions.invoke("disable-user", { body: { userId: id, active } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function resetManagedPassword(userId: string, password: string) {
  const { data, error } = await requireSupabase().functions.invoke("reset-password", { body: { userId, password } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { ok: true };
}

export async function deleteManagedUser(userId: string, confirmation = "SUPPRIMER") {
  const { data, error } = await requireSupabase().functions.invoke("delete-user", { body: { userId, confirmation } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { ok: true };
}