# Authentification

Supabase Auth est la source d’identité. `profiles.id` correspond à `auth.users.id`.

Le rôle est lu dans PostgreSQL et contrôlé par RLS. Le choix Administrateur/Formateur/Apprenant dans l’interface ne donne aucun droit.

Le premier Admin Sup n'est pas créé depuis la page publique. Il est provisionné une seule fois par l'Edge Function `bootstrap-superadmin`, protégée par `BOOTSTRAP_SECRET`, puis verrouillé par `has_any_superadmin()` et `bootstrap_superadmin()`. Les comptes suivants sont créés par l'Edge Function `create-user`.

Le reset et le changement de mot de passe utilisent Supabase Auth.