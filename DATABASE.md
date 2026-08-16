# Base de données

Les migrations SQL sont versionnées dans `supabase/migrations/`.

- `0001_initial.sql` : schéma relationnel, RBAC, RLS, Storage et Realtime.
- `0002_has_any_superadmin.sql` : vérité serveur du bootstrap.
- `0003_seed_core_formations.sql` : deux formations structurelles, sans données de démonstration.
- `0004_business_functions_and_rls.sql` : paramètres tarifaires, matricules, finances et RLS métier.
- `0005_secure_public_registration.sql` : pré-inscription publique transactionnelle.

Les gros fichiers restent dans Supabase Storage. PostgreSQL conserve uniquement les chemins et métadonnées.