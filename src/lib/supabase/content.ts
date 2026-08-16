import { requireSupabase } from "./client";
import { uploadSecure } from "./storage";
import type { Announcement, Avantage, Partner, SiteContent } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function persistPublicImage(value: string, folder: string) {
  if (!value?.startsWith("data:")) return value || "";
  const blob = await (await fetch(value)).blob();
  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const path = await uploadSecure("public-media", folder, new File([blob], `image.${extension}`, { type: blob.type || "image/jpeg" }));
  return requireSupabase().storage.from("public-media").getPublicUrl(path).data.publicUrl;
}

export async function loadPublicContent() {
  const client = requireSupabase();
  const [site, advantages, partners, announcements] = await Promise.all([
    client.from("site_settings").select("*").eq("id", true).maybeSingle(),
    client.from("advantages").select("*").eq("actif", true).order("ordre"),
    client.from("partners").select("*").eq("actif", true).order("ordre"),
    client.from("announcements").select("*").eq("actif", true).order("created_at", { ascending: false }),
  ]);
  const error = site.error || advantages.error || partners.error || announcements.error;
  if (error) throw error;
  return { site: site.data, advantages: advantages.data ?? [], partners: partners.data ?? [], announcements: announcements.data ?? [] };
}

export async function savePublicContent(settings: SiteContent) {
  const client = requireSupabase();
  const hero = { ...settings.hero, responsibleImage: await persistPublicImage(settings.hero.responsibleImage, "hero") };
  const { error: siteError } = await client.from("site_settings").upsert({
    id: true,
    branding: settings.branding,
    hero,
    infos: settings.infos,
    frais: settings.frais,
    formations: settings.formations,
    contact: settings.contact,
    apropos: settings.apropos,
    pre_inscription: settings.preInscription,
    bourse: settings.bourse,
  });
  if (siteError) throw siteError;

  const persistedAdvantages = await Promise.all(settings.avantages.map(async (item, ordre) => ({
    ...(UUID_RE.test(item.id) ? { id: item.id } : {}),
    titre: item.titre,
    description: item.description,
    explication: item.explication,
    extra: item.extra,
    image_path: await persistPublicImage(item.image, `advantages/${item.id || ordre}`),
    ordre,
    actif: true,
  })));
  const persistedPartners = await Promise.all(settings.partenaires.map(async (item, ordre) => ({
    ...(UUID_RE.test(item.id) ? { id: item.id } : {}),
    nom: item.nom,
    description: item.description,
    logo_path: await persistPublicImage(item.logo, `partners/${item.id || ordre}`),
    site: item.site,
    telephone: item.telephone || "",
    email: item.email || "",
    actif: item.actif,
    ordre,
  })));
  const persistedAnnouncements = settings.annonces.map((item) => ({
    ...(UUID_RE.test(item.id) ? { id: item.id } : {}),
    titre: item.titre,
    body: item.body,
    type: item.type,
    actif: item.actif,
    published_at: item.actif ? new Date().toISOString() : null,
  }));

  for (const table of ["advantages", "partners", "announcements"] as const) {
    const { error } = await client.from(table).delete().not("id", "is", null);
    if (error) throw error;
  }
  if (persistedAdvantages.length) { const { error } = await client.from("advantages").insert(persistedAdvantages); if (error) throw error; }
  if (persistedPartners.length) { const { error } = await client.from("partners").insert(persistedPartners); if (error) throw error; }
  if (persistedAnnouncements.length) { const { error } = await client.from("announcements").insert(persistedAnnouncements); if (error) throw error; }

  return { ...settings, hero };
}

export function mapPublicContent(base: SiteContent, payload: Awaited<ReturnType<typeof loadPublicContent>>): SiteContent {
  const site = payload.site ?? {};
  return {
    ...base,
    branding: { ...base.branding, ...(site.branding ?? {}) },
    hero: { ...base.hero, ...(site.hero ?? {}) },
    infos: { ...base.infos, ...(site.infos ?? {}) },
    frais: { ...base.frais, ...(site.frais ?? {}) },
    formations: { ...base.formations, ...(site.formations ?? {}) },
    contact: { ...base.contact, ...(site.contact ?? {}) },
    apropos: { ...base.apropos, ...(site.apropos ?? {}) },
    preInscription: { ...base.preInscription, ...(site.pre_inscription ?? {}) },
    bourse: { ...base.bourse, ...(site.bourse ?? {}) },
    avantages: payload.advantages.map((a: any) => ({ id: a.id, titre: a.titre, description: a.description, explication: a.explication, extra: a.extra, image: a.image_path || "" })) as Avantage[],
    partenaires: payload.partners.map((p: any) => ({ id: p.id, nom: p.nom, description: p.description, logo: p.logo_path || "", site: p.site, actif: p.actif, telephone: p.telephone, email: p.email, ordre: p.ordre })) as Partner[],
    annonces: payload.announcements.map((a: any) => ({ id: a.id, titre: a.titre, body: a.body, date: (a.published_at || a.created_at || "").slice(0, 10), actif: a.actif, type: a.type })) as Announcement[],
  };
}