import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { requireSupabase, supabaseConfigured } from "./client";
import type { Profile, Role } from "./types";

export async function signInWithUsername(username: string, password: string): Promise<{ session: Session; profile: Profile }> {
  const client = requireSupabase();
  const { data: loginData, error: loginError } = await client.functions.invoke("login-identifier", { body: { username, password } });
  if (loginError || loginData?.error || !loginData?.access_token || !loginData?.refresh_token) throw new Error("Identifiants incorrects.");
  const { data: sessionData, error: sessionError } = await client.auth.setSession({ access_token: loginData.access_token, refresh_token: loginData.refresh_token });
  if (sessionError || !sessionData.session || !sessionData.user) throw new Error("Identifiants incorrects.");
  const { data: profile, error: profileError } = await client.from("profiles").select("*").eq("id", sessionData.user.id).single();
  if (profileError || !profile) throw new Error("Profil utilisateur introuvable.");
  if (!profile.active) throw new Error("Ce compte est désactivé.");
  return { session: sessionData.session, profile: profile as Profile };
}
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!supabaseConfigured) return null;
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}
export async function hasAnySuperadmin(): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc("has_any_superadmin");
  if (error) throw error;
  return data === true;
}
export async function signOut() {
  if (supabaseConfigured) {
    const { error } = await requireSupabase().auth.signOut();
    if (error) throw error;
  }
}
export async function sendPasswordReset(email: string, redirectTo = `${window.location.origin}/#/connexion`) {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
export async function updatePassword(password: string) {
  const { data, error } = await requireSupabase().functions.invoke("change-password", { body: { password } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
export async function bootstrapFirstSuperadmin(name: string, username: string, password: string, email?: string) {
  const client = requireSupabase();
  const finalEmail = email && email.includes("@") ? email : `${username.toLowerCase()}@sentinelles.local`;
  const { data, error } = await client.functions.invoke("bootstrap-superadmin", {
    body: { name, username, email: finalEmail, password },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.session?.access_token || !data?.session?.refresh_token) throw new Error("Initialisation impossible.");
  const { error: sessionError } = await client.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (sessionError) throw sessionError;
  return { session: data.session as any, profile: await getCurrentProfile() };
}
export function onAuthChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  if (!supabaseConfigured) return { data: { subscription: { unsubscribe: () => undefined } } };
  return requireSupabase().auth.onAuthStateChange(callback);
}
export function isRole(profile: Profile | null, role: Role) {
  return profile?.role === role;
}
export function canManage(profile: Profile | null) {
  return profile?.role === "superadmin" || profile?.role === "admin";
}
