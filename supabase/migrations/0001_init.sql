-- =====================================================================
-- Reto de cálculo — esquema completo. Ejecutar en el SQL Editor de Supabase.
-- Idempotente: se puede re-ejecutar sin romper nada.
-- =====================================================================

-- ---------- Tablas ----------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null unique,          -- el que sale en el saludo
  avatar_url text,                      -- null = usa inicial + color
  puntos_total int not null default 0,
  racha_actual int not null default 0,
  racha_max int not null default 0,
  ultima_sesion_fecha date,
  comodines_disponibles int not null default 1,
  ultimo_comodin_fecha date             -- para recargar 1 comodín cada 30 días
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  fecha date not null,
  estado text not null default 'en_curso' check (estado in ('en_curso', 'completada')),
  puntos int not null default 0,
  detalle jsonb,                              -- desglose por fase que devuelve finalizar_sesion
  comentario text,
  created_at timestamptz not null default now(),
  unique (user_id, fecha)                     -- una sesión por día: candado anti-farmeo
);

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  orden int not null,
  op text not null check (op in ('suma', 'resta', 'mult', 'div')),
  a int not null,
  b int not null,
  sol int not null,
  respuesta int,
  correcta boolean,          -- lo escribe la RPC, nunca el cliente
  ms int,
  unique (session_id, orden)
);
create index if not exists exercises_session_idx on exercises(session_id);

-- tabla tonta solo para el keep-alive (workflow keep-alive.yml)
create table if not exists heartbeat (id int primary key default 1, ts timestamptz default now());
insert into heartbeat (id) values (1) on conflict do nothing;

-- ---------- Perfil automático al crear el usuario en el dashboard -----
-- nombre = parte local del email (hermano@renzoramosdev.github.io → "hermano"),
-- o raw_user_meta_data.nombre si se indicó.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- RLS -------------------------------------------------------
alter table profiles  enable row level security;
alter table sessions  enable row level security;
alter table exercises enable row level security;
alter table heartbeat enable row level security;

drop policy if exists "propio perfil" on profiles;
create policy "propio perfil" on profiles
  for select using ((select auth.uid()) = id);
-- OJO: sin policy de UPDATE en profiles. Los puntos solo los toca la RPC.

drop policy if exists "propias sesiones" on sessions;
create policy "propias sesiones" on sessions
  for all using ((select auth.uid()) = user_id);

drop policy if exists "propios ejercicios" on exercises;
create policy "propios ejercicios" on exercises
  for all using (
    exists (select 1 from sessions s
            where s.id = exercises.session_id and s.user_id = (select auth.uid()))
  );

drop policy if exists "heartbeat público" on heartbeat;
create policy "heartbeat público" on heartbeat for select using (true);

-- Endurecimiento barato: el cliente solo puede modificar respuesta y ms.
-- (sol, correcta, a, b, op quedan fuera de su alcance vía UPDATE).
revoke update on exercises from authenticated, anon;
grant  update (respuesta, ms) on exercises to authenticated;

-- ---------- Constantes de puntuación (espejo de src/config.ts) --------
create or replace function cfg_tiempo_fase(p_op text) returns int
language sql immutable set search_path = public as $$
  select case p_op when 'suma' then 120 when 'resta' then 150
                   when 'mult' then 300 when 'div' then 270 else 0 end
$$;

-- ---------- RPC: iniciar sesión del día --------------------------------
-- Devuelve la sesión de hoy o la crea. Idempotente. La fecha la pone Postgres.
create or replace function iniciar_sesion()
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hoy  date := (now() at time zone 'Europe/Madrid')::date;
  v_id   uuid;
begin
  if v_user is null then raise exception 'no autenticado'; end if;

  select id into v_id from sessions where user_id = v_user and fecha = v_hoy;
  if v_id is not null then return v_id; end if;

  insert into sessions (user_id, fecha) values (v_user, v_hoy)
    on conflict (user_id, fecha) do update set fecha = excluded.fecha
    returning id into v_id;
  return v_id;
end $$;

-- ---------- RPC: finalizar sesión --------------------------------------
-- p_tiempos_restantes: {"suma": 34, "resta": 0, "mult": 120, "div": 80}
-- segundos que sobraron en cada fase (para el bonus de velocidad).
-- Es el único dato que manda el cliente que influye en puntos; se acota
-- a [0, tiempo_fase] y como mucho vale +20 por fase.
create or replace function finalizar_sesion(p_session_id uuid, p_tiempos_restantes jsonb default '{}'::jsonb)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  c_acierto        constant int := 10;
  c_fase_perfecta  constant int := 25;
  c_sesion_perf    constant int := 100;
  c_vel_alta       constant int := 20;   -- >40% del tiempo restante
  c_vel_media      constant int := 10;   -- >20% del tiempo restante

  v_user     uuid := auth.uid();
  v_hoy      date := (now() at time zone 'Europe/Madrid')::date;
  v_ultima   date;
  v_racha_prev int;
  v_comodines  int;
  v_ultimo_comodin date;
  v_comodin_usado boolean := false;

  v_total    int := 0;
  v_ok       int := 0;
  v_puntos   int := 0;
  v_racha    int;
  v_fases    jsonb := '[]'::jsonb;

  f record;
  v_tiempo_fase int;
  v_restante    int;
  v_pct         numeric;
  v_bonus_perf  int;
  v_bonus_vel   int;
  v_pts_fase    int;
