# Reto Diario 🧮

Juego web para practicar **cálculo mental** un rato cada día. Un reto diario de cuatro fases —sumas, restas, multiplicaciones y divisiones—, con tiempo por fase, puntos, racha con comodín, insignias, calendario de progreso y **recompensas de verdad** pactadas en casa. Pensado para niños de primaria (8–12 años) y para cualquiera que quiera entrenar el cálculo.

Sitio 100 % estático en **GitHub Pages** + **Supabase** (Postgres, Auth y RPC). Login con usuario y contraseña, sin registro público. Modo claro/oscuro según el dispositivo y **cuatro estilos para elegir** (cristal, papel de cole, terminal retro y póster pop) que viajan con la cuenta.

**Objetivo de producto: que vuelva mañana.** Fallar no resta, el tiempo es por fase (no por cuenta) y hay un comodín que salva un día perdido.

## Cómo se juega

- Un reto nuevo cada día: **20 cuentas** (5 por operación). El jugador **elige el orden** de las fases; el tiempo de cada fase empieza al elegirla.
- Las respuestas se escriben **como en papel**: de derecha a izquierda (unidades primero) en suma, resta y multiplicación; de izquierda a derecha en la división, que se presenta con **la caja de toda la vida** (dividendo, divisor, cociente y resto). Todas las cuentas van en **casillas de colores**: primer número rosa, segundo amarillo, respuesta azul.
- Los puntos y la racha **solo se suman al completar las cuatro fases**.
- Al terminar, **corrección** de cada cuenta: la respuesta dada y la correcta.
- **Recompensas**: premios reales canjeables con los puntos —ir al cine cada 6.000, comida fuera cada 12.000—. Al canjear (con confirmación), el contador de esa recompensa se reinicia **sin gastar los puntos totales** y el servidor **avisa por correo a los padres** automáticamente.
- **Mi progreso**: calendario mensual con el color de cada día (verde todo bien, amarillo algún fallo, rojo todo mal, círculo rojo hueco «No entró», gris sin reto), apuntes personales por día y el registro de días sin entrar (total y mayor tanda).
- **Mis logros**: 47 insignias por constancia, aciertos por operación, perfección, velocidad y banderas.
- **Extras · Adivina la bandera**: una ronda al día de 20 banderas de países (emoji → nombre), con 1 minuto por bandera y sin salida salvo rendirse. +2 puntos por acierto (a la cuenta, al momento) y +3 si escribe el país con su tilde; medallas por banderas distintas adivinadas (10/25/50/100/195). Es opcional: la racha no depende de él.
- **Estilo del juego**: desde el menú del perfil se elige entre cuatro temas completos (Cristal, Papel de cole, Terminal retro y Póster pop); se guarda en la cuenta y se aplica en cualquier dispositivo.
- **Modo admin** (en el menú de perfil, protegido por PIN que se pide en cada entrada): panel de estadísticas de solo lectura por día/semana/mes/año —aciertos, constancia, evolución por operación, puntos débiles, tiempos y días sin entrar— con las gráficas adaptadas al tema activo.

## Stack

| Capa | Elección |
|---|---|
| Front | Vite + React 19 + TypeScript + Tailwind v4 (SPA estática; rutas por hash) |
| Hosting | GitHub Pages vía GitHub Actions |
| DB + Auth | Supabase (proyecto propio) |
| Generación de cuentas | Cliente, `src/lib/generador.ts` (aleatorio con cuotas de dificultad, sin IA) |
| Corrección, puntos y racha | Postgres RPC `security definer` (`supabase/migrations/0001_init.sql`) |
| Canjes de recompensas | Postgres RPC `canjear_recompensa` con los precios en el servidor (`0003_canjes.sql`) |
| Aviso de canje por correo | Trigger Postgres + `pg_net` → Resend, correo HTML (`0004_aviso_canje_automatico.sql`) |
| Estadísticas del panel admin | Cliente, `src/lib/estadisticas.ts` (sobre datos ya legibles del jugador) |

Regla de oro: **el cliente nunca envía puntos, fechas ni el flag "correcta"**. Envía respuestas; la DB corrige y puntúa.

## Estructura

