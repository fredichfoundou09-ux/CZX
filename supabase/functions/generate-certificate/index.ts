import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const headers = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "http://localhost:5173",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return new Response(JSON.stringify({ error: "Authentification requise." }), { status: 401, headers });
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Session invalide." }), { status: 401, headers });
    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await service.from("profiles").select("role,name,active").eq("id", user.id).single();
    if (!profile?.active || !["superadmin", "admin"].includes(profile.role)) return new Response(JSON.stringify({ error: "Permission insuffisante." }), { status: 403, headers });

    const { certificateId } = await request.json();
    const { data: certificate, error } = await service.from("certificates").select("*, students(nom,prenom), formations(name)").eq("id", certificateId).single();
    if (error || !certificate) throw error || new Error("Certificat introuvable.");

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawRectangle({ x: 18, y: 18, width: 806, height: 559, borderColor: rgb(0, 0.55, 0.75), borderWidth: 3 });
    page.drawText("SENTINELLES NUMERIQUES", { x: 230, y: 510, size: 24, font: bold, color: rgb(0, 0.55, 0.75) });
    page.drawText("CERTIFICAT DE FORMATION", { x: 245, y: 435, size: 28, font: bold, color: rgb(0.05, 0.08, 0.16) });
    page.drawText("Decerne a", { x: 382, y: 385, size: 13, font: regular });
    const studentName = `${certificate.students.prenom} ${certificate.students.nom}`;
    page.drawText(studentName, { x: Math.max(80, 421 - studentName.length * 8), y: 335, size: 26, font: bold, color: rgb(0.95, 0.55, 0.05) });
    page.drawText(`Formation : ${certificate.formations.name}`, { x: 280, y: 285, size: 15, font: regular });
    page.drawText(`Periode : ${certificate.periode}`, { x: 310, y: 250, size: 14, font: regular });
    page.drawText(`Resultat : ${certificate.resultat} - Note ${certificate.note}/20`, { x: 285, y: 215, size: 14, font: regular });
    page.drawText(`Numero officiel : ${certificate.numero}`, { x: 292, y: 130, size: 13, font: bold });
    page.drawText(`Genere par ${profile.name}`, { x: 50, y: 55, size: 9, font: regular });
    const bytes = await pdf.save();
    const path = `${certificate.student_id}/${certificate.numero}.pdf`;
    const { error: uploadError } = await service.storage.from("certificates").upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw uploadError;
    await service.from("certificates").update({ file_path: path }).eq("id", certificate.id);
    await service.from("audit_logs").insert({ user_id: user.id, action: "CERTIFICATE_PDF", entity_type: "certificate", entity_id: certificate.id, description: `Génération du certificat ${certificate.numero}` });
    const { data: signed } = await service.storage.from("certificates").createSignedUrl(path, 300);
    return new Response(JSON.stringify({ ok: true, path, signedUrl: signed?.signedUrl }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur de génération." }), { status: 500, headers });
  }
});