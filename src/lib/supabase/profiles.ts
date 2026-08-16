import { requireSupabase } from "./client";
import type { Profile, Role } from "./types";

export async function listProfiles(filters: { role?: Role; active?: boolean; search?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  let query = requireSupabase().from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (filters.role) query = query.eq("role", filters.role);
  if (typeof filters.active === "boolean") query = query.eq("active", filters.active);
  if (filters.search) query = query.or(`username.ilike.%${filters.search}%,name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as Profile[], count: count ?? 0, page, pageSize };
}

export async function updateProfile(id: string, payload: Partial<Pick<Profile, "name" | "phone" | "avatar_path">>) {
  const { data, error } = await requireSupabase().from("profiles").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function hasPermission(code: string) {
  const { data, error } = await requireSupabase().rpc("has_permission", { permission_code: code });
  if (error) throw error;
  return data === true;
}