```
src/
  config.ts                ← EJERCICIOS_POR_FASE, tiempos, puntos, acentos y hash del PIN admin
  types.ts
  lib/
    generador.ts (+test)   ← genera las cuentas con cuotas de llevadas/préstamos y sin repetir
    entrada.ts (+test)     ← escritura de la respuesta como en papel
    progreso.ts (+test)    ← estado del reto en curso en localStorage (orden de fases, tiempos)
    correccion.ts (+test)  ← veredicto por cuenta y agrupación por operación
    nivel.ts (+test)       ← nivel y XP a partir de los puntos
    semana.ts (+test)      ← fecha en Europe/Madrid y semana lunes-domingo
    calendario.ts (+test)  ← rejilla mensual y color del día
    logros.ts (+test)      ← catálogo de 42 insignias y su progreso
    comodin.ts (+test)     ← comodines disponibles y estado de la racha
    asistencia.ts (+test)  ← días sin entrar desde el primer reto (total y mayor tanda)
    recompensas.ts (+test) ← catálogo de recompensas y estado del canje
    banderas.ts (+test)    ← 195 países con su emoji, corrección con/sin tilde y ronda aleatoria
    tema.ts (+test)        ← los cuatro estilos, guardado y aplicación
    estadisticas.ts (+test)← agregados del panel admin
    pin.ts (+test)         ← SHA-256 del PIN (Web Crypto + respaldo JS)
    paletaGraficas.ts      ← colores de las gráficas, una paleta por tema
    auth.ts · api.ts · supabase.ts
  hooks/useLuzCursor.ts
  components/              ← Cabecera · MenuPerfil · Avatar · Icono · Boton · Barra · Keypad
                            Mascota · Fondo · Calendario · Correccion · SelectorFases · Grafica
  screens/                ← Login · Inicio · ElegirFase · Fase · Transicion · Resumen
                            Logros · Progreso · Banderas · Admin · Pin · Estados (error/cargando)
supabase/migrations/                ← 0001 tablas+RLS+RPCs · 0002 tema en el perfil
                                      0003 canjes de recompensas · 0004 aviso por correo
                                      0005 juego de banderas (aciertos, puntos y ronda diaria)
public/                             ← robots.txt, sitemap.xml, llms.txt, manifest, iconos, og.png, avatares
.github/workflows/deploy.yml        ← build + deploy a Pages
.github/workflows/keep-alive.yml    ← ping a Supabase cada 3 días
scripts/token.mjs                   ← genera contraseña aleatoria + link para un jugador (opcional)
docs/superpowers/                   ← specs y planes de las funcionalidades
```

## Puesta en marcha

### 1. Supabase

