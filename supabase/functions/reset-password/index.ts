import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const strong = (password: string) =>
  password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return respond({ error: "Session administrateur requise." }, 401);

    const publicClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: { user: actor } } = await publicClient.auth.getUser();
    if (!actor) return respond({ error: "Session invalide." }, 401);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: actorProfile } = await service.from("profiles").select("role,active").eq("id", actor.id).single();
    if (!actorProfile?.active || !["superadmin", "admin"].includes(actorProfile.role)) return respond({ error: "Permission insuffisante." }, 403);

    const { userId, password } = await request.json();
    if (!userId || !strong(String(password || ""))) return respond({ error: "Mot de passe fort requis." }, 400);
    if (userId === actor.id) return respond({ error: "Utilisez la page Sécurité pour changer votre propre mot de passe." }, 400);

    const { data: target } = await service.from("profiles").select("role,username").eq("id", userId).single();
    if (!target) return respond({ error: "Utilisateur introuvable." }, 404);
    if (target.role === "superadmin") return respond({ error: "Impossible de réinitialiser un Super Admin depuis cette action." }, 403);
    if (target.role === "admin" && actorProfile.role !== "superadmin") return respond({ error: "Seul le Super Admin peut réinitialiser un administrateur." }, 403);

    const { error } = await service.auth.admin.updateUserById(userId, { password: String(password) });
    if (error) throw error;
    await service.from("profiles").update({ must_change_password: true }).eq("id", userId);
    await service.from("audit_logs").insert({ user_id: actor.id, action: "PASSWORD_RESET", entity_type: "profiles", entity_id: userId, description: `Réinitialisation du mot de passe de ${target.username}` });
    return respond({ ok: true });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Erreur de réinitialisation." }, 500);
  }
});