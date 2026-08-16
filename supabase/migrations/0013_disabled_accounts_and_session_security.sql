-- A disabled profile may still possess an Auth JWT. Every RLS decision must
-- therefore require an active profile, independently from the login UI.

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce(exists (
    select 1 from public.profiles where id = auth.uid() and active
  ), false);
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active;
$$;

drop policy if exists profiles_read_own_or_admin on public.profiles;
drop policy if exists profiles_update_own_safe on public.profiles;
create policy profiles_read_own_or_admin on public.profiles for select to authenticated
using ((id = auth.uid() and active) or public.is_admin());
create policy profiles_update_own_safe on public.profiles for update to authenticated
using (id = auth.uid() and active)
with check (id = auth.uid() and active);

drop policy if exists students_self_read on public.students;
create policy students_self_read on public.students for select to authenticated
using ((public.is_active_user() and user_id = auth.uid()) or public.is_admin());

drop policy if exists student_modules_self_read on public.student_modules;
create policy student_modules_self_read on public.student_modules for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists attendance_self_read on public.attendance;
create policy attendance_self_read on public.attendance for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists grades_self_read on public.grades;
create policy grades_self_read on public.grades for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists invoices_self_read on public.invoices;
create policy invoices_self_read on public.invoices for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists payments_self_read on public.payments;
create policy payments_self_read on public.payments for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists results_self_read on public.test_results;
create policy results_self_read on public.test_results for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists certificates_self_read on public.certificates;
create policy certificates_self_read on public.certificates for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists scholarships_self_read on public.scholarships;
create policy scholarships_self_read on public.scholarships for select to authenticated
using ((public.is_active_user() and student_id in (select id from public.students where user_id = auth.uid())) or public.is_admin());

drop policy if exists teachers_self_read on public.teachers;
create policy teachers_self_read on public.teachers for select to authenticated
using ((public.is_active_user() and user_id = auth.uid()) or public.is_admin());

create policy teacher_students_read on public.students for select to authenticated
using (
  public.is_active_user()
  and exists (
    select 1
    from public.student_modules sm
    join public.teacher_modules tm on tm.module_id = sm.module_id
    join public.teachers t on t.id = tm.teacher_id
    where sm.student_id = students.id
      and sm.active
      and t.user_id = auth.uid()
  )
);

drop policy if exists conversation_member_read on public.conversations;
create policy conversation_member_read on public.conversations for select to authenticated
using (public.is_active_user() and (id in (select conversation_id from public.conversation_members where user_id = auth.uid()) or public.is_admin()));
drop policy if exists conversation_member_messages on public.messages;
create policy conversation_member_messages on public.messages for select to authenticated
using (public.is_active_user() and (conversation_id in (select conversation_id from public.conversation_members where user_id = auth.uid()) or public.is_admin()));
drop policy if exists conversation_member_send on public.messages;
create policy conversation_member_send on public.messages for insert to authenticated
with check (public.is_active_user() and sender_id = auth.uid() and conversation_id in (select conversation_id from public.conversation_members where user_id = auth.uid()));

drop policy if exists notifications_self_read on public.notifications;
create policy notifications_self_read on public.notifications for select to authenticated
using (public.is_active_user() and (user_id = auth.uid() or user_id is null or public.is_admin()));
drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications for update to authenticated
using (public.is_active_user() and user_id = auth.uid())
with check (public.is_active_user() and user_id = auth.uid());

-- Storage also rejects disabled accounts.
drop policy if exists avatars_own_insert on storage.objects;
create policy avatars_own_insert on storage.objects for insert to authenticated
with check (public.is_active_user() and bucket_id = 'avatars' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
drop policy if exists course_files_staff_insert on storage.objects;
create policy course_files_staff_insert on storage.objects for insert to authenticated
with check (public.is_active_user() and bucket_id = 'course-files' and (public.current_role() = 'teacher' or public.is_admin()));
drop policy if exists submissions_own_insert on storage.objects;
create policy submissions_own_insert on storage.objects for insert to authenticated
with check (public.is_active_user() and bucket_id = 'submission-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

grant execute on function public.is_active_user() to authenticated;