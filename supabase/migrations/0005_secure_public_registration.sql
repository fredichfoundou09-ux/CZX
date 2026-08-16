drop policy if exists registrations_public_insert on public.registrations;
drop policy if exists registration_modules_public_insert on public.registration_modules;

create or replace function public.create_public_registration(
  p_nom text,
  p_prenom text,
  p_telephone text,
  p_whatsapp text,
  p_email text,
  p_niveau text,
  p_formation_code text,
  p_module_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_formation_id uuid;
  v_registration_id uuid;
  v_module_count integer;
  v_invalid_count integer;
  v_inscription numeric(12,2) := 0;
  v_formation_fee numeric(12,2) := 0;
  v_formula text := '';
begin
  if length(trim(p_nom)) < 2 or length(trim(p_prenom)) < 2 then raise exception 'Nom et prénom requis'; end if;
  if p_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'Email invalide'; end if;

  select id into v_formation_id from public.formations where code = p_formation_code and active limit 1;
  if v_formation_id is null then raise exception 'Formation indisponible'; end if;

  v_module_count := coalesce(array_length(p_module_ids, 1), 0);
  select count(*) into v_invalid_count
  from unnest(coalesce(p_module_ids, '{}'::uuid[])) requested(id)
  left join public.modules m on m.id = requested.id and m.formation_id = v_formation_id and m.active
  where m.id is null;
  if v_invalid_count > 0 then raise exception 'Un ou plusieurs modules sont invalides'; end if;

  select coalesce(amount, 0) into v_inscription
  from public.fee_settings
  where code = 'inscription' and active and (formation_id = v_formation_id or formation_id is null)
  order by (formation_id is not null) desc limit 1;

  select coalesce(amount, 0), label into v_formation_fee, v_formula
  from public.fee_settings
  where code = 'formation' and active and formation_id = v_formation_id and module_count >= greatest(v_module_count, 1)
  order by module_count asc limit 1;

  insert into public.registrations(nom, prenom, telephone, whatsapp, email, niveau, formation_id, montant_estime, formule, statut)
  values (trim(p_nom), trim(p_prenom), trim(p_telephone), trim(p_whatsapp), lower(trim(p_email)), trim(p_niveau), v_formation_id, coalesce(v_inscription,0) + coalesce(v_formation_fee,0), coalesce(v_formula,''), 'en_attente')
  returning id into v_registration_id;

  insert into public.registration_modules(registration_id, module_id)
  select v_registration_id, id from unnest(coalesce(p_module_ids, '{}'::uuid[])) as ids(id);

  insert into public.notifications(user_id, title, body, type)
  select id, 'Nouvelle pré-inscription', concat(trim(p_prenom), ' ', trim(p_nom), ' a soumis une pré-inscription.'), 'system'
  from public.profiles where role in ('admin','superadmin') and active;

  return jsonb_build_object(
    'id', v_registration_id,
    'montant_estime', coalesce(v_inscription,0) + coalesce(v_formation_fee,0),
    'formule', coalesce(v_formula,'')
  );
end;
$$;

revoke all on function public.create_public_registration(text,text,text,text,text,text,text,uuid[]) from public;
grant execute on function public.create_public_registration(text,text,text,text,text,text,text,uuid[]) to anon, authenticated;