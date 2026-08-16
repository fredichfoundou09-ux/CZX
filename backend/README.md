# Backend historique retiré

L’ancien serveur Express/Prisma a été retiré pour éviter deux backends et deux
systèmes d’authentification concurrents.

La seule architecture de production est désormais :

- Supabase Auth ;
- PostgreSQL + RLS ;
- Supabase Storage ;
- Supabase Realtime ;
- Edge Functions dans `supabase/functions/`.

Ce dossier ne contient plus de code exécutable.