begin
  if v_user is null then raise exception 'no autenticado'; end if;

  -- la sesión tiene que ser suya y estar en curso (bloqueamos la fila: sin doble cobro)
  perform 1 from sessions
   where id = p_session_id and user_id = v_user and estado = 'en_curso'
   for update;
  if not found then raise exception 'sesión inválida'; end if;

  -- corrige contra sol; el cliente nunca manda "correcta"
  update exercises
     set correcta = (respuesta is not null and respuesta = sol)
   where session_id = p_session_id;

  -- desglose por fase, en el orden de juego
  for f in
    select op, count(*)::int as total, count(*) filter (where correcta)::int as ok
      from exercises where session_id = p_session_id
     group by op
     order by array_position(array['suma','resta','mult','div'], op)
  loop
    v_tiempo_fase := cfg_tiempo_fase(f.op);
    v_restante := coalesce((p_tiempos_restantes->>f.op)::int, 0);
    v_restante := greatest(0, least(v_restante, v_tiempo_fase));
    v_pct := case when v_tiempo_fase > 0 then v_restante::numeric / v_tiempo_fase else 0 end;

    v_bonus_perf := case when f.ok = f.total and f.total > 0 then c_fase_perfecta else 0 end;
    v_bonus_vel  := case when v_pct > 0.40 then c_vel_alta
                         when v_pct > 0.20 then c_vel_media
                         else 0 end;
    v_pts_fase := f.ok * c_acierto + v_bonus_perf + v_bonus_vel;

    v_total  := v_total + f.total;
    v_ok     := v_ok + f.ok;
    v_puntos := v_puntos + v_pts_fase;
    v_fases  := v_fases || jsonb_build_object(
      'op', f.op, 'aciertos', f.ok, 'total', f.total,
      'bonus_perfecta', v_bonus_perf, 'bonus_velocidad', v_bonus_vel, 'puntos', v_pts_fase);
  end loop;

  if v_ok = v_total and v_total > 0 then
    v_puntos := v_puntos + c_sesion_perf;
  end if;

  -- racha, con fecha del servidor
  select ultima_sesion_fecha, racha_actual, comodines_disponibles, ultimo_comodin_fecha
    into v_ultima, v_racha_prev, v_comodines, v_ultimo_comodin
    from profiles where id = v_user for update;

  -- recarga: 1 comodín cada 30 días
  if v_comodines < 1 and (v_ultimo_comodin is null or v_ultimo_comodin <= v_hoy - 30) then
    v_comodines := 1;
  end if;

  if v_ultima = v_hoy then
    v_racha := v_racha_prev;                       -- ya jugó hoy (no debería pasar)
  elsif v_ultima = v_hoy - 1 then
    v_racha := v_racha_prev + 1;
  elsif v_ultima = v_hoy - 2 and v_comodines > 0 then
    v_racha := v_racha_prev + 1;                   -- faltó un día: gasta comodín
    v_comodines := 0;
    v_ultimo_comodin := v_hoy;
    v_comodin_usado := true;
  else
    v_racha := 1;
  end if;

  update profiles set
    puntos_total = puntos_total + v_puntos,
    racha_actual = v_racha,
    racha_max    = greatest(racha_max, v_racha),
    ultima_sesion_fecha = v_hoy,
    comodines_disponibles = v_comodines,
    ultimo_comodin_fecha  = v_ultimo_comodin
  where id = v_user;

  update sessions set estado = 'completada', puntos = v_puntos, detalle = v_fases
   where id = p_session_id;

  return json_build_object(
    'puntos', v_puntos, 'aciertos', v_ok, 'total', v_total,
    'sesion_perfecta', (v_ok = v_total and v_total > 0),
    'racha', v_racha, 'comodin_usado', v_comodin_usado,
    'fases', v_fases);
end $$;

-- ---------- Permisos de ejecución ---------------------------------------
-- Postgres concede EXECUTE a PUBLIC por defecto: hay que revocar de public,
-- no solo de anon. Solo los usuarios autenticados llaman a las RPCs.
revoke execute on function iniciar_sesion() from public, anon;
revoke execute on function finalizar_sesion(uuid, jsonb) from public, anon;
grant  execute on function iniciar_sesion() to authenticated;
grant  execute on function finalizar_sesion(uuid, jsonb) to authenticated;

-- Internas: el trigger y la constante corren como owner; fuera de la API.
revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function cfg_tiempo_fase(text) from public, anon, authenticated;
