-- 0009_partner_role.sql
-- Incorpore le rôle officiel "partner" (Partenaire) avec une sécurité renforcée (RLS à 3 niveaux)

insert into public.roles(code, name) values
  ('partner_admin', 'Administration partenaire'),
  ('partner', 'Partenaire')
on conflict (code) do nothing;

insert into public.permissions(code, description) values
  ('partner.dashboard.read', 'Consulter le tableau de bord partenaire'),
  ('partner.vitrine.read', 'Consulter la vitrine de formations'),
  ('partner.certificates.read', 'Consulter les certificats institutionnels')
on conflict (code) do nothing;

-- Permissions pour les rôles partenaires
insert into public.role_permissions(role_code, permission_code) values
  ('partner_admin', 'dashboard.read'),
  ('partner_admin', 'formations.read'),
  ('partner_admin', 'modules.read'),
  ('partner_admin', 'schedule.read'),
  ('partner_admin', 'certificates.read'),
  ('partner_admin', 'enia.read'),
  ('partner', 'partner.dashboard.read'),
  ('partner', 'partner.vitrine.read'),
  ('partner', 'partner.certificates.read')
on conflict do nothing;

-- Table des organisations partenaires
create table if not exists public.partners_organizations (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null,
  description text not null default '',
  logo_path text,
  site text not null default '',
  telephone text not null default '',
  email text not null default '',
  actif boolean not null default true,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partners_organizations enable row level security;
create policy partners_organizations_public_read on public.partners_organizations for select using (actif = true or public.is_admin());
create policy partners_organizations_admin_all on public.partners_organizations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger partners_organizations_touch_updated_at before update on public.partners_organizations for each row execute function public.touch_updated_at();

-- Table des utilisateurs partenaires (liaison profil <-> organisation)
create table if not exists public.partner_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.partners_organizations(id) on delete cascade,
  poste text not null default '',
  created_at timestamptz not null default now()
);

alter table public.partner_users enable row level security;
create policy partner_users_own_or_admin on public.partner_users for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy partner_users_admin_all on public.partner_users for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Règles RLS strictes de lecture seule pour le rôle "partner"
create policy partner_read_own_organization on public.partners_organizations for select to authenticated
using (id in (select organization_id from public.partner_users where user_id = auth.uid()) or public.is_admin());

-- Les politiques existantes de formations, modules et certificats intègrent déjà "using (true)" ou "authenticated",
-- ce qui permet une lecture seule naturelle pour le partenaire sans lui accorder aucun droit d'écriture.
