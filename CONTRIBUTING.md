# Contribution

Branches : `main`, `develop`, `feature/*`.

Avant une Pull Request :

1. Exécuter `npm run build`.
2. Vérifier les états loading/error/empty.
3. Tester les policies RLS avec les quatre rôles.
4. Vérifier qu’aucun `.env`, token ou service key n’est commité.

Commits : `feat(auth): ...`, `feat(students): ...`, `security(rls): ...`, `fix(attendance): ...`.