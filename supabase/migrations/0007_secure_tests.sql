drop policy if exists questions_authenticated_read on public.questions;
drop policy if exists options_authenticated_read on public.question_options;

create policy teacher_questions_read on public.questions for select to authenticated
using (
  test_id in (
    select t.id from public.tests t
    join public.teachers tr on tr.id = t.teacher_id
    where tr.user_id = auth.uid()
  ) or public.is_admin()
);

create policy teacher_options_read on public.question_options for select to authenticated
using (
  question_id in (
    select q.id from public.questions q
    join public.tests t on t.id = q.test_id
    join public.teachers tr on tr.id = t.teacher_id
    where tr.user_id = auth.uid()
  ) or public.is_admin()
);

create or replace function public.get_student_test(p_test_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_student_id text;
  v_test public.tests%rowtype;
  v_attempts integer;
  v_questions jsonb;
begin
  select id into v_student_id from public.students where user_id = auth.uid() and statut = 'actif' limit 1;
  if v_student_id is null then raise exception 'Profil apprenant requis'; end if;
  select * into v_test from public.tests
  where id = p_test_id and publie = true
    and (date_debut is null or date_debut <= now())
    and (date_fin is null or date_fin >= now())
    and module_id in (select module_id from public.student_modules where student_id = v_student_id and active)
  limit 1;
  if v_test.id is null then raise exception 'Test indisponible'; end if;
  select count(*) into v_attempts from public.test_results where test_id = p_test_id and student_id = v_student_id;
  if v_attempts >= v_test.tentatives_max then raise exception 'Nombre maximal de tentatives atteint'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'question', q.question,
    'type', q.type,
    'points', q.points,
    'ordre', q.ordre,
    'options', coalesce((select jsonb_agg(jsonb_build_object('id', qo.id, 'texte', qo.option_text, 'ordre', qo.ordre) order by qo.ordre) from public.question_options qo where qo.question_id = q.id), '[]'::jsonb)
  ) order by q.ordre), '[]'::jsonb) into v_questions
  from public.questions q where q.test_id = p_test_id;

  return jsonb_build_object(
    'id', v_test.id,
    'titre', v_test.titre,
    'module_id', v_test.module_id,
    'duree', v_test.duree,
    'niveau', v_test.niveau,
    'tentatives_max', v_test.tentatives_max,
    'tentatives_utilisees', v_attempts,
    'corrections', v_test.corrections,
    'questions', v_questions
  );
end;
$$;

revoke all on function public.get_student_test(uuid) from public, anon;
grant execute on function public.get_student_test(uuid) to authenticated;