import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const { username, password } = await request.json();
    const identifier = String(username || "").trim().toLowerCase();
    if (identifier.length < 3 || !password) return respond({ error: "Identifiants incorrects." }, 401);
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const attemptKey = await digest(`${identifier}|${forwarded}`);
    const { data: attempt } = await service.from("auth_attempts").select("failures,locked_until").eq("attempt_key", attemptKey).maybeSingle();
    if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
      return respond({ error: "Trop de tentatives. Réessayez plus tard." }, 429);
    }

    const registerFailure = async () => {
      const failures = Number(attempt?.failures || 0) + 1;
      const seconds = failures >= 12 ? 300 : failures >= 8 ? 120 : failures >= 5 ? 30 : 0;
      await service.from("auth_attempts").upsert({ attempt_key: attemptKey, failures, locked_until: seconds ? new Date(Date.now() + seconds * 1000).toISOString() : null, last_attempt_at: new Date().toISOString() });
    };

    const { data: profile } = await service.from("profiles").select("email,active").eq("username", identifier).maybeSingle();
    if (!profile?.email || !profile.active) { await registerFailure(); return respond({ error: "Identifiants incorrects." }, 401); }
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data, error } = await anon.auth.signInWithPassword({ email: profile.email, password: String(password) });
    if (error || !data.session) { await registerFailure(); return respond({ error: "Identifiants incorrects." }, 401); }
    await service.from("auth_attempts").delete().eq("attempt_key", attemptKey);
    await service.from("audit_logs").insert({ user_id: data.user?.id || null, action: "LOGIN", entity_type: "profiles", entity_id: data.user?.id || null, description: "Connexion réussie" });
    return respond({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return respond({ error: "Identifiants incorrects." }, 401);
  }
});