1. Crea un **proyecto nuevo** (la config de Auth es global por proyecto).
2. SQL Editor → pega y ejecuta las migraciones de `supabase/migrations/` **en orden** (0001 → 0005).
3. Para el aviso de canjes por correo (opcional): crea una cuenta gratuita en [Resend](https://resend.com) con el correo que recibirá los avisos y guarda en la tabla privada `ajustes` dos filas: `resend_api_key` (tu API key) y `aviso_email` (el destino). Sin esas filas, los canjes funcionan igual pero no se envía correo.
4. Authentication → Sign In / Providers → Email: desactiva **"Allow new users to sign up"** (no hay registro público). Deja "Confirm email" desactivado o marca "Auto Confirm" al crear usuarios.
5. Crea el jugador en Authentication → Users → **Add user**: email `<usuario>@<dominio>` (el dominio es el de tu web; Supabase Auth rechaza dominios reservados como `.local` o `example.com`, se configura en `CONFIG.AUTH_EMAIL_DOMAIN`) y la contraseña que elijas (marca *Auto Confirm User*). Se entra con ese **usuario** y esa **contraseña**. El perfil en `profiles` se crea solo (trigger `on_auth_user_created`).
6. Project Settings → API: copia **Project URL** y **anon public key**.

### 2. GitHub

1. Sube el repo (rama `main`). El nombre del repo se usa como base path automáticamente.
2. Settings → Secrets and variables → Actions → añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (acaban en el bundle público; la anon key está hecha para eso, RLS protege los datos). Opcional: `VITE_AVISO_EMAIL` para que la tarjeta de canje muestre a quién se avisó.
3. Settings → Pages → Source: **GitHub Actions**.
4. Push a `main` → el workflow `deploy` publica. `keep-alive` corre cada 3 días para que Supabase no pause el proyecto.

### 3. Entrar

Abre la web, escribe usuario y contraseña y aterrizas en el menú. La sesión queda en `localStorage`, así que las siguientes veces entra directo; **Salir** (menú de perfil) la cierra. Acceso directo opcional: `…/?u=<usuario>&t=<contraseña>` entra sin teclear y limpia la URL.

## Desarrollo local

```bash
cp .env.example .env.local   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # servidor local (Vite)
npm test                     # tests (lógica pura)
npm run lint
npm run build
```

## Cómo se puntúa (todo en la RPC `finalizar_sesion`)

| Concepto | Puntos |
|---|---|
| Acierto | +10 |
| Fallo / sin responder | 0 (nunca resta) |
| Fase perfecta | +25 |
| Velocidad por fase | Solo si la fase es perfecta: +20 si sobra >40 % del tiempo · +10 si sobra >20 % |
| Sesión perfecta | +100 |

**Racha** (`now()` de Postgres, zona `Europe/Madrid`): jugó ayer → +1; hoy → igual; anteayer con comodín disponible → +1 y gasta el comodín (se recarga 1 cada 30 días); otro caso → 1.

**Banderas** (RPCs `banderas_empezar` y `banderas_acierto`): la ronda diaria y los puntos (+2/+3) se validan y suman en el servidor, con tope de 20 aciertos al día.

**Recompensas** (RPC `canjear_recompensa`, precios en `cfg_precio_recompensa`): el canje se valida en el servidor contra los puntos totales menos la base del último canje de esa recompensa. Canjear reinicia el contador de esa recompensa **sin restar puntos**, queda registrado en `canjes` y dispara el aviso por correo.

## Modo admin

Menú de perfil → **Modo admin** → PIN. En el código solo vive el **SHA-256** del PIN (`CONFIG.ADMIN_PIN_SHA256`), no el PIN en claro. **El PIN se pide cada vez que se entra**; al salir del panel se vuelve a bloquear solo. El panel es de solo lectura y calcula todo en el navegador; no cambia los permisos ni los datos.

## Ajustes

- `src/config.ts` → `EJERCICIOS_POR_FASE` (5 por defecto), `TIEMPOS` por fase, `ADMIN_PIN_SHA256`, `AUTH_EMAIL_DOMAIN`, `AVISO_EMAIL` (vía `VITE_AVISO_EMAIL`).
- Si cambias `TIEMPOS`, cambia también `cfg_tiempo_fase` en el SQL (es su espejo). Lo mismo con las recompensas: `src/lib/recompensas.ts` ↔ `cfg_precio_recompensa`.
- Dificultad de las cuentas: `src/lib/generador.ts` (con tests).
- Estilos del juego: tokens CSS por tema al final de `src/index.css` (`data-tema` en `<html>`).

## Seguridad: qué está blindado y qué no

- ✅ `profiles` y `sessions` son de **solo lectura** para el cliente; los puntos y la racha los escribe únicamente la RPC (`security definer`).
- ✅ En `exercises` el cliente solo **inserta el enunciado** (`op, a, b, sol, orden`) y **actualiza** `respuesta` y `ms` (grants por columna). No puede escribir `correcta` ni tocar puntos.
- ✅ `unique (user_id, fecha)` en `sessions`: una sesión por día; `estado = 'en_curso'` impide finalizar dos veces.
- ✅ Apuntes (`notas`): cada jugador solo ve y edita los suyos (RLS); `user_id` lo pone la DB.
- ✅ Canjes (`canjes`): solo se insertan por la RPC, que valida el precio en el servidor con la fila del perfil bloqueada; el cliente solo los lee.
- ✅ El tema del perfil se guarda con un grant de UPDATE **solo de esa columna**: la policy de update no abre puntos ni racha.
- ✅ La API key de Resend y el correo de aviso viven en la tabla `ajustes`, con RLS y sin policies ni grants: invisibles desde la API.
- ⚠️ En el juego de banderas el nombre del país lo valida el cliente; el servidor no conoce la lista, pero acota el daño: hay que abrir la ronda del día, máximo 20 aciertos diarios y 3 puntos por acierto.
- ⚠️ El cliente genera e inserta las cuentas, incluida `sol`. Alguien con conocimientos podría insertar cuentas triviales por la API. Se deja así a propósito; cerrarlo del todo exige mover los generadores a plpgsql.
- ❌ Nunca metas la `service_role` key en el front. La **anon key** sí es pública por diseño; la seguridad la da RLS.
