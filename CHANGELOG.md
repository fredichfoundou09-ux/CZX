# Changelog

## 1.0.0 - 2026-08-15

### Sécurité

- Supabase Auth devient l'unique authentification de production.
- Suppression du backend Express/Prisma et du client HTTP legacy.
- Durcissement RLS des profils, comptes désactivés, partenaires et Storage.
- Connexion par identifiant déplacée dans une Edge Function sans exposition de l'email.
- Bootstrap Admin Sup retiré de la page publique et réservé à la procédure serveur.
- Ajout des organisations et périmètres partenaires obligatoires.
- Mise à jour de Vite vers 7.3.5.

### Fonctionnalités

- Portail Partenaire en lecture seule avec vues PostgreSQL dédiées.
- Pré-inscription publique transactionnelle.
- Changement obligatoire du mot de passe temporaire.
- Génération et vérification publique des certificats.
- Correction serveur des tests.

### Qualité

- Ajout ESLint, Prettier, Sonner et Vitest.
- Ajout CI GitHub, configuration Vercel et documentation de déploiement.