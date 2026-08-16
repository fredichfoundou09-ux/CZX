# Row Level Security

RLS est activé sur les tables exposées. Les helpers SQL sont :

- `current_role()`
- `is_admin()`
- `is_superadmin()`
- `has_permission()`

Tests obligatoires : Student A vers Student B refusé, formateur hors module refusé, anonyme vers données privées refusé, admin autorisé selon permission.