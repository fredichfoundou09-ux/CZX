import { requireSupabase } from "./client";

export async function verifyCertificate(numero: string) {
  const { data, error } = await requireSupabase().rpc("verify_certificate", { p_number: numero.trim() });
  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : data;
}