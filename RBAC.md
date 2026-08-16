# RBAC — Matrice des permissions

Source unique : `src/types/rbac.ts`

## Rôles

| Code | Libellé | Créé par |
|------|---------|----------|
| `superadmin` | Super Admin | Bootstrap |
| `admin` | Administration | Super Admin |
| `partner_admin` | Admin Partenaire | Admin / Super Admin |
| `teacher` | Formateur | Admin / Super Admin |
| `student` | Apprenant | Admin / Super Admin |
| `partner` | Partenaire | Admin / Super Admin |

## Permission centrale

```ts
roleHasPermission(role, "learners.read")    → true/false
roleCanManage(role, "learners")             → true/false
isReadOnlyRole(role)                        → true/false
```

## Matrice RBAC

Consultez `src/types/rbac.ts` pour la matrice complète.

## Validation côté serveur

Le frontend ne protège que l'UX. La sécurité réelle repose sur :

1. Supabase Auth
2. PostgreSQL RLS
3. Edge Functions avec `service_role`
