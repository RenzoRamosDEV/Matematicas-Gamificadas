# Reto de cálculo 🧮

Juego diario de aritmética para un niño de 10 años. Cuatro fases (sumas, restas, multiplicaciones, divisiones), timer por bloque, puntos y racha. Sitio 100 % estático en GitHub Pages + Supabase (Postgres, Auth y RPC). Acceso por link único, sin login.

**Objetivo de producto: que vuelva mañana.** Fallar no resta, el tiempo es por fase (no por ejercicio), y hay un comodín de racha al mes.

## Stack

| Capa | Elección |
|---|---|
| Front | Vite + React + Tailwind v4 (SPA estática, sin router) |
| Hosting | GitHub Pages vía GitHub Actions |
| DB + Auth | Supabase (proyecto propio) |
| Generación de ejercicios | Cliente, `src/lib/generador.ts` (determinista, sin IA) |
| Corrección, puntos y racha | Postgres RPC `security definer` (`supabase/migrations/0001_init.sql`) |

Regla de oro: **el cliente nunca envía puntos, fechas ni el flag "correcta"**. Envía respuestas; la DB hace el resto.

## Estructura

```
src/
  config.ts            ← EJERCICIOS_POR_FASE, tiempos, puntos, orden de fases
  types.ts
  lib/
    generador.ts       ← genSuma/genResta/genMult/genDiv + cuotas de llevadas + dedupe
    generador.test.ts  ← vitest
    supabase.ts        ← cliente
    auth.ts            ← canje del link único (?u=&t=)
    api.ts             ← selects/inserts y llamadas RPC
    progreso.ts        ← fase actual en localStorage (para sobrevivir a un refresco)
  screens/             ← Inicio · Fase · Transicion · Resumen · SinAcceso
  components/          ← Keypad · Timer · Avatar · Cabecera
supabase/migrations/0001_init.sql   ← tablas, RLS, RPCs (idempotente)
.github/workflows/deploy.yml        ← build + deploy a Pages
.github/workflows/keep-alive.yml    ← ping a Supabase cada 3 días
scripts/token.mjs                   ← genera token + link para un jugador
```

## Puesta en marcha

### 1. Supabase

1. Crea un **proyecto nuevo** (separado de tus otras apps: la config de Auth es global por proyecto).
2. SQL Editor → pega y ejecuta `supabase/migrations/0001_init.sql`.
3. Authentication → Providers → Email: desactiva **"Allow new users to sign up"**. Deja "Confirm email" desactivado o marca "Auto Confirm" al crear usuarios.
4. Crea el jugador:
   ```bash
   node scripts/token.mjs hermano https://renzoramosdev.github.io/Matematicas-Gamificadas/
   ```
   Te imprime email, contraseña (token) y el link. En Authentication → Users → **Add user** crea `hermano@renzoramosdev.github.io` con ese token como contraseña (marca *Auto Confirm User*).
   El dominio del email es el de GitHub Pages porque Supabase Auth rechaza dominios reservados (`.local`, `.test`, `example.com`); se cambia en `CONFIG.AUTH_EMAIL_DOMAIN`.
   El perfil en `profiles` se crea solo (trigger `on_auth_user_created`) con `nombre = hermano`.
5. Project Settings → API: copia **Project URL** y **anon public key**.

Más jugadores: repite el paso 4 con otro nombre (`primo`). Cada uno tiene su fila en `profiles`, sus puntos y su racha. Para revocar un link, cambia la contraseña del usuario en el dashboard.

### 2. GitHub

1. Sube el repo (rama `main`). El nombre del repo se usa como base path automáticamente.
2. Settings → Secrets and variables → Actions → añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
   (Acaban en el bundle público de todas formas; la anon key está hecha para eso, RLS protege los datos.)
3. Settings → Pages → Source: **GitHub Actions**.
4. Push a `main` → el workflow `deploy` publica. `keep-alive` corre cada 3 días para que Supabase no pause el proyecto.

### 3. Mándale el link

`https://renzoramosdev.github.io/Matematicas-Gamificadas/?u=hermano&t=<token>` — lo abre una vez, la sesión queda en `localStorage`, la URL se limpia y a partir de ahí entra directo desde favoritos.

## Desarrollo local

```bash
cp .env.example .env.local   # rellena URL y anon key
npm install
npm run dev                  # http://localhost:5173/Matematicas-Gamificadas/?u=hermano&t=<token>
npm test                     # tests de los generadores
npm run build
```

## Cómo se puntúa (todo en la RPC `finalizar_sesion`)

| Concepto | Puntos |
|---|---|
| Acierto | +10 |
| Fallo / sin responder | 0 (nunca resta) |
| Fase perfecta | +25 |
| Velocidad por fase | +20 si sobra >40 % del tiempo · +10 si sobra >20 % |
| Sesión perfecta | +100 |

**Racha** (con `now()` de Postgres, zona `Europe/Madrid`): ayer → +1; hoy → igual; anteayer con comodín disponible → +1 y gasta el comodín (se recarga 1 cada 30 días); otro caso → 1.

Lo único que el cliente manda que afecta a los puntos es el tiempo restante por fase (para el bonus de velocidad), acotado en la DB a `[0, tiempo_fase]`: como mucho vale +20 por fase.

## Ajustes

- `src/config.ts` → `EJERCICIOS_POR_FASE` (empieza en 5; sube a 10 si lo pide). Con 5 son ~14 min máx.; con 10, ~28.
- Si cambias `TIEMPOS`, cambia también `cfg_tiempo_fase` en el SQL (espejo).
- Dificultad: todo en `src/lib/generador.ts`, con tests en `generador.test.ts`.

## Seguridad: qué está blindado y qué no

- ✅ `profiles` solo tiene policy de SELECT: nadie puede hacer `update profiles set puntos_total = 999999`. Solo la RPC (security definer) escribe puntos y racha.
- ✅ `unique (user_id, fecha)` en `sessions`: una sesión por día. `estado = 'en_curso'` impide finalizar dos veces.
- ✅ El cliente solo puede hacer UPDATE de `respuesta` y `ms` en `exercises` (grant por columnas).
- ⚠️ El cliente inserta los ejercicios, incluido `sol`. Alguien podría insertar `1+1=2` veinte veces. Se deja así a propósito (§6.3 del spec): cerrarlo exige mover los generadores a plpgsql. Si hace falta, la vía es una función `generar_ejercicios(session_id)`.
- ❌ Nunca metas la `service_role` key en el front.
