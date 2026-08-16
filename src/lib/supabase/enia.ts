import { requireSupabase } from "./client";
import { signedUrl, uploadSecure } from "./storage";
import type { EniaContent, Partner } from "@/lib/types";

async function persistImage(value: string, bucket: "enia-media" | "public-media", folder: string) {
  if (!value?.startsWith("data:")) return value || "";
  const blob = await (await fetch(value)).blob();
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return uploadSecure(bucket, folder, new File([blob], `image.${extension}`, { type: blob.type || "image/jpeg" }));
}

export async function getEniaContent() {
  const client = requireSupabase();
  const [content, advantages, highlights, fees, groups, items, partners] = await Promise.all([
    client.from("enia_content").select("*").eq("id", true).maybeSingle(),
    client.from("enia_advantages").select("*").eq("active", true).order("ordre"),
    client.from("enia_highlights").select("*").order("ordre"),
    client.from("enia_fee_items").select("*").order("ordre"),
    client.from("enia_piece_groups").select("*").order("ordre"),
    client.from("enia_piece_items").select("*").order("ordre"),
    client.from("enia_partners").select("*").eq("actif", true).order("ordre"),
  ]);
  const error = content.error || advantages.error || highlights.error || fees.error || groups.error || items.error || partners.error;
  if (error) throw error;
  return { content: content.data, advantages: advantages.data ?? [], highlights: highlights.data ?? [], fees: fees.data ?? [], groups: groups.data ?? [], items: items.data ?? [], partners: partners.data ?? [] };
}

export async function mapEniaContent(base: EniaContent): Promise<{ enia: EniaContent; partners: Partner[] }> {
  const data = await getEniaContent();
  const c = data.content ?? {};
  let affiche = "";
  if (c.affiche_path) { try { affiche = await signedUrl("enia-media", c.affiche_path, 3600); } catch { affiche = ""; } }
  const pieces = data.groups.map((group: any) => ({ id: group.id, titre: group.titre, frais: group.frais_depot || "", items: data.items.filter((item: any) => item.group_id === group.id).map((item: any) => item.piece) }));
  const partners = data.partners.map((p: any) => ({ id: p.id, nom: p.nom, description: p.description, logo: p.logo_path ? requireSupabase().storage.from("public-media").getPublicUrl(p.logo_path).data.publicUrl : "", site: p.url, actif: p.actif, telephone: p.telephone, email: p.email, ordre: p.ordre }));
  return {
    enia: {
      ...base,
      enabled: c.visible ?? base.enabled,
      nom: c.nom ?? base.nom,
      sousTitre: c.sous_titre ?? base.sousTitre,
      accroche: c.accroche ?? base.accroche,
      presentationTitre: c.presentation_titre ?? base.presentationTitre,
      presentation: c.presentation ?? base.presentation,
      affiche,
      afficheTelechargeable: c.allow_download_affiche ?? base.afficheTelechargeable,
      bourse: { titre: c.bourse_titre ?? base.bourse.titre, intro: c.bourse_intro ?? base.bourse.intro, avantages: data.advantages.map((a: any) => ({ id: a.id, texte: a.texte })), concretementTitre: c.bourse_concretement_titre ?? base.bourse.concretementTitre, concretement: c.bourse_concretement ?? base.bourse.concretement },
      highlightTitre: c.highlight_titre ?? base.highlightTitre,
      highlights: data.highlights.map((h: any) => ({ id: h.id, numero: h.numero, texte: h.texte })),
      fraisTitre: c.frais_titre ?? base.fraisTitre,
      frais: data.fees.map((f: any) => ({ id: f.id, label: f.label, valeur: f.value })),
      piecesTitre: c.pieces_titre ?? base.piecesTitre,
      piecesNote: c.pieces_note ?? base.piecesNote,
      pieces,
      lien: { nom: c.lien_nom ?? base.lien.nom, url: c.lien_url ?? base.lien.url, description: c.lien_description ?? base.lien.description, actif: c.lien_actif ?? base.lien.actif },
    },
    partners,
  };
}

export async function saveEniaContent(enia: EniaContent, partners: Partner[]) {
  const client = requireSupabase();
  const affichePath = enia.affiche.startsWith("data:") ? await persistImage(enia.affiche, "enia-media", "affiches") : (enia.affiche.includes("/storage/v1/object/sign/") ? undefined : enia.affiche || null);
  const { error: contentError } = await client.from("enia_content").upsert({ id: true, visible: enia.enabled, nom: enia.nom, sous_titre: enia.sousTitre, accroche: enia.accroche, presentation_titre: enia.presentationTitre, presentation: enia.presentation, ...(affichePath !== undefined ? { affiche_path: affichePath } : {}), allow_download_affiche: enia.afficheTelechargeable, bourse_titre: enia.bourse.titre, bourse_intro: enia.bourse.intro, bourse_concretement_titre: enia.bourse.concretementTitre, bourse_concretement: enia.bourse.concretement, highlight_titre: enia.highlightTitre, frais_titre: enia.fraisTitre, pieces_titre: enia.piecesTitre, pieces_note: enia.piecesNote, lien_nom: enia.lien.nom, lien_url: enia.lien.url, lien_description: enia.lien.description, lien_actif: enia.lien.actif });
  if (contentError) throw contentError;

  for (const table of ["enia_piece_items", "enia_piece_groups", "enia_advantages", "enia_highlights", "enia_fee_items", "enia_partners"] as const) { const { error } = await client.from(table).delete().not("id", "is", null); if (error) throw error; }
  if (enia.bourse.avantages.length) { const { error } = await client.from("enia_advantages").insert(enia.bourse.avantages.map((a, ordre) => ({ texte: a.texte, ordre, active: true }))); if (error) throw error; }
  if (enia.highlights.length) { const { error } = await client.from("enia_highlights").insert(enia.highlights.map((h, ordre) => ({ numero: h.numero, texte: h.texte, ordre }))); if (error) throw error; }
  if (enia.frais.length) { const { error } = await client.from("enia_fee_items").insert(enia.frais.map((f, ordre) => ({ label: f.label, value: f.valeur, ordre }))); if (error) throw error; }
  for (let ordre = 0; ordre < enia.pieces.length; ordre++) { const group = enia.pieces[ordre]; const { data: created, error } = await client.from("enia_piece_groups").insert({ titre: group.titre, frais_depot: group.frais || "", ordre }).select("id").single(); if (error) throw error; if (group.items.length) { const { error: itemError } = await client.from("enia_piece_items").insert(group.items.map((piece, itemOrder) => ({ group_id: created.id, piece, ordre: itemOrder }))); if (itemError) throw itemError; } }
  if (partners.length) { const rows = await Promise.all(partners.map(async (p, ordre) => ({ nom: p.nom, description: p.description, logo_path: p.logo.startsWith("data:") ? await persistImage(p.logo, "public-media", `enia-partners/${ordre}`) : p.logo, url: p.site, telephone: p.telephone || "", email: p.email || "", actif: p.actif, ordre }))); const { error } = await client.from("enia_partners").insert(rows); if (error) throw error; }
}

export async function listPublicPartners() { const { data, error } = await requireSupabase().from("enia_partners").select("*").eq("actif", true).order("ordre"); if (error) throw error; return data ?? []; }