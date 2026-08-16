-- Business configuration, collision-safe identifiers and missing domain RLS.

create table if not exists public.fee_settings (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid references public.formations(id) on delete cascade,
  code text not null,
  label text not null,
  amount numeric(12,2) not null check (amount >= 0),
  module_count integer check (module_count is null or module_count > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formation_id, code, module_count)
);

alter table public.fee_settings enable row level security;
create policy fee_settings_public_read on public.fee_settings for select using (active = true or public.is_admin());
create policy fee_settings_admin_all on public.fee_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger fee_settings_touch_updated_at before update on public.fee_settings for each row execute function public.touch_updated_at();

create table if not exists public.student_number_counters (
  year integer primary key,
  last_value integer not null default 0 check (last_value >= 0)
);
alter table public.student_number_counters enable row level security;
create policy student_counters_admin_read on public.student_number_counters for select to authenticated using (public.is_admin());

create or replace function public.generate_student_id()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer := extract(year from current_date)::integer;
  next_value integer;
begin
  insert into public.student_number_counters(year, last_value)
  values (current_year, 1)
  on conflict (year) do update
    set last_value = public.student_number_counters.last_value + 1
  returning last_value into next_value;
  return 'SN-' || current_year || '-' || lpad(next_value::text, 5, '0');
end;
$$;
revoke all on function public.generate_student_id() from public;
grant execute on function public.generate_student_id() to authenticated;

create or replace view public.student_financial_summary
with (security_invoker = true)
as
select
  s.id as student_id,
  coalesce((select sum(i.montant) from public.invoices i where i.student_id = s.id), 0)::numeric(12,2) as total_billed,
  coalesce((select sum(p.montant) from public.payments p where p.student_id = s.id), 0)::numeric(12,2) as total_paid,
  greatest(
    coalesce((select sum(i.montant) from public.invoices i where i.student_id = s.id), 0)
    - coalesce((select sum(p.montant) from public.payments p where p.student_id = s.id), 0),
    0
  )::numeric(12,2) as balance,
  case
    when coalesce((select sum(p.montant) from public.payments p where p.student_id = s.id), 0) = 0 then 'non_paye'
    when coalesce((select sum(p.montant) from public.payments p where p.student_id = s.id), 0)
      < coalesce((select sum(i.montant) from public.invoices i where i.student_id = s.id), 0) then 'partiel'
    else 'paye'
  end as financial_status
from public.students s;

create or replace view public.teacher_payroll_summary
with (security_invoker = true)
as
select
  t.id as teacher_id,
  coalesce(sum(h.heures) filter (where h.valide), 0)::numeric(8,2) as validated_hours,
  coalesce(sum(h.montant) filter (where h.valide), 0)::numeric(12,2) as amount_due,
  coalesce((select sum(tp.montant) from public.teacher_payments tp where tp.teacher_id = t.id), 0)::numeric(12,2) as amount_paid,
  greatest(
    coalesce(sum(h.montant) filter (where h.valide), 0)
    - coalesce((select sum(tp.montant) from public.teacher_payments tp where tp.teacher_id = t.id), 0),
    0
  )::numeric(12,2) as balance
from public.teachers t
left join public.teacher_hours h on h.teacher_id = t.id
group by t.id;

create or replace function public.verify_certificate(p_number text)
returns table (
  numero text,
  student_name text,
  formation_name text,
  periode text,
  resultat text,
  note numeric,
  issued_on date
)
language sql
stable
security definer
set search_path = public
as $$
  select c.numero, concat(s.prenom, ' ', s.nom), f.name, c.periode, c.resultat, c.note, c.date
  from public.certificates c
  join public.students s on s.id = c.student_id
  join public.formations f on f.id = c.formation_id
  where c.numero = p_number
  limit 1;
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Teacher ownership and student-target policies missing from the initial migration.
create policy teacher_courses_manage on public.courses for all to authenticated
using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin())
with check (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());

create policy course_files_authorized_read on public.course_files for select to authenticated
using (
  course_id in (select id from public.courses)
  or public.is_admin()
);

create policy teacher_course_files_insert on public.course_files for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and course_id in (
    select c.id from public.courses c
    join public.teachers t on t.id = c.teacher_id
    where t.user_id = auth.uid()
  )
  or public.is_admin()
);

create policy schedule_student_read on public.schedule for select to authenticated
using (
  public.is_admin()
  or teacher_id in (select id from public.teachers where user_id = auth.uid())
  or id in (
    select st.schedule_id from public.schedule_targets st
    join public.students s on s.id = st.student_id
    where s.user_id = auth.uid()
  )
  or group_id in (select group_id from public.students where user_id = auth.uid())
  or module_id in (
    select sm.module_id from public.student_modules sm
    join public.students s on s.id = sm.student_id
    where s.user_id = auth.uid() and sm.active
  )
);

create policy submissions_student_read on public.submissions for select to authenticated
using (student_id in (select id from public.students where user_id = auth.uid()) or public.is_admin());
create policy submissions_student_update on public.submissions for update to authenticated
using (student_id in (select id from public.students where user_id = auth.uid()) and not valide)
with check (student_id in (select id from public.students where user_id = auth.uid()));

create policy submission_files_authorized_read on public.submission_files for select to authenticated
using (
  submission_id in (
    select sub.id from public.submissions sub
    where sub.student_id in (select id from public.students where user_id = auth.uid())
       or sub.teacher_id in (select id from public.teachers where user_id = auth.uid())
  )
  or public.is_admin()
);

create policy submission_files_student_insert on public.submission_files for insert to authenticated
with check (
  submission_id in (
    select sub.id from public.submissions sub
    where sub.student_id in (select id from public.students where user_id = auth.uid())
  )
  or public.is_admin()
);

create policy teacher_tests_manage on public.tests for all to authenticated
using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin())
with check (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy teacher_questions_manage on public.questions for all to authenticated
using (test_id in (select id from public.tests where teacher_id in (select id from public.teachers where user_id = auth.uid())) or public.is_admin())
with check (test_id in (select id from public.tests where teacher_id in (select id from public.teachers where user_id = auth.uid())) or public.is_admin());
create policy teacher_options_manage on public.question_options for all to authenticated
using (question_id in (select q.id from public.questions q join public.tests t on t.id = q.test_id where t.teacher_id in (select id from public.teachers where user_id = auth.uid())) or public.is_admin())
with check (question_id in (select q.id from public.questions q join public.tests t on t.id = q.test_id where t.teacher_id in (select id from public.teachers where user_id = auth.uid())) or public.is_admin());

create policy results_student_insert on public.test_results for insert to authenticated
with check (student_id in (select id from public.students where user_id = auth.uid()));
create policy answers_student_insert on public.test_answers for insert to authenticated
with check (result_id in (select tr.id from public.test_results tr where tr.student_id in (select id from public.students where user_id = auth.uid())));
create policy answers_student_read on public.test_answers for select to authenticated
using (result_id in (select tr.id from public.test_results tr where tr.student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

create policy teacher_grades_manage on public.grades for all to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy teacher_hours_self_read on public.teacher_hours for select to authenticated
using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());
create policy teacher_payments_self_read on public.teacher_payments for select to authenticated
using (teacher_id in (select id from public.teachers where user_id = auth.uid()) or public.is_admin());

create index if not exists fee_settings_formation_idx on public.fee_settings(formation_id, active);
create index if not exists teacher_hours_teacher_date_idx on public.teacher_hours(teacher_id, date);
create index if not exists teacher_payments_teacher_date_idx on public.teacher_payments(teacher_id, date);