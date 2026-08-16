# Tests et qualité

## Commandes

```bash
npx tsc --noEmit
npx eslint src
npx vitest run
npm run build
```

## Tests RLS

Les tests SQL doivent être exécutés sur un projet Supabase local ou staging,
jamais directement sur la production. Vérifier pour chaque rôle : SELECT,
INSERT, UPDATE et DELETE sur les tables sensibles.

## Ajout d'un test

- Placer les tests unitaires dans `src/__tests__/`.
- Tester au minimum le cas nominal, le refus et le cas limite.
- Ne jamais inclure de secret, token ou donnée personnelle réelle.