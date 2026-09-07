-- Juego extra "Adivina la bandera": banderas distintas adivinadas por jugador,
-- candado de una ronda al día y puntos sumados por RPC (+2 acierto, +3 con tilde).
-- El servidor no conoce los nombres de los países (los valida el cliente), pero
-- acota el daño: hay que abrir ronda, máximo 20 aciertos al día y 3 puntos por acierto.
create table banderas (
  user_id uuid not null default auth.uid() references profiles(id) on delete cascade,
  codigo text not null check (codigo ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, codigo)
);
alter table banderas enable row level security;
create policy "cada uno lee sus banderas" on banderas for select using (auth.uid() = user_id);
grant select on banderas to authenticated;

alter table profiles add column banderas_dia date;          -- último día que entró al juego
alter table profiles add column banderas_hoy int not null default 0; -- aciertos de la ronda de hoy

create or replace function banderas_empezar()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_hoy  date := (now() at time zone 'Europe/Madrid')::date;
  v_dia  date;
begin
  if v_user is null then raise exception 'no autenticado'; end if;
  select banderas_dia into v_dia from profiles where id = v_user for update;
  if v_dia = v_hoy then raise exception 'hoy ya has jugado'; end if;
  update profiles set banderas_dia = v_hoy, banderas_hoy = 0 where id = v_user;
  return json_build_object('ok', true);
end $$;

create or replace function banderas_acierto(p_codigo text, p_con_tilde boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid := auth.uid();
  v_hoy    date := (now() at time zone 'Europe/Madrid')::date;
  v_pts    int := case when p_con_tilde then 3 else 2 end;
  v_dia    date;
  v_n      int;
  v_nueva  boolean;
  v_total  int;
  v_puntos int;
begin
  if v_user is null then raise exception 'no autenticado'; end if;
  if p_codigo !~ '^[A-Z]{2}$' then raise exception 'código inválido'; end if;
  select banderas_dia, banderas_hoy into v_dia, v_n from profiles where id = v_user for update;
  if v_dia is distinct from v_hoy then raise exception 'la ronda no está empezada'; end if;
  if v_n >= 20 then raise exception 'la ronda de hoy ya está completa'; end if;

  insert into banderas (user_id, codigo) values (v_user, p_codigo) on conflict do nothing;
  v_nueva := found;
  update profiles set puntos_total = puntos_total + v_pts, banderas_hoy = banderas_hoy + 1
   where id = v_user returning puntos_total into v_puntos;
  select count(*)::int into v_total from banderas where user_id = v_user;

  return json_build_object('nueva', v_nueva, 'total', v_total, 'puntos', v_pts, 'puntos_total', v_puntos);
end $$;

revoke execute on function banderas_empezar() from public, anon;
revoke execute on function banderas_acierto(text, boolean) from public, anon;
grant  execute on function banderas_empezar() to authenticated;
grant  execute on function banderas_acierto(text, boolean) to authenticated;
