import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const strong = (password: string) =>
  password.length >= 12 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  let createdUserId: string | null = null;
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    let email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const setupCode = String(body.setupCode || body.code || "").trim();

    if (!email || !email.includes("@")) {
      email = `${username}@sentinelles.local`;
    }

    // Le code d'installation n'est exigé que si BOOTSTRAP_SECRET est défini côté serveur.
    const expectedCode = Deno.env.get("BOOTSTRAP_SECRET");
    if (expectedCode && expectedCode.length > 0) {
      if (!setupCode || setupCode !== expectedCode) {
        return respond({ error: "Code d'installation invalide." }, 403);
      }
    }

    if (!name || username.length < 3 || !email.includes("@") || !strong(password)) {
      return respond({ error: "Données de bootstrap invalides. Vérifiez le nom, l'identifiant et la complexité du mot de passe." }, 400);
    }

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: already, error: checkError } = await service.rpc("has_any_superadmin");
    if (checkError) throw checkError;
    if (already === true) return respond({ error: "Un Admin Sup existe déjà. Plateforme déjà initialisée." }, 409);

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username },
      app_metadata: { bootstrap: true },
    });
    if (createError || !created.user) throw createError || new Error("Création Auth impossible.");
    createdUserId = created.user.id;

    const { data: promoted, error: promoteError } = await service.rpc("bootstrap_superadmin", { p_user_id: createdUserId });
    if (promoteError || promoted !== true) throw promoteError || new Error("Le système est déjà initialisé.");

    const { error: profileError } = await service.from("profiles").update({
      username,
      name,
      email,
      active: true,
      must_change_password: false,
    }).eq("id", createdUserId);
    if (profileError) throw profileError;

    await service.from("audit_logs").insert({
      user_id: createdUserId,
      action: "BOOTSTRAP_SUPERADMIN",
      entity_type: "profiles",
      entity_id: createdUserId,
      description: "Premier Administrateur Supérieur créé via procédure sécurisée.",
    });

    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: signed, error: signError } = await anon.auth.signInWithPassword({ email, password });
    if (signError || !signed.session) throw signError || new Error("Session initiale impossible.");

    return respond({ ok: true, session: signed.session });
  } catch (error) {
    if (createdUserId) {
      try {
        const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await service.auth.admin.deleteUser(createdUserId);
      } catch {
        // ignore rollback error
      }
    }
    return respond({ error: error instanceof Error ? error.message : "Erreur bootstrap." }, 500);
  }
});