-- El estilo elegido viaja con la cuenta: columna en profiles.
-- El permiso de UPDATE es SOLO de esta columna (grant por columna), así que
-- aunque haya policy de update, puntos/racha/comodines siguen siendo cosa de la RPC.
alter table profiles add column tema text not null default 'cristal'
  check (tema in ('cristal', 'papel', 'terminal', 'pop'));

create policy "cada uno cambia su tema" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

grant update (tema) on profiles to authenticated;
