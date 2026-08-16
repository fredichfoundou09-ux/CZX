revoke execute on function public.promote_first_superadmin() from authenticated;

create or replace function public.bootstrap_superadmin(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(74202601);
  if exists (select 1 from public.profiles where role = 'superadmin' and active) then
    return false;
  end if;
  update public.profiles set role = 'superadmin', active = true where id = p_user_id;
  return found;
end;
$$;

revoke all on function public.bootstrap_superadmin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_superadmin(uuid) to service_role;