-- Force password change for accounts created by administrators.
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

create index if not exists profiles_must_change_password_idx
  on public.profiles(must_change_password)
  where must_change_password = true;

comment on column public.profiles.must_change_password is
  'When true, the user must change the temporary administrator-provided password after login.';
