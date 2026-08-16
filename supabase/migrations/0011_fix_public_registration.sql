-- Robustesse de la pré-inscription publique :
--  * accepte une liste de modules vide (catalogue pas encore publié) ;
--  * ne bloque pas si aucune grille tarifaire n'est encore configurée ;
--  * crée la formation manquante plutôt que de rejeter la demande ;
--  * messages d'erreur explicites pour le visiteur.

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
  -- Validation des champs obligatoires
  if length(trim(coalesce(p_nom, ''))) < 2 or length(trim(coalesce(p_prenom, ''))) < 2 then
    raise exception 'Le nom et le prénom sont obligatoires.';
  end if;
  if length(trim(coalesce(p_telephone, ''))) < 4 then
    raise exception 'Un numéro de téléphone valide est obligatoire.';
  end if;
  if coalesce(p_email, '') !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Adresse email invalide.';
  end if;
  if p_formation_code not in ('informatique', 'industriel') then
    raise exception 'Formation inconnue.';
  end if;

  -- Formation : récupérée ou créée à la volée si le catalogue n'est pas encore configuré
  select id into v_formation_id
  from public.formations
  where code = p_formation_code and active
  limit 1;

  if v_formation_id is null then
    insert into public.formations(code, name, description, active)
    values (
      p_formation_code,
      case when p_formation_code = 'informatique' then 'Génie Informatique' else 'Génie Industriel' end,
      '',
      true
    )
    on conflict (code) do update set active = true
    returning id into v_formation_id;
  end if;

  -- Modules : facultatifs, mais s'ils sont fournis ils doivent être valides
  v_module_count := coalesce(array_length(p_module_ids, 1), 0);
  if v_module_count > 0 then
    select count(*) into v_invalid_count
    from unnest(p_module_ids) requested(id)
    left join public.modules m
      on m.id = requested.id and m.formation_id = v_formation_id and m.active
    where m.id is null;

    if v_invalid_count > 0 then
      raise exception 'Un ou plusieurs modules sélectionnés sont invalides.';
    end if;
  end if;

  -- Frais : optionnels tant que la grille tarifaire n'est pas configurée
  select coalesce(amount, 0) into v_inscription
  from public.fee_settings
  where code = 'inscription' and active
    and (formation_id = v_formation_id or formation_id is null)
  order by (formation_id is not null) desc
  limit 1;

  if v_module_count > 0 then
    select coalesce(amount, 0), coalesce(label, '')
      into v_formation_fee, v_formula
    from public.fee_settings
    where code = 'formation' and active
      and formation_id = v_formation_id
      and module_count >= v_module_count
    order by module_count asc
    limit 1;
  end if;

  insert into public.registrations(
    nom, prenom, telephone, whatsapp, email, niveau,
    formation_id, montant_estime, formule, statut
  )
  values (
    trim(p_nom), trim(p_prenom), trim(p_telephone),
    coalesce(nullif(trim(coalesce(p_whatsapp, '')), ''), trim(p_telephone)),
    lower(trim(p_email)), trim(coalesce(p_niveau, '')),
    v_formation_id,
    coalesce(v_inscription, 0) + coalesce(v_formation_fee, 0),
    coalesce(v_formula, ''),
    'en_attente'
  )
  returning id into v_registration_id;

  if v_module_count > 0 then
    insert into public.registration_modules(registration_id, module_id)
    select v_registration_id, id from unnest(p_module_ids) as ids(id);
  end if;

  -- Notification de l'administration
  insert into public.notifications(user_id, title, body, type)
  select id,
         'Nouvelle pré-inscription',
         concat(trim(p_prenom), ' ', trim(p_nom), ' a soumis une pré-inscription.'),
         'info'
  from public.profiles
  where role in ('admin', 'superadmin') and active;

  return jsonb_build_object(
    'id', v_registration_id,
    'montant_estime', coalesce(v_inscription, 0) + coalesce(v_formation_fee, 0),
    'formule', coalesce(v_formula, '')
  );
end;
$$;

revoke all on function public.create_public_registration(text,text,text,text,text,text,text,uuid[]) from public;
grant execute on function public.create_public_registration(text,text,text,text,text,text,text,uuid[]) to anon, authenticated;

-- Index utile pour le suivi administratif des pré-inscriptions
create index if not exists registrations_statut_created_idx
  on public.registrations(statut, created_at desc);
