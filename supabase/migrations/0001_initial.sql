-- SENTINELLES NUMERIQUES / Supabase production schema
-- No demo users, passwords, or business records are inserted here.

create extension if not exists pgcrypto;

create table if not exists public.roles (
  code text primary key,
  name text not null
);

create table if not exists public.permissions (
  code text primary key,
  description text not null default ''
);

create table if not exists public.role_permissions (
  role_code text not null references public.roles(code) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  primary key (role_code, permission_code)
);

insert into public.roles(code, name) values
  ('superadmin', 'Administrateur supérieur'),
  ('admin', 'Administrateur'),
  ('teacher', 'Formateur'),
  ('student', 'Apprenant')
on conflict (code) do nothing;

insert into public.permissions(code, description) values
  ('dashboard.read', 'Consulter le tableau de bord'),
  ('users.read', 'Consulter les utilisateurs'), ('users.create', 'Créer un utilisateur'), ('users.update', 'Modifier un utilisateur'), ('users.delete', 'Supprimer un utilisateur'),
  ('formations.read', 'Consulter les formations'), ('formations.manage', 'Gérer les formations'),
  ('modules.read', 'Consulter les modules'), ('modules.manage', 'Gérer les modules'),
  ('students.read', 'Consulter les apprenants'), ('students.create', 'Créer un apprenant'), ('students.update', 'Modifier un apprenant'), ('students.delete', 'Supprimer un apprenant'),
  ('teachers.read', 'Consulter les formateurs'), ('teachers.manage', 'Gérer les formateurs'),
  ('courses.read', 'Consulter les cours'), ('courses.manage', 'Gérer les cours'),
  ('files.read', 'Consulter les fichiers'), ('files.manage', 'Gérer les fichiers'),
  ('schedule.read', 'Consulter le planning'), ('schedule.manage', 'Gérer le planning'),
  ('attendance.read', 'Consulter les présences'), ('attendance.manage', 'Gérer les présences'),
  ('submissions.read', 'Consulter les remises'), ('submissions.manage', 'Gérer les remises'),
  ('tests.read', 'Consulter les tests'), ('tests.manage', 'Gérer les tests'),
  ('grades.read', 'Consulter les notes'), ('grades.manage', 'Gérer les notes'),
  ('finance.read', 'Consulter les finances'), ('finance.manage', 'Gérer les finances'),
  ('teacher_payroll.manage', 'Gérer la rémunération des formateurs'),
  ('messages.read', 'Consulter les messages'), ('messages.manage', 'Gérer les messages'),
  ('notifications.read', 'Consulter les notifications'), ('notifications.manage', 'Gérer les notifications'),
  ('certificates.read', 'Consulter les certificats'), ('certificates.manage', 'Gérer les certificats'),
  ('scholarships.read', 'Consulter les bourses'), ('scholarships.manage', 'Gérer les bourses'),
  ('enia.read', 'Consulter ENIA 2.0'), ('enia.manage', 'Gérer ENIA 2.0'),
  ('audit.read', 'Consulter les journaux'), ('audit.manage', 'Gérer les journaux')
on conflict (code) do nothing;

insert into public.role_permissions(role_code, permission_code)
select 'superadmin', code from public.permissions
on conflict do nothing;

insert into public.role_permissions(role_code, permission_code)
select 'admin', code from public.permissions where code not in ('users.delete', 'audit.manage')
on conflict do nothing;

insert into public.role_permissions(role_code, permission_code) values
  ('teacher', 'dashboard.read'), ('teacher', 'formations.read'), ('teacher', 'modules.read'),
  ('teacher', 'courses.read'), ('teacher', 'courses.manage'), ('teacher', 'files.read'), ('teacher', 'files.manage'),
  ('teacher', 'schedule.read'), ('teacher', 'attendance.read'), ('teacher', 'attendance.manage'),
  ('teacher', 'submissions.read'), ('teacher', 'submissions.manage'), ('teacher', 'tests.read'), ('teacher', 'tests.manage'),
  ('teacher', 'grades.read'), ('teacher', 'grades.manage'), ('teacher', 'messages.read'), ('teacher', 'messages.manage'),
  ('teacher', 'notifications.read'), ('teacher', 'enia.read')
