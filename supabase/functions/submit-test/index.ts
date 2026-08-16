import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return reply({ error: "Authentification requise." }, 401);
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return reply({ error: "Session invalide." }, 401);
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: activeProfile } = await service.from("profiles").select("active").eq("id", user.id).single();
    if (!activeProfile?.active) return reply({ error: "Compte désactivé." }, 403);
    const { testId, answers } = await request.json();
    const { data: student } = await service.from("students").select("id").eq("user_id", user.id).eq("statut", "actif").single();
    if (!student) return reply({ error: "Profil apprenant requis." }, 403);
    const { data: test } = await service.from("tests").select("*, questions(*)").eq("id", testId).eq("publie", true).single();
    if (!test) return reply({ error: "Test indisponible." }, 404);
    const { data: enrollment } = await service.from("student_modules").select("module_id").eq("student_id", student.id).eq("module_id", test.module_id).eq("active", true).maybeSingle();
    if (!enrollment) return reply({ error: "Ce test ne vous est pas attribué." }, 403);
    if (test.date_debut && new Date(test.date_debut) > new Date()) return reply({ error: "Le test n'a pas encore commencé." }, 409);
    if (test.date_fin && new Date(test.date_fin) < new Date()) return reply({ error: "Le test est terminé." }, 409);
    const { count } = await service.from("test_results").select("id", { count: "exact", head: true }).eq("test_id", test.id).eq("student_id", student.id);
    if ((count || 0) >= test.tentatives_max) return reply({ error: "Nombre maximal de tentatives atteint." }, 409);

    let obtained = 0;
    let total = 0;
    const rows = test.questions.map((question: any) => {
      total += Number(question.points);
      const answer = String(answers?.[question.id] ?? "").trim();
      const correct = answer.localeCompare(String(question.bonne_reponse).trim(), undefined, { sensitivity: "accent" }) === 0;
      const points = correct ? Number(question.points) : 0;
      obtained += points;
      return { question_id: question.id, reponse: answer, correct, points_obtenus: points };
    });
    const percentage = total > 0 ? Math.round((obtained / total) * 10000) / 100 : 0;
    const note = Math.round((percentage / 5) * 100) / 100;
    const { data: result, error } = await service.from("test_results").insert({ test_id: test.id, student_id: student.id, note, pourcentage: percentage, reussi: note >= 10, valide: !test.validation_requise }).select().single();
    if (error) throw error;
    const { error: answerError } = await service.from("test_answers").insert(rows.map((row: any) => ({ ...row, result_id: result.id })));
    if (answerError) throw answerError;
    await service.from("audit_logs").insert({ user_id: user.id, action: "SUBMIT_TEST", entity_type: "test_result", entity_id: result.id, description: `Soumission du test ${test.titre}` });
    const correction = test.corrections === "immediat" ? test.questions.map((question: any) => ({ questionId: question.id, bonneReponse: question.bonne_reponse, explication: question.explication })) : undefined;
    return reply({ id: result.id, note, pourcentage: percentage, reussi: note >= 10, valide: result.valide, correction });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "Erreur de correction." }, 500);
  }
});