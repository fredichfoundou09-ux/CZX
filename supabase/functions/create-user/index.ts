import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

type Role = "admin" | "teacher" | "student" | "partner_admin" | "partner";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function passwordStrong(password: string) {
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  let createdAuthId: string | null = null;
  let createdEntityId: string | null = null;
  let createdRole: Role | null = null;
  const warnings: string[] = [];
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return response({ error: "Session administrateur requise." }, 401);
    const publicClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user: actor } } = await publicClient.auth.getUser();
    if (!actor) return response({ error: "Session invalide." }, 401);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: actorProfile } = await service.from("profiles").select("role,active").eq("id", actor.id).single();
    if (!actorProfile?.active || (actorProfile.role !== "superadmin" && actorProfile.role !== "admin")) return response({ error: "Permission insuffisante." }, 403);

    const body = await request.json();
    const role = String(body.role || "student") as Role;
    if (!["admin", "teacher", "student", "partner_admin", "partner"].includes(role)) return response({ error: "Rôle invalide." }, 400);
    if (role === "admin" && actorProfile.role !== "superadmin") return response({ error: "Seul le Super Admin peut créer un administrateur." }, 403);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const username = String(body.username || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    if (!email || !username || !name || !passwordStrong(password)) return response({ error: "Nom, email, identifiant et mot de passe fort sont requis." }, 400);

    const { data: existing } = await service.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existing) return response({ error: "Cet identifiant existe déjà." }, 409);

    const { data: authUser, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username },
      app_metadata: { provisioned_by: actor.id },
    });
    if (authError || !authUser.user) return response({ error: authError?.message || "Impossible de créer le compte Auth." }, 400);
    createdAuthId = authUser.user.id;

    const { error: profileError } = await service.from("profiles").update({
      username,
      name,
      email,
      phone: body.phone || null,
      role,
      active: true,
      must_change_password: true,
    }).eq("id", createdAuthId);
    if (profileError) throw profileError;

    if (role === "student") {
      const formationCode = String(body.formationCode || "");
      const { data: formation } = await service.from("formations").select("id").eq("code", formationCode).single();
      if (!formation) throw new Error("Formation inconnue. Créez ou configurez la formation avant l'inscription.");
      const { data: generatedId, error: idError } = await service.rpc("generate_student_id");
      if (idError || !generatedId) throw idError || new Error("Impossible de générer le matricule.");
      const studentId = String(generatedId);
      const { error } = await service.from("students").insert({ id: studentId, user_id: createdAuthId, formation_id: formation.id, nom: body.nom || "", prenom: body.prenom || name, telephone: body.phone || "", whatsapp: body.whatsapp || "", email, adresse: body.adresse || "", niveau: body.niveau || "", statut: "actif" });
      if (error) throw error;
      createdEntityId = studentId;
      createdRole = "student";
      const requestedModules = Array.isArray(body.moduleIds) ? body.moduleIds : [];
      const moduleIds = requestedModules.filter((id: unknown) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (moduleIds.length !== requestedModules.length) warnings.push("Certains modules locaux n'ont pas encore été migrés vers Supabase et n'ont pas été associés.");
      if (moduleIds.length) { const { error: modulesError } = await service.from("student_modules").insert(moduleIds.map((module_id: string) => ({ student_id: studentId, module_id }))); if (modulesError) throw modulesError; }
    }

    if (role === "teacher") {
      const { data: teacher, error } = await service.from("teachers").insert({ user_id: createdAuthId, nom: body.nom || name, prenom: body.prenom || name, specialite: body.specialite || "", email, phone: body.phone || "", infos_pro: body.infos || "", type_contrat: body.typeContrat || "Vacataire", tarif_horaire: body.tarifHoraire || 0 }).select("id").single();
      if (error || !teacher) throw error || new Error("Fiche formateur impossible à créer.");
      createdEntityId = teacher.id;
      createdRole = "teacher";
      const requestedModules = Array.isArray(body.moduleIds) ? body.moduleIds : [];
      const moduleIds = requestedModules.filter((id: unknown) => typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (moduleIds.length !== requestedModules.length) warnings.push("Certains modules locaux n'ont pas encore été migrés vers Supabase et n'ont pas été associés.");
      if (moduleIds.length) { const { error: modulesError } = await service.from("teacher_modules").insert(moduleIds.map((module_id: string) => ({ teacher_id: teacher.id, module_id }))); if (modulesError) throw modulesError; }
    }

    if (role === "partner" || role === "partner_admin") {
      const organizationId = String(body.organizationId || "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)) throw new Error("Une organisation partenaire valide est obligatoire.");
      const { data: organization } = await service.from("partners_organizations").select("id").eq("id", organizationId).eq("actif", true).maybeSingle();
      if (!organization) throw new Error("Organisation partenaire inactive ou introuvable.");
      const scope = ["viewer", "academic", "finance", "institutional"].includes(String(body.partnerScope)) ? String(body.partnerScope) : "viewer";
      const { error } = await service.from("partner_users").insert({
        user_id: createdAuthId,
        organization_id: organizationId,
        poste: String(body.poste || "Représentant").slice(0, 150),
        contact: String(body.contact || "").slice(0, 255),
        scope,
        statut: "actif",
        date_debut: body.startDate || new Date().toISOString().slice(0, 10),
        date_fin: body.endDate || null,
      });
      if (error) throw error;
    }

    await service.from("audit_logs").insert({ user_id: actor.id, action: "CREATE_USER", entity_type: "profile", entity_id: createdAuthId, description: `Création d'un compte ${role}: ${username}` });
    return response({ ok: true, userId: createdAuthId, entityId: createdEntityId, warnings });
  } catch (error) {
    if (createdAuthId) {
      const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      if (createdEntityId && createdRole === "student") await service.from("students").delete().eq("id", createdEntityId);
      if (createdEntityId && createdRole === "teacher") await service.from("teachers").delete().eq("id", createdEntityId);
      await service.auth.admin.deleteUser(createdAuthId);
    }
    return response({ error: error instanceof Error ? error.message : "Erreur de création du compte." }, 500);
  }
});