on conflict do nothing;

insert into public.role_permissions(role_code, permission_code) values
  ('student', 'dashboard.read'), ('student', 'formations.read'), ('student', 'modules.read'), ('student', 'courses.read'),
  ('student', 'files.read'), ('student', 'schedule.read'), ('student', 'attendance.read'), ('student', 'submissions.read'),
  ('student', 'submissions.manage'), ('student', 'tests.read'), ('student', 'grades.read'), ('student', 'messages.read'),
  ('student', 'messages.manage'), ('student', 'notifications.read'), ('student', 'certificates.read'),
  ('student', 'scholarships.read'), ('student', 'enia.read')
on conflict do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null,
  email text,
  phone text,
  role text not null default 'student' references public.roles(code) check (role in ('superadmin', 'admin', 'partner_admin', 'teacher', 'student', 'partner')),
  active boolean not null default true,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  numero integer not null check (numero > 0),
  titre text not null,
  icon text not null default 'book-open',
  description text not null default '',
  objectifs text[] not null default '{}',
  programme text not null default '',
  duree text not null default '',
  extra text not null default '',
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formation_id, numero)
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  titre text not null,
  description text not null default '',
  ordre integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_notions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  notion text not null
);

create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.formations(id) on delete cascade,
  nom text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  nom text not null,
  prenom text not null,
  specialite text not null default '',
  email text not null default '',
  phone text not null default '',
  photo_path text,
  infos_pro text not null default '',
  diplomes text not null default '',
  type_contrat text not null default 'Vacataire',
  tarif_horaire numeric(12,2) not null default 0 check (tarif_horaire >= 0),
  heures_prevues numeric(8,2) not null default 0 check (heures_prevues >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  formation_id uuid not null references public.formations(id),
  group_id uuid references public.student_groups(id) on delete set null,
  nom text not null,
  prenom text not null,
  date_naissance date,
  sexe text,
  telephone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  adresse text not null default '',
  niveau text not null default '',
  photo_path text,
  date_inscription date not null default current_date,
  statut text not null default 'actif' check (statut in ('actif','inactif','bloque')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_group_members (
  group_id uuid not null references public.student_groups(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, student_id)
);

create table if not exists public.student_modules (
  student_id text not null references public.students(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (student_id, module_id)
);

create table if not exists public.teacher_modules (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  primary key (teacher_id, module_id)
);

create table if not exists public.teacher_module_rates (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  tarif_horaire numeric(12,2) not null check (tarif_horaire >= 0),
  updated_at timestamptz not null default now(),
  primary key (teacher_id, module_id)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  telephone text not null,
  whatsapp text not null default '',
  email text not null,
  niveau text not null default '',
  formation_id uuid not null references public.formations(id),
  montant_estime numeric(12,2) not null default 0,
  formule text not null default '',
  statut text not null default 'en_attente' check (statut in ('en_attente','confirmee','refusee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registration_modules (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  primary key (registration_id, module_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  module_id uuid not null references public.modules(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  formation_id uuid references public.formations(id) on delete set null,
  group_id uuid references public.student_groups(id) on delete set null,
  type text not null check (type in ('cours','document','devoir')),
  content text not null default '',
  audience text not null default 'module' check (audience in ('module','group','custom')),
  publie boolean not null default false,
  date_publication timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_targets (
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  primary key (course_id, student_id)
);

create table if not exists public.course_files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  original_name text not null,
  mime text not null,
  size bigint not null check (size >= 0),
  storage_key text unique not null,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  jour text not null,
  date date,
  heure_debut time not null,
  heure_fin time not null,
  module_id uuid not null references public.modules(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  formation_id uuid not null references public.formations(id) on delete cascade,
  group_id uuid references public.student_groups(id) on delete set null,
  salle text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (heure_fin > heure_debut)
);

create table if not exists public.schedule_targets (
  schedule_id uuid not null references public.schedule(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  primary key (schedule_id, student_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  schedule_id uuid references public.schedule(id) on delete set null,
  module_id uuid not null references public.modules(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  date date not null,
  heure time,
  salle text not null default '',
  statut text not null check (statut in ('present','absent','retard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, schedule_id, date)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  texte text not null default '',
  note numeric(5,2) check (note between 0 and 20),
  appreciation text not null default '',
  valide boolean not null default false,
  date_correction timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  original_name text not null,
  mime text not null,
  size bigint not null check (size >= 0),
  storage_key text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  module_id uuid not null references public.modules(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  duree integer not null default 30 check (duree > 0),
  date_debut timestamptz,
  date_fin timestamptz,
  niveau text not null default 'moyen',
  tentatives_max integer not null default 1 check (tentatives_max > 0),
  corrections text not null default 'immediat',
  validation_requise boolean not null default false,
  publie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  question text not null,
  type text not null check (type in ('qcm','vf','courte')),
  bonne_reponse text not null,
  points numeric(5,2) not null default 1 check (points > 0),
  explication text not null default '',
  ordre integer not null default 1
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  ordre integer not null default 1
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  note numeric(5,2) not null check (note between 0 and 20),
  pourcentage numeric(5,2) not null check (pourcentage between 0 and 100),
  reussi boolean not null default false,
  valide boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references public.test_results(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  reponse text not null default '',
  correct boolean not null default false,
  points_obtenus numeric(5,2) not null default 0
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  note numeric(5,2) not null check (note between 0 and 20),
  appreciation text not null default '',
  date date not null default current_date,
  created_by uuid not null references auth.users(id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  type text not null,
  libelle text not null,
  montant numeric(12,2) not null check (montant >= 0),
  date date not null default current_date,
  due_date date not null default current_date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  type text not null,
  libelle text not null,
  montant numeric(12,2) not null check (montant > 0),
  date date not null default current_date,
  heure time not null default current_time,
  mode text not null,
  reference text unique not null,
  observation text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_hours (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references public.schedule(id) on delete set null,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  date date not null,
  heure_debut time not null,
  heure_fin time not null,
  heures numeric(6,2) not null check (heures > 0),
  tarif_applique numeric(12,2) not null check (tarif_applique >= 0),
  montant numeric(12,2) generated always as (heures * tarif_applique) stored,
  valide boolean not null default false,
  valide_par uuid references auth.users(id) on delete set null,
  date_validation timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_payments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  montant numeric(12,2) not null check (montant > 0),
  date date not null default current_date,
  heure time not null default current_time,
  mode text not null,
  reference text not null,
  observation text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  subject text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.students(id) on delete cascade,
  numero text unique not null,
  formation_id uuid not null references public.formations(id),
  periode text not null,
  resultat text not null,
  note numeric(5,2) not null check (note between 0 and 20),
  date date not null default current_date,
  file_path text,
  created_by uuid not null references auth.users(id)
);

create table if not exists public.certificate_modules (
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  primary key (certificate_id, module_id)
);

create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  student_id text unique not null references public.students(id) on delete cascade,
  statut text not null default 'en_attente',
  date date not null default current_date,
  date_attribution date,
  date_debut date,
  date_fin date,
  conditions text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now()
);

-- Public content / ENIA. All records are empty until the institution configures them.
create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  branding jsonb not null default '{}'::jsonb,
  hero jsonb not null default '{}'::jsonb,
  infos jsonb not null default '{}'::jsonb,
  frais jsonb not null default '{}'::jsonb,
  formations jsonb not null default '{}'::jsonb,
  avantages jsonb not null default '[]'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.advantages (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  explication text not null default '',
  extra text not null default '',
  image_path text,
  ordre integer not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
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

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  body text not null default '',
  type text not null default 'info',
  actif boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.enia_content (
  id boolean primary key default true check (id = true),
  visible boolean not null default false,
  nom text not null default 'ENIA 2.0',
  sous_titre text not null default 'École du Numérique et de l’Intelligence Artificielle',
  accroche text not null default '',
  presentation_titre text not null default 'C’est quoi ENIA 2.0 ?',
  presentation text not null default '',
  affiche_path text,
  allow_download_affiche boolean not null default false,
  bourse_titre text not null default 'Bourse ENIA 2.0',
  bourse_intro text not null default '',
  bourse_concretement text not null default '',
  highlight_titre text not null default 'BOURSE 100 % GRATUITE',
  lien_nom text not null default 'Site officiel ENIA 2.0',
  lien_url text not null default '',
  lien_description text not null default '',
  lien_actif boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.enia_advantages (
  id uuid primary key default gen_random_uuid(),
  texte text not null,
  ordre integer not null default 0,
  active boolean not null default true
);

create table if not exists public.enia_highlights (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  texte text not null,
  ordre integer not null default 0
);

create table if not exists public.enia_fee_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  ordre integer not null default 0
);

create table if not exists public.enia_piece_groups (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  frais_depot text not null default '',
  ordre integer not null default 0
);

create table if not exists public.enia_piece_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.enia_piece_groups(id) on delete cascade,
  piece text not null,
  ordre integer not null default 0
);

create table if not exists public.enia_partners (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text not null default '',
  logo_path text,
  url text not null default '',
  telephone text not null default '',
  email text not null default '',
  actif boolean not null default true,
  ordre integer not null default 0
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  description text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Generic updated_at trigger.
create or replace function public.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','formations','modules','chapters','teachers','students','registrations','courses','schedule','attendance','submissions','tests','enia_content','advantages','partners','site_settings'] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', t, t);
    execute format('create trigger %I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, username, name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.current_role() returns text language sql stable security definer set search_path = public as $$ select role from public.profiles where id = auth.uid(); $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.current_role() in ('admin','superadmin'), false); $$;
create or replace function public.is_superadmin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.current_role() = 'superadmin', false); $$;

-- Server-side truth for the one-time Admin Sup bootstrap.
create or replace function public.has_any_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where role = 'superadmin' and active = true
  );
$$;
revoke all on function public.has_any_superadmin() from public;
grant execute on function public.has_any_superadmin() to anon, authenticated;

create or replace function public.has_permission(permission_code text) returns boolean language sql stable security definer set search_path = public as $$ select coalesce(exists(select 1 from public.role_permissions rp where rp.role_code = public.current_role() and rp.permission_code = permission_code), false); $$;
create or replace function public.resolve_login_email(p_username text) returns text language sql stable security definer set search_path = public as $$ select email from public.profiles where lower(username) = lower(trim(p_username)) limit 1; $$;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
create or replace function public.promote_first_superadmin() returns boolean language plpgsql security definer set search_path = public as $$ begin if exists(select 1 from public.profiles where role = 'superadmin') then return false; end if; update public.profiles set role = 'superadmin', active = true where id = auth.uid(); return found; end; $$;
revoke execute on function public.promote_first_superadmin() from anon;
grant execute on function public.promote_first_superadmin() to authenticated;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
create policy roles_read_authenticated on public.roles for select to authenticated using (true);
create policy permissions_read_authenticated on public.permissions for select to authenticated using (true);
create policy role_permissions_read_authenticated on public.role_permissions for select to authenticated using (true);
create policy profiles_read_own_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own_or_admin on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Public catalogue and ENIA reads; writes are administrative.
do $$ declare t text; begin foreach t in array array['formations','modules','chapters','module_notions','site_settings','advantages','partners','announcements','enia_content','enia_advantages','enia_highlights','enia_fee_items','enia_piece_groups','enia_piece_items','enia_partners'] loop execute format('alter table public.%I enable row level security', t); end loop; end $$;
create policy formations_public_read on public.formations for select using (active = true or public.is_admin());
create policy modules_public_read on public.modules for select using (active = true or public.is_admin());
create policy chapters_public_read on public.chapters for select using (true);
create policy module_notions_public_read on public.module_notions for select using (true);
create policy site_settings_public_read on public.site_settings for select using (true);
create policy advantages_public_read on public.advantages for select using (actif = true or public.is_admin());
create policy partners_public_read on public.partners for select using (actif = true or public.is_admin());
create policy announcements_public_read on public.announcements for select using (actif = true or public.is_admin());
create policy enia_content_public_read on public.enia_content for select using (visible = true or public.is_admin());
create policy enia_advantages_public_read on public.enia_advantages for select using (active = true or public.is_admin());
create policy enia_highlights_public_read on public.enia_highlights for select using (true);
create policy enia_fee_public_read on public.enia_fee_items for select using (true);
create policy enia_piece_groups_public_read on public.enia_piece_groups for select using (true);
create policy enia_piece_items_public_read on public.enia_piece_items for select using (true);
create policy enia_partners_public_read on public.enia_partners for select using (actif = true or public.is_admin());
create policy formations_admin_write on public.formations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy modules_admin_write on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy chapters_admin_write on public.chapters for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy module_notions_admin_write on public.module_notions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_settings_admin_write on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy advantages_admin_write on public.advantages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy partners_admin_write on public.partners for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy announcements_admin_write on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_content_admin_write on public.enia_content for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_advantages_admin_write on public.enia_advantages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_highlights_admin_write on public.enia_highlights for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_fee_admin_write on public.enia_fee_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_piece_groups_admin_write on public.enia_piece_groups for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_piece_items_admin_write on public.enia_piece_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy enia_partners_admin_write on public.enia_partners for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public pre-registration only creates a pending record.
alter table public.registrations enable row level security;
alter table public.registration_modules enable row level security;
create policy registrations_public_insert on public.registrations for insert to anon, authenticated with check (statut = 'en_attente');
create policy registrations_admin_all on public.registrations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy registration_modules_public_insert on public.registration_modules for insert to anon, authenticated with check (true);
create policy registration_modules_admin_all on public.registration_modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private tables are deny-by-default, then opened narrowly below.
do $$ declare t text; begin foreach t in array array['teachers','students','student_groups','student_group_members','student_modules','teacher_modules','teacher_module_rates','courses','course_targets','course_files','schedule','schedule_targets','attendance','submissions','submission_files','tests','questions','question_options','test_results','test_answers','grades','invoices','payments','teacher_hours','teacher_payments','conversations','conversation_members','messages','notifications','certificates','certificate_modules','scholarships','audit_logs'] loop execute format('alter table public.%I enable row level security', t); end loop; end $$;

-- Admin full access.
do $$ declare t text; begin foreach t in array array['teachers','students','student_groups','student_group_members','student_modules','teacher_modules','teacher_module_rates','courses','course_targets','course_files','schedule','schedule_targets','attendance','submissions','submission_files','tests','questions','question_options','test_results','test_answers','grades','invoices','payments','teacher_hours','teacher_payments','conversations','conversation_members','messages','notifications','certificates','certificate_modules','scholarships'] loop execute format('create policy %I_admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t); end loop; end $$;

create policy students_self_read on public.students for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy student_modules_self_read on public.student_modules for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy attendance_self_read on public.attendance for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy grades_self_read on public.grades for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy invoices_self_read on public.invoices for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy payments_self_read on public.payments for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy results_self_read on public.test_results for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy certificates_self_read on public.certificates for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy scholarships_self_read on public.scholarships for select to authenticated using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy courses_student_read on public.courses for select to authenticated using (public.is_admin() or (audience = 'module' and module_id in (select module_id from public.student_modules sm join public.students s on s.id = sm.student_id where s.user_id = auth.uid() and sm.active)) or (audience = 'group' and group_id in (select group_id from public.students where user_id = auth.uid())) or id in (select course_id from public.course_targets ct join public.students s on s.id = ct.student_id where s.user_id = auth.uid()));
create policy tests_student_read on public.tests for select to authenticated using (publie = true or public.is_admin());
create policy questions_authenticated_read on public.questions for select to authenticated using (true);
create policy options_authenticated_read on public.question_options for select to authenticated using (true);
create policy teachers_self_read on public.teachers for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy teacher_modules_self_read on public.teacher_modules for select to authenticated using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy teacher_schedule_read on public.schedule for select to authenticated using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy teacher_attendance_manage on public.attendance for all to authenticated using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin()) with check (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy teacher_submissions_manage on public.submissions for all to authenticated using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin()) with check (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy student_submissions_insert on public.submissions for insert to authenticated with check (student_id in (select id from public.students where user_id = auth.uid()));
create policy conversation_member_read on public.conversations for select to authenticated using (id in (select conversation_id from public.conversation_members where user_id = auth.uid()) or public.is_admin());
create policy conversation_member_read_members on public.conversation_members for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy conversation_member_messages on public.messages for select to authenticated using (conversation_id in (select conversation_id from public.conversation_members where user_id = auth.uid()) or public.is_admin());
create policy conversation_member_send on public.messages for insert to authenticated with check (sender_id = auth.uid() and conversation_id in (select conversation_id from public.conversation_members where user_id = auth.uid()));
create policy notifications_self_read on public.notifications for select to authenticated using (user_id = auth.uid() or (user_id is null and auth.uid() is not null) or public.is_admin());
create policy notifications_self_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy audit_logs_superadmin_read on public.audit_logs for select to authenticated using (public.is_superadmin());
create policy audit_logs_insert on public.audit_logs for insert to authenticated with check (auth.uid() = user_id or public.is_admin());

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists students_user_idx on public.students(user_id);
create index if not exists students_formation_idx on public.students(formation_id);
create index if not exists student_modules_student_idx on public.student_modules(student_id);
create index if not exists student_modules_module_idx on public.student_modules(module_id);
create index if not exists teacher_modules_teacher_idx on public.teacher_modules(teacher_id);
create index if not exists courses_module_idx on public.courses(module_id);
create index if not exists courses_teacher_idx on public.courses(teacher_id);
create index if not exists schedule_teacher_idx on public.schedule(teacher_id);
create index if not exists attendance_student_date_idx on public.attendance(student_id, date);
create index if not exists results_student_idx on public.test_results(student_id);
create index if not exists grades_student_idx on public.grades(student_id);
create index if not exists payments_student_idx on public.payments(student_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, read);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;

insert into storage.buckets(id, name, public) values
  ('avatars', 'avatars', false), ('course-files', 'course-files', false), ('submission-files', 'submission-files', false),
  ('certificates', 'certificates', false), ('enia-media', 'enia-media', false), ('public-media', 'public-media', true)
on conflict (id) do nothing;
create policy storage_public_media_read on storage.objects for select using (bucket_id = 'public-media');
create policy storage_authenticated_upload on storage.objects for insert to authenticated with check (bucket_id in ('avatars','course-files','submission-files','certificates','enia-media'));
create policy storage_owner_read on storage.objects for select to authenticated using (owner_id = auth.uid()::text or public.is_admin());
create policy storage_owner_update on storage.objects for update to authenticated using (owner_id = auth.uid()::text or public.is_admin()) with check (owner_id = auth.uid()::text or public.is_admin());
create policy storage_owner_delete on storage.objects for delete to authenticated using (owner_id = auth.uid()::text or public.is_admin());

-- No demo records are inserted.
