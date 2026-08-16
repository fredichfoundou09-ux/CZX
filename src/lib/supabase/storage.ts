import { requireSupabase } from "./client";
export type StorageBucket = "avatars" | "course-files" | "submission-files" | "certificates" | "enia-media" | "public-media";
const allowed: Record<StorageBucket, { mime: string[]; max: number }> = {
  avatars: { mime: ["image/jpeg", "image/png", "image/webp"], max: 3 * 1024 * 1024 },
  "course-files": { mime: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/jpeg", "image/png"], max: 25 * 1024 * 1024 },
  "submission-files": { mime: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/jpeg", "image/png", "text/plain"], max: 25 * 1024 * 1024 },
  certificates: { mime: ["application/pdf"], max: 10 * 1024 * 1024 },
  "enia-media": { mime: ["image/jpeg", "image/png", "image/webp", "application/pdf"], max: 15 * 1024 * 1024 },
  "public-media": { mime: ["image/jpeg", "image/png", "image/webp"], max: 8 * 1024 * 1024 },
};
function safeName(name: string) { return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase(); }
export async function uploadSecure(bucket: StorageBucket, path: string, file: File) { const rule = allowed[bucket]; if (!rule.mime.includes(file.type)) throw new Error("Type de fichier non autorisé."); if (file.size > rule.max) throw new Error(`Fichier trop volumineux. Maximum : ${Math.round(rule.max / 1024 / 1024)} Mo.`); const cleanPath = `${path.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${safeName(file.name)}`; const { data, error } = await requireSupabase().storage.from(bucket).upload(cleanPath, file, { contentType: file.type, upsert: false }); if (error) throw error; return data.path; }
export async function signedUrl(bucket: StorageBucket, path: string, expiresIn = 300) { const { data, error } = await requireSupabase().storage.from(bucket).createSignedUrl(path, expiresIn); if (error) throw error; return data.signedUrl; }
export async function removeFile(bucket: StorageBucket, path: string) { const { error } = await requireSupabase().storage.from(bucket).remove([path]); if (error) throw error; }
