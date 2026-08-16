# Module Partenaire — SENTINELLES NUMÉRIQUES

## Objectif

Le rôle Partenaire donne un accès de consultation sécurisé aux partenaires institutionnels du centre de formation. C'est un accès **strictement en lecture seule**.

## Rôles liés

- `partner` : accès consultation
- `partner_admin` : administration institutionnelle (lecture étendue)

## Pages disponibles

- `/app/partner/students` — Liste des apprenants
- `/app/partner/teachers` — Liste des enseignants
- `/app/partner/formations` — Catalogue des formations et modules
- `/app/partner/schedule` — Emploi du temps
- `/app/partner/attendance` — Historique des présences
- `/app/partner/cours` — Cours publiés
- `/app/partner/tests` — Évaluations
- `/app/partner/grades` — Notes
- `/app/partner/certificates` — Certificats émis
- `/app/partner/scholarships` — Bourses
- `/app/partner/reports` — Rapports institutionnels
- `/app/partner/enya` — Module ENIA 2.0
- `/app/partner/profile` — Mon profil

## Sécurité

- RLS PostgreSQL : SELECT autorisé, INSERT/UPDATE/DELETE refusés.
- Vues dédiées : `partner_student_view`, `partner_teacher_view`, etc.
- Politique d'interface : aucun bouton d'écriture affiché.
- Journal d'accès dans `audit_logs`.

## Défense en profondeur (3 niveaux)

1. **Base** : RLS ne retourne que les données autorisées.
2. **Application** : `isReadOnlyRole()` masque les boutons.
3. **UI** : Portail dédié sans routes d'administration.
