import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json" };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return respond({ error: "Session requise." }, 401);
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return respond({ error: "Session invalide." }, 401);
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await service.from("profiles").select("role,active").eq("id", user.id).single();
    if (!profile?.active || !["superadmin", "admin", "teacher"].includes(profile.role)) return respond({ error: "Permission insuffisante." }, 403);

    const { scheduleId, date, salle, records } = await request.json();
    if (!scheduleId || !/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || !Array.isArray(records) || !records.length) return respond({ error: "Données de présence invalides." }, 400);
    const { data: schedule } = await service.from("schedule").select("id,module_id,teacher_id,salle").eq("id", scheduleId).single();
    if (!schedule) return respond({ error: "Séance introuvable." }, 404);
    if (profile.role === "teacher") {
      const { data: teacher } = await service.from("teachers").select("id").eq("user_id", user.id).single();
      if (!teacher || teacher.id !== schedule.teacher_id) return respond({ error: "Cette séance ne vous est pas attribuée." }, 403);
    }

    const statuses = new Set(["present", "absent", "retard"]);
    const rows = records.filter((r: any) => r.studentId && statuses.has(r.statut)).map((r: any) => ({ student_id: r.studentId, schedule_id: schedule.id, module_id: schedule.module_id, teacher_id: schedule.teacher_id, date, heure: r.heure || null, salle: salle || schedule.salle, statut: r.statut }));
    if (!rows.length) return respond({ error: "Aucune présence valide." }, 400);
    const studentIds = [...new Set(rows.map((r: any) => r.student_id))];
    const { data: enrolled } = await service.from("student_modules").select("student_id").eq("module_id", schedule.module_id).in("student_id", studentIds).eq("active", true);
    const allowed = new Set((enrolled ?? []).map((x: any) => x.student_id));
    if (rows.some((r: any) => !allowed.has(r.student_id))) return respond({ error: "Un apprenant n'est pas inscrit à ce module." }, 409);

    const { data, error } = await service.from("attendance").upsert(rows, { onConflict: "student_id,schedule_id,date" }).select();
    if (error) throw error;
    const flagged = rows.filter((r: any) => r.statut !== "present");
    if (flagged.length) {
      const { data: students } = await service.from("students").select("id,user_id").in("id", flagged.map((r: any) => r.student_id));
      const userByStudent = new Map((students ?? []).map((s: any) => [s.id, s.user_id]));
      const notifications = flagged.map((r: any) => ({ user_id: userByStudent.get(r.student_id), title: r.statut === "absent" ? "Absence enregistrée" : "Retard enregistré", body: `Statut enregistré le ${date} pour votre cours.`, type: "planning" })).filter((n: any) => n.user_id);
      if (notifications.length) await service.from("notifications").insert(notifications);
    }
    await service.from("audit_logs").insert({ user_id: user.id, action: "ATTENDANCE_MARKED", entity_type: "attendance", entity_id: schedule.id, description: `${rows.length} présences enregistrées pour le ${date}` });
    return respond({ ok: true, records: data });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : "Erreur d'enregistrement des présences." }, 500);
  }
});
