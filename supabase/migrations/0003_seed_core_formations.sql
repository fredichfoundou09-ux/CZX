-- Core catalog entries are institution structure, not demo students/content.
-- Modules remain empty and must be created intentionally by authorized users.
insert into public.formations(code, name, description, active)
values
  ('informatique', 'Génie Informatique', '', true),
  ('industriel', 'Génie Industriel', '', true)
on conflict (code) do update set name = excluded.name, active = true;