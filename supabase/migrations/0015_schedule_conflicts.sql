-- Reject overlapping teacher or room slots before they reach the UI.
create or replace function public.prevent_schedule_conflict()
returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.schedule s
    where s.id <> coalesce(new.id, gen_random_uuid())
      and s.jour = new.jour
      and (s.date is not distinct from new.date)
      and (s.teacher_id = new.teacher_id or lower(s.salle) = lower(new.salle))
      and s.heure_debut < new.heure_fin
      and s.heure_fin > new.heure_debut
  ) then
    raise exception 'Conflit de planning : enseignant ou salle déjà occupé sur ce créneau.';
  end if;
  return new;
end;
$$;

drop trigger if exists schedule_prevent_conflict on public.schedule;
create trigger schedule_prevent_conflict
before insert or update on public.schedule
for each row execute function public.prevent_schedule_conflict();
