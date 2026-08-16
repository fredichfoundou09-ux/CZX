import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return respond({ error: "Session administrateur requise." }, 401);
    const publicClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user: actor } } = await publicClient.auth.getUser();
    if (!actor) return respond({ error: "Session invalide." }, 401);
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: actorProfile } = await service.from("profiles").select("role,active").eq("id", actor.id).single();
    if (!actorProfile?.active || !["superadmin", "admin"].includes(actorProfile.role)) return respond({ error: "Permission insuffisante." }, 403);
    const { userId, active } = await request.json();
    if (!userId || typeof active !== "boolean") return respond({ error: "Paramètres invalides." }, 400);
    if (userId === actor.id) return respond({ error: "Impossible de désactiver votre propre compte." }, 400);
    const { data: target } = await service.from("profiles").select("role,username").eq("id", userId).single();
    if (!target) return respond({ error: "Utilisateur introuvable." }, 404);
    if (target.role === "superadmin") return respond({ error: "Impossible de désactiver un Super Admin." }, 403);
    if (target.role === "admin" && actorProfile.role !== "superadmin") return respond({ error: "Seul le Super Admin peut gérer un administrateur." }, 403);
    const { error } = await service.from("profiles").update({ active }).eq("id", userId);
    if (error) throw error;
    await service.from("audit_logs").insert({ user_id: actor.id, action: active ? "ENABLE_USER" : "DISABLE_USER", entity_type: "profiles", entity_id: userId, description: `${active ? "Réactivation" : "Désactivation"} du compte ${target.username}` });
    return respond({ ok: true });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Erreur de changement de statut." }, 500);
  }
});