# SENTINELLES NUMÉRIQUES

Plateforme de gestion et d'encadrement pour un centre de formation en Génie Informatique et Génie Industriel.

## Architecture

```
React + TypeScript + Vite + Tailwind CSS
        │
        └── Supabase
              ├── Auth (sessions, mots de passe, bootstrap)
              ├── PostgreSQL + RLS (données métier)
              ├── Storage (fichiers, avatars, certificats)
              ├── Realtime (messages, notifications)
              └── Edge Functions (opérations serveur sécurisées)
```

## Démarrage rapide

1. Copier `.env.example` vers `.env.local`.
2. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. `npm install && npm run dev`

## Supabase

Appliquer les migrations dans l'ordre (`supabase db push`) puis déployer les Edge Functions :

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

Configurer les secrets Edge Functions :

```bash
supabase secrets set ALLOWED_ORIGIN=https://votre-domaine.example
supabase secrets set BOOTSTRAP_SECRET=un-secret-long-et-aleatoire
```

Désactiver l'inscription publique dans Supabase Dashboard → Auth → Settings.

## Sécurité

- Aucun mot de passe traité par le frontend.
- Supabase Auth est l'unique gestionnaire d'identité.
- RLS PostgreSQL contrôle chaque accès aux données.
- Edge Functions utilisent `service_role` (jamais exposé côté client).
- Comptes désactivés refusés à tous les niveaux (RLS + Edge Functions).
- Bootstrap Admin Sup protégé par un code d'installation serveur.

## Documentation

| Fichier | Contenu |
|---------|---------|
| `DEPLOYMENT.md` | Guide de déploiement complet |
| `AUTH.md` | Authentification et bootstrap |
| `RLS.md` | Row Level Security |
| `RBAC.md` | Matrice RBAC |
| `PARTNER.md` | Module Partenaire |
| `STORAGE.md` | Gestion des fichiers |
| `SECURITY.md` | Checklist de sécurité |
| `TESTING.md` | Tests par rôle |
| `QR_SCANNER.md` | Architecture QR sécurisée |
