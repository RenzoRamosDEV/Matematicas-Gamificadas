# Rediseño del front: Liquid Glass (modo claro) conectado al backend real

Fecha: 2026-08-26 · Estado: aprobado por el usuario en conversación · Canvas de referencia: https://claude.ai/code/artifact/2e08bf5d-bdf9-4868-88c1-2c2eba0296bf (mesa "Escritorio · Claro" y "Móvil · Claro")

## Objetivo

Sustituir la presentación actual del juego (slate oscuro + ámbar, Nunito) por el sistema visual "Apple moderno + Liquid Glass + infantil premium" en modo claro, manteniendo intacta la lógica de juego y usando únicamente datos que el backend ya provee. Toda tarjeta o indicador visible debe ser real: nada decorativo sin datos detrás.

## Alcance

**Dentro**
- Sistema de diseño (tokens, vidrio, esquinas continuas, tipografía, animaciones, fondo ambiental).
- Pantallas: Inicio (dashboard), Fase, Transición, Resumen, SinAcceso, Error, Cargando.
- Componentes: Cabecera, Avatar, Keypad, Timer (rediseñados); Icono, Boton, Mascota, Barra (nuevos).
- Lógica pura nueva, con tests: nivel, logros, agrupación semanal.
- Nueva lectura de historial de sesiones (`cargarSesiones`).

**Fuera**
- Módulos "Aprende algo nuevo", "Cosas que quiero recordar" y "Explorar" (sin soporte en el backend; se descartan).
- Router, navegación en cabecera, subida de avatar, modo oscuro.
- Cualquier cambio en Supabase (tablas, RLS, RPCs).

## 1. Sistema de diseño

Archivos: `src/index.css`, `index.html`, `src/config.ts` (solo `FASE_INFO.color`).

- **Tokens** (Tailwind v4 `@theme`): fondo `#f5f6fa` / `#eef0f7`; tintas `#101323`, `#535a72`, `#8b91a7`; línea `rgba(16,19,35,.07)`; vidrio `rgba(255,255,255,.58)` y fuerte `.78`; acentos oklch con misma L/C: azul `oklch(0.74 0.13 255)→oklch(0.62 0.16 265)`, violeta `300/305`, verde `oklch(0.76 0.13 160)→oklch(0.64 0.15 165)`, amarillo `oklch(0.86 0.13 92)→oklch(0.76 0.15 80)`, rosa `oklch(0.76 0.13 350)→oklch(0.64 0.16 355)`. Los acentos solo aparecen en iconos, gradientes de tiles, barras y luz ambiental; nunca como bloques grandes.
- **Vidrio**: clase `.glass` = fondo translúcido, `backdrop-filter: blur(28px) saturate(1.6)`, borde 1px, brillo superior (pseudo `::before` con máscara), sombra suave; variante `.glass-raise` con elevación en hover (`translateY(-4px)`, 300 ms).
- **Esquinas continuas**: `corner-shape: superellipse(1.5)` en `.glass`, botones, tiles y chips; fallback natural a `border-radius`. Radios proporcionales: cabecera 26, hero 40 (interior 24 = 40 − 16), tarjeta 30, tile 18, botón 18, chip 12, mini 9.
- **Tipografía**: Geist 400/500/600/700 vía Google Fonts (`<link>` en `index.html`), fallback `-apple-system, "SF Pro Display", system-ui, sans-serif`. Números tabulares en marcadores y timer. Se retira Nunito.
- **Fondo ambiental**: capa fija con 4 glows radiales (azul, violeta, rosa, verde) + grano SVG al 3,5 % + una luz de 720 px que sigue al cursor (`--mx/--my` via hook `useLuzCursor`, `pointermove` pasivo, `mix-blend-mode: soft-light`). El vidrio la deja pasar por el blur.
- **Movimiento**: `rise` (aparición, 700 ms, escalonada con `.d1…d8`), `grow`/`grow-y` (barras), `float` (mascota), `blink`, `twinkle`; transiciones 200–400 ms con `cubic-bezier(.2,.8,.2,1)`; `:active { transform: scale(.975) }` en botones. Todo anulado bajo `prefers-reduced-motion`.
- `index.html`: `theme-color` `#f5f6fa`, título "Reto", favicon SVG con la chispa del logo.

## 2. Componentes

Todos en `src/components/`. Props tipadas, sin estado salvo donde se indica.

