-- Public content fields missing from the initial site_settings structure.
alter table public.site_settings
  add column if not exists apropos jsonb not null default '{}'::jsonb,
  add column if not exists pre_inscription jsonb not null default '{}'::jsonb,
  add column if not exists bourse jsonb not null default '{}'::jsonb;

insert into public.site_settings(id) values (true) on conflict (id) do nothing;
insert into public.enia_content(id) values (true) on conflict (id) do nothing;

-- Minimal server-side throttling metadata for authentication attempts.
create table if not exists public.auth_attempts (
  attempt_key text primary key,
  failures integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);
alter table public.auth_attempts enable row level security;
-- No client policy: only service_role Edge Functions can access this table.

-- Prevent anonymous pre-registration spam from the same email or phone.
create or replace function public.registration_rate_limited(p_email text, p_telephone text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.registrations
    where created_at > now() - interval '15 minutes'
      and (lower(email) = lower(trim(p_email)) or telephone = trim(p_telephone))
  );
$$;
revoke all on function public.registration_rate_limited(text,text) from public, anon, authenticated;
grant execute on function public.registration_rate_limited(text,text) to service_role;

-- The public registration RPC is replaced to include rate limiting.
-- Existing validation/calculation remains in create_public_registration.
create or replace function public.create_public_registration_guarded(
  p_nom text, p_prenom text, p_telephone text, p_whatsapp text,
  p_email text, p_niveau text, p_formation_code text, p_module_ids uuid[]
) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.registrations
    where created_at > now() - interval '15 minutes'
      and (lower(email) = lower(trim(p_email)) or telephone = trim(p_telephone))
  ) then
    raise exception 'Une pré-inscription récente existe déjà pour ces coordonnées.';
  end if;
  return public.create_public_registration(p_nom, p_prenom, p_telephone, p_whatsapp, p_email, p_niveau, p_formation_code, p_module_ids);
end;
$$;
revoke all on function public.create_public_registration_guarded(text,text,text,text,text,text,text,uuid[]) from public;
grant execute on function public.create_public_registration_guarded(text,text,text,text,text,text,text,uuid[]) to anon, authenticated;