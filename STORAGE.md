# Storage

Buckets : `avatars`, `course-files`, `submission-files`, `certificates`, `enia-media`, `public-media`.

Le service `src/lib/supabase/storage.ts` valide le MIME, la taille et le nom. Les fichiers privés sont ouverts avec des URL signées temporaires.

La clé `service_role` ne doit jamais être utilisée dans le navigateur.