| Componente | Responsabilidad | Props |
|---|---|---|
| `Icono` | Set SVG lineal (stroke 1.75, grid 24): `target chart medal flame star shield play arrow chev user spark clock check backspace alert lock` | `nombre`, `size?`, `className?` |
| `Boton` | Botón con dos variantes | `variante: 'primary' \| 'glass'`, `icono?`, `disabled?`, `onClick`, `children`, `className?` |
| `Mascota` | Guijarro de vidrio flotante con ojos, brillo, sombra y 3 destellos | `size?: number` |
| `Barra` | Barra de progreso fina con gradiente del acento | `valor` (0–1), `acento`, `animada?` |
| `Avatar` | Inicial sobre gradiente amarillo→rosa (o imagen si `avatar_url`) | igual que hoy |
| `Cabecera` | Vidrio flotante y pegajoso: logo + "Reto" · indicador de nivel (anillo cónico + "Nivel N · x / 500 XP") · avatar | `perfil` |
| `Keypad` | Teclas de vidrio 3×4, OK en tinta oscura, borrar con icono `backspace` | igual que hoy |
| `Timer` | Etiqueta + barra fina; gradiente azul, pasa a rosa y pulsa con ≤ 20 s | igual que hoy |

## 3. Pantallas

### Inicio (dashboard)
Recibe `perfil`, `session`, `ejercicios`, `sesiones` (historial), `onEmpezar`, `cargando`.

- **Hero**: chip "Reto de hoy disponible" (verde) o "Reto de hoy completado" (azul); `h1` "¡Hola, {nombre}! ¿Qué quieres descubrir hoy?" con degradado en la pregunta; párrafo "Aprende, organiza y descubre cosas nuevas mientras completas pequeños retos."; CTA primario "Empezar el reto de hoy" (o "Continuar el reto" si hay ejercicios en curso; si `session.estado === 'completada'` el CTA no se muestra porque App ya renderiza Resumen); tira de 3 stats de vidrio: racha (`racha_actual` días, rosa), puntos (`puntos_total`, amarillo), comodín (`comodines_disponibles`, verde). A la derecha (debajo en móvil) panel de vidrio con la `Mascota`, una órbita punteada y dos etiquetas flotantes reales: "+10 por acierto" y "Comodín listo" (solo si `comodines_disponibles > 0`).
- **Tarjetas** (grid 3 columnas ≥ 1024 px, 1 columna en móvil), todas `.glass .glass-raise`:
  1. **Mis retos** (azul, `target`) — "Sumas, restas, multiplicaciones y divisiones. {EJERCICIOS_POR_FASE} cuentas por fase." Medidor de 4 segmentos: fases completadas según `ejercicios` (fase completada = todos sus ejercicios con `respuesta !== null`); etiqueta "Fase k de 4" y "~N min" restantes según `CONFIG.TIEMPOS`. Sin sesión en curso: "4 fases · ~14 min".
  2. **Mi progreso** (verde, `chart`) — "Tus puntos y tu racha, semana a semana." Siete barras (lunes…hoy, en Europe/Madrid) con los puntos de la sesión completada de cada día; hoy en azul. Chip "+N esta semana" (suma de la semana). Si no hay sesiones: barras vacías y chip "Empieza hoy".
  3. **Mis logros** (violeta, `medal`) — "Medallas por rachas y sesiones perfectas." Fila de 8 medallas (ver §4), conseguidas con gradiente y no conseguidas en gris; chip "k de 8".
- Título de sección: "¿Por dónde empezamos?".

### Fase
Misma lógica y props. Cabecera de fase (nombre, "Fase n/4", contador respondidas). `Timer`. Puntos de navegación como chips de vidrio (respondido = relleno azul, activo = anillo). Enunciado en panel `.glass` grande con luz ambiental del acento de la fase (`FASE_INFO[op].color` pasa a ser un acento oklch, no una clase Tailwind): números monoespaciados tabulares, línea de resultado con la respuesta en curso. `Keypad`. Barra inferior con anterior/siguiente (glass) y "Terminar fase" (primary) o el flujo de confirmación actual ("Terminar sin acabar" → "¿Seguro? Faltan N").

### Transición
Mensaje según aciertos (texto actual, sin emojis: se sustituyen por `Icono` en un tile con el acento de la fase). Marcador "k de N" con `Barra`. Nota "+25 por fase perfecta" cuando aplique. Frase "Respira. El tiempo no corre hasta que pulses." Botón primario "Siguiente: {fase}" o "Ver resultado".

### Resumen
`Cabecera`. Título "¡Reto completado!" / "Ya has jugado hoy" con tile de icono (`medal` si perfecta, `check` si no). Tres stats (hoy, total, racha). Avisos de comodín usado y sesión perfecta como chips. Lista de fases en filas de vidrio con tile del acento, "k/N", "+pts", chips "perfecta +25" y "rápido +N". Récord de racha si aplica. Pie "Vuelve mañana para seguir la racha".

