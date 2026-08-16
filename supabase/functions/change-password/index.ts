import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const strong = (password: string) => password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return respond({ error: "Session requise." }, 401);
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return respond({ error: "Session invalide." }, 401);
    const { password } = await request.json();
    if (!strong(String(password || ""))) return respond({ error: "Le mot de passe ne respecte pas la politique de sécurité." }, 400);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await service.from("profiles").select("active").eq("id", user.id).single();
    if (!profile?.active) return respond({ error: "Compte désactivé." }, 403);
    const { error } = await service.auth.admin.updateUserById(user.id, { password: String(password) });
    if (error) throw error;
    await service.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    await service.from("audit_logs").insert({ user_id: user.id, action: "PASSWORD_CHANGE", entity_type: "profiles", entity_id: user.id, description: "Mot de passe modifié par l'utilisateur." });
    return respond({ ok: true });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Erreur de changement du mot de passe." }, 500);
  }
});