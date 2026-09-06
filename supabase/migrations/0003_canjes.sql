-- Canjes de recompensas: al canjear, el contador de esa recompensa se reinicia
-- (se apunta con cuántos puntos totales se canjeó) pero los puntos no se gastan.
-- Solo se inserta a través de la RPC, que valida el precio en el servidor.
create table canjes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  recompensa text not null check (recompensa in ('cine', 'comida')),
  puntos int not null,
  created_at timestamptz not null default now()
);
alter table canjes enable row level security;
create policy "cada uno lee sus canjes" on canjes for select using (auth.uid() = user_id);
grant select on canjes to authenticated;

-- Espejo de RECOMPENSAS en src/lib/recompensas.ts
create or replace function cfg_precio_recompensa(p text) returns int
language sql immutable set search_path = public as $$
  select case p when 'cine' then 6000 when 'comida' then 20000 else 0 end
$$;

create or replace function canjear_recompensa(p_recompensa text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_precio int := cfg_precio_recompensa(p_recompensa);
  v_puntos int;
  v_base   int;
  v_id     uuid;
  v_fecha  timestamptz;
begin
  if v_user is null then raise exception 'no autenticado'; end if;
  if v_precio = 0 then raise exception 'recompensa desconocida'; end if;

  -- bloquea el perfil: sin canjes dobles a la vez
  select puntos_total into v_puntos from profiles where id = v_user for update;
  select coalesce(max(puntos), 0) into v_base from canjes where user_id = v_user and recompensa = p_recompensa;
  if v_puntos - v_base < v_precio then raise exception 'todavía no hay puntos suficientes'; end if;

  insert into canjes (user_id, recompensa, puntos) values (v_user, p_recompensa, v_puntos)
    returning id, created_at into v_id, v_fecha;
  return json_build_object('id', v_id, 'recompensa', p_recompensa, 'puntos', v_puntos, 'created_at', v_fecha);
end $$;

revoke execute on function canjear_recompensa(text) from public, anon;
grant  execute on function canjear_recompensa(text) to authenticated;
revoke execute on function cfg_precio_recompensa(text) from public, anon, authenticated;