### SinAcceso, Error, Cargando
Tarjeta de vidrio centrada con tile (`lock` / `alert` / mascota pequeña con `float`), título, texto y, en Error, botón "Reintentar". Cargando muestra la mascota y "Preparando tu reto…".

## 4. Datos y lógica pura

Sin cambios en Supabase. Todo lo nuevo es lectura o cálculo en cliente.

- `src/lib/api.ts` → `cargarSesiones(limite = 30): Promise<Session[]>` — `select('id, fecha, estado, puntos, detalle').eq('estado','completada').order('fecha', { ascending: false }).limit(limite)`. RLS ya permite leer las propias filas.
- `src/lib/nivel.ts` → `PUNTOS_POR_NIVEL = 500`; `nivel(puntos) = floor(puntos / 500) + 1`; `progresoNivel(puntos) = { actual: puntos % 500, meta: 500 }`.
- `src/lib/semana.ts` → `hoyMadrid(): string` (YYYY-MM-DD, `Intl.DateTimeFormat` con `timeZone: 'Europe/Madrid'`); `semanaActual(sesiones, hoy): { fecha, puntos, esHoy }[7]` de lunes a domingo (días futuros con `puntos: 0`); `puntosSemana(...)`.
- `src/lib/logros.ts` → `LOGROS: Logro[]` (id, nombre, descripción, icono, acento, `condicion(ctx)`), con `ctx = { perfil, sesiones }`:

| id | nombre | condición |
|---|---|---|
| `primer_reto` | Primer reto | ≥ 1 sesión completada |
| `racha_3` | Tres seguidos | `racha_max ≥ 3` |
| `racha_7` | Una semana | `racha_max ≥ 7` |
| `racha_30` | Un mes | `racha_max ≥ 30` |
| `perfecta` | Sesión perfecta | alguna sesión con `detalle` donde aciertos = total > 0 |
| `puntos_500` | 500 puntos | `puntos_total ≥ 500` |
| `puntos_1000` | 1.000 puntos | `puntos_total ≥ 1000` |
| `puntos_5000` | 5.000 puntos | `puntos_total ≥ 5000` |

  `evaluarLogros(ctx): (Logro & { conseguido: boolean })[]`.
- `src/App.tsx` → carga `cargarSesiones()` junto al perfil (en paralelo con `iniciarSesion`), lo pasa a `Inicio`; tras `finalizarSesion` recarga perfil y sesiones. Ningún otro cambio de flujo.
- `src/hooks/useLuzCursor.ts` → registra `pointermove` pasivo y escribe `--mx/--my` en `document.documentElement`; se limpia al desmontar.
- `src/config.ts` → `FASE_INFO[op].color` pasa de clases Tailwind a un par `[claro, oscuro]` en oklch (azul suma, violeta resta, verde mult, rosa div); se elimina `emoji`.

## 5. Errores y estados vacíos

- Historial no disponible (error en `cargarSesiones`): el dashboard se renderiza igual con `sesiones = []`; el error se muestra en el aviso inferior ya existente, no bloquea el juego.
- `sesiones = []`: "Mi progreso" con barras vacías y chip "Empieza hoy"; "Mis logros" con 0 de 8.
- Sesión en curso con `ejercicios.length > 0` (refresco a mitad): App ya salta a `Fase`; el dashboard solo se ve sin ejercicios, así que "Mis retos" mostrará siempre estado inicial salvo que en el futuro se navegue atrás. Se implementa igualmente el cálculo por si se reutiliza.
- Sin `backdrop-filter` (navegadores antiguos): el vidrio cae a fondo `rgba(255,255,255,.85)` mediante `@supports not`.

## 6. Verificación

- Vitest: `nivel.test.ts`, `semana.test.ts` (límites de semana, zona horaria, días futuros), `logros.test.ts` (cada condición en ambos sentidos). Los 9 tests de `generador` siguen pasando.
- `npm run lint`, `npm run build` sin errores.
- Captura con Chrome headless de Inicio (1440 y 390) y de una Fase contra el proyecto Supabase real con el usuario de prueba, comparada a ojo con el canvas.
- Comprobación manual del flujo completo: empezar → 4 fases → resumen, y refresco a mitad de fase.

## 7. Commits previstos

Convención en español, sin coautor: `feat(ui): sistema de diseño Liquid Glass…`, `feat(ui): componentes base…`, `feat(ui): dashboard con progreso y logros reales`, `feat(ui): rediseñar fase, transición y resumen`, `feat(ui): pantallas de acceso, error y carga`, `test: …`, `docs: …`.
