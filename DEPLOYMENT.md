# Déploiement — SENTINELLES NUMÉRIQUES

## Prérequis

- Node.js 20+
- Docker Desktop
- Supabase CLI (`npm i -g supabase`)
- Compte Supabase (offre gratuite suffisante)
- Compte Vercel (offre gratuite)
- Dépôt GitHub

## Étape 1 — Projet Supabase

Créer un projet Supabase via `supabase.com/dashboard`.

Récupérer :
- `SUPABASE_URL` (ex. `https://xxx.supabase.co`)
- `SUPABASE_ANON_KEY` (clé publique)
- `SUPABASE_SERVICE_ROLE_KEY` (clé privée — **jamais exposée côté frontend**)
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

## Étape 2 — Migrations SQL

Appliquer les migrations dans l'ordre :

| Migration | Contenu |
|-----------|---------|
| `0001_initial.sql` | Schéma complet : 54 tables, RLS, RBAC, Storage, Realtime |
| `0002_has_any_superadmin.sql` | Vérification serveur du bootstrap |
| `0003_seed_core_formations.sql` | 2 formations structurelles |
| `0004_business_functions_and_rls.sql` | Paramètres tarifaires, matricules, finances, vues |
| `0005_secure_public_registration.sql` | Pré-inscription publique transactionnelle |
| `0006_harden_superadmin_bootstrap.sql` | Sécurisation du bootstrap (advisory lock) |
| `0007_secure_tests.sql` | RLS tests, RPC évaluations sécurisées |
| `0008_force_password_change.sql` | Changement obligatoire à la première connexion |
| `0009_partner_role.sql` | Rôle Partenaire, organisations, RLS |
| `0010_partner_rls_views.sql` | Vues PostgreSQL partenaires, RLS ciblées |

```bash
supabase db push
```

## Étape 3 — Edge Functions

| Fonction | Rôle |
|----------|------|
| `bootstrap-superadmin` | Premier Admin Sup (one-shot) |
| `login-identifier` | Connexion par identifiant sans exposer l'email |
| `change-password` | Changement de mot de passe et validation de première connexion |
| `create-user` | Création sécurisée de comptes par l'administration |
| `reset-password` | Réinitialisation de mot de passe par l'administration |
| `disable-user` | Activation / désactivation de comptes |
| `delete-user` | Suppression définitive (Super Admin uniquement) |
| `submit-test` | Soumission et correction serveur des tests |
| `generate-certificate` | Génération PDF de certificat |

```bash
supabase functions deploy bootstrap-superadmin
supabase functions deploy login-identifier
supabase functions deploy change-password
supabase functions deploy create-user
supabase functions deploy reset-password
supabase functions deploy disable-user
supabase functions deploy delete-user
supabase functions deploy submit-test
supabase functions deploy generate-certificate
```

## Étape 4 — Configuration Auth

Dans Supabase Dashboard → Authentication → URL Configuration :

- **Site URL** : URL de production Vercel
- **Redirect URLs** : `https://*.vercel.app/#/connexion`
- **Email signups** : **Désactivé** (bootstrap + create-user uniquement)

## Étape 5 — Variables Vercel

Variables à définir dans le projet Vercel :

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

**Ne jamais exposer** dans Vite :
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET`

## Étape 6 — Build et déploiement

```bash
npm run build
```

Sortie : `dist/`

## Étape 7 — CI/CD GitHub

Deux workflows configurés :

1. **`.github/workflows/ci.yml`** — Build frontend sur chaque PR et push.
2. **`.github/workflows/supabase-migrate.yml`** — Migrations + Edge Functions sur push `main` touchant `supabase/**`.

Secrets GitHub requis :

```
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_REF
```

## Étape 8 — Premier lancement

Le premier compte n'est jamais créé depuis la page publique de connexion.

1. Configurer `BOOTSTRAP_SECRET` dans les secrets de l'Edge Function.
2. Appeler une seule fois la fonction depuis un terminal administrateur :

```bash
curl -X POST "https://PROJECT_REF.supabase.co/functions/v1/bootstrap-superadmin" \
  -H "Content-Type: application/json" \
  -H "apikey: SUPABASE_PUBLISHABLE_KEY" \
  -d '{
    "name": "Administrateur Système",
    "username": "admin",
    "email": "admin@example.com",
    "password": "MotDePasse#TresFort2026",
    "setupCode": "VALEUR_DU_BOOTSTRAP_SECRET"
  }'
```

3. Supprimer ou faire tourner `BOOTSTRAP_SECRET` après la création.
4. Ouvrir l'application et se connecter avec l'identifiant créé.
5. Créer les comptes admin, formateur, apprenant et partenaire depuis l'espace Utilisateurs.

## Variables d'environnement

```env
# Frontend (Vite) — public uniquement
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Backend (Edge Functions) — privé
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
ALLOWED_ORIGIN=https://votre-domaine.example
BOOTSTRAP_SECRET=un-secret-installation-long-et-aleatoire
```

## Sécurité

- Aucune clé privée dans le frontend.
- Aucun mot de passe en clair.
- RLS sur toutes les tables.
- Bootstrap unique (un seul Super Admin).
- Changement de mot de passe obligatoire.
- Audit des opérations critiques.
