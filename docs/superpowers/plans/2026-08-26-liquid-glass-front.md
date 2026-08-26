# Rediseño Liquid Glass del front — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar el diseño Liquid Glass (modo claro) al front React existente, con un dashboard cuyas tarjetas usan solo datos reales del backend (reto de hoy, progreso semanal, logros), sin tocar Supabase.

**Architecture:** Sistema de diseño como tokens Tailwind v4 (`@theme`) más clases base en `src/index.css` (`.glass`, `.btn`, `.tile`, `.chip`, animaciones). La lógica de juego de `App`/`Fase` no cambia; solo se reescribe el markup. La lógica nueva (nivel, semana, logros) es pura, vive en `src/lib/` y se prueba con Vitest. Una única lectura nueva a Supabase (`cargarSesiones`).

**Tech Stack:** Vite 8 · React 19 · TypeScript 6 · Tailwind CSS v4 · Vitest 4 · Supabase JS · Geist (Google Fonts).

Spec: `docs/superpowers/specs/2026-08-26-liquid-glass-front-design.md`.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Fuente Geist, título, `theme-color`, favicon |
| `src/index.css` | Tokens `@theme`, `.glass`, botones, tiles, chips, barras, fondo ambiental, mascota, animaciones |
| `src/config.ts` | `FASE_INFO` con `acento` (oklch) en vez de clases Tailwind; tipo `Acento` |
| `src/lib/nivel.ts` (+test) | Nivel y progreso a partir de puntos |
| `src/lib/semana.ts` (+test) | Fecha de hoy en Madrid, semana lunes-domingo con puntos por día |
| `src/lib/logros.ts` (+test) | 8 medallas derivadas de perfil e historial |
| `src/lib/api.ts` | `cargarSesiones()` |
| `src/hooks/useLuzCursor.ts` | Escribe `--mx/--my` con el puntero |
| `src/components/Icono.tsx` | Set SVG lineal |
| `src/components/Boton.tsx` | Botón primary / glass |
| `src/components/Barra.tsx` | Barra fina de progreso |
| `src/components/Mascota.tsx` | Guijarro de vidrio |
| `src/components/Fondo.tsx` | Capas ambientales (glows, grano, luz del cursor) |
| `src/components/Avatar.tsx`, `Cabecera.tsx`, `Keypad.tsx`, `Timer.tsx` | Rediseñados, misma API |
| `src/screens/Inicio.tsx` | Dashboard con hero + 3 tarjetas reales |
| `src/screens/Fase.tsx`, `Transicion.tsx`, `Resumen.tsx`, `SinAcceso.tsx` | Rediseñadas |
| `src/App.tsx` | Carga historial, estado `enInicio`, `Resumen` con volver, toast |

---

### Task 1: Lógica pura — nivel

**Files:** Create `src/lib/nivel.ts`, `src/lib/nivel.test.ts`

- [ ] **Step 1: Test que falla**

```ts
// src/lib/nivel.test.ts
import { describe, expect, it } from 'vitest';
import { nivel, progresoNivel, PUNTOS_POR_NIVEL } from './nivel';

describe('nivel', () => {
  it('empieza en 1 y sube cada 500 puntos', () => {
    expect(PUNTOS_POR_NIVEL).toBe(500);
    expect(nivel(0)).toBe(1);
    expect(nivel(499)).toBe(1);
    expect(nivel(500)).toBe(2);
    expect(nivel(1240)).toBe(3);
  });
  it('el progreso es lo que sobra dentro del nivel', () => {
    expect(progresoNivel(1240)).toEqual({ actual: 240, meta: 500 });
    expect(progresoNivel(0)).toEqual({ actual: 0, meta: 500 });
  });
  it('no se rompe con puntos negativos', () => {
    expect(nivel(-10)).toBe(1);
    expect(progresoNivel(-10).actual).toBe(0);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/nivel.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implementación**

```ts
// src/lib/nivel.ts
/** Puntos necesarios para subir de nivel. Solo presentación: el backend no conoce niveles. */
export const PUNTOS_POR_NIVEL = 500;

export const nivel = (puntos: number) => Math.floor(Math.max(0, puntos) / PUNTOS_POR_NIVEL) + 1;

export const progresoNivel = (puntos: number) => ({
  actual: Math.max(0, puntos) % PUNTOS_POR_NIVEL,
  meta: PUNTOS_POR_NIVEL,
});
```

- [ ] **Step 4:** `npx vitest run src/lib/nivel.test.ts` → PASS (3 tests).
- [ ] **Step 5:** `git add src/lib/nivel.ts src/lib/nivel.test.ts && git commit -m "feat(ui): calcular nivel y progreso a partir de los puntos"`

---

### Task 2: Lógica pura — semana

**Files:** Create `src/lib/semana.ts`, `src/lib/semana.test.ts`

- [ ] **Step 1: Test que falla**

```ts
// src/lib/semana.test.ts
import { describe, expect, it } from 'vitest';
import { hoyMadrid, lunesDe, puntosSemana, semanaActual, sumarDias } from './semana';

describe('fechas', () => {
  it('hoyMadrid usa la zona Europe/Madrid', () => {
    expect(hoyMadrid(new Date('2026-08-26T23:30:00Z'))).toBe('2026-08-27'); // UTC+2 en verano
    expect(hoyMadrid(new Date('2026-01-10T12:00:00Z'))).toBe('2026-01-10');
  });
  it('sumarDias y lunesDe operan sobre YYYY-MM-DD', () => {
    expect(sumarDias('2026-08-30', 2)).toBe('2026-09-01');
    expect(lunesDe('2026-08-26')).toBe('2026-08-24'); // miércoles → lunes
    expect(lunesDe('2026-08-24')).toBe('2026-08-24');
    expect(lunesDe('2026-08-30')).toBe('2026-08-24'); // domingo → lunes anterior
  });
});

describe('semanaActual', () => {
  const sesiones = [
    { fecha: '2026-08-24', puntos: 120, estado: 'completada' as const },
    { fecha: '2026-08-25', puntos: 80, estado: 'completada' as const },
    { fecha: '2026-08-26', puntos: 200, estado: 'en_curso' as const },   // no cuenta
    { fecha: '2026-08-17', puntos: 999, estado: 'completada' as const },  // semana pasada
  ];
  const dias = semanaActual(sesiones, '2026-08-26');

  it('devuelve lunes a domingo con etiquetas', () => {
    expect(dias.map((d) => d.etiqueta)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
    expect(dias[0].fecha).toBe('2026-08-24');
    expect(dias[6].fecha).toBe('2026-08-30');
  });
  it('asigna puntos solo de sesiones completadas de esta semana', () => {
    expect(dias.map((d) => d.puntos)).toEqual([120, 80, 0, 0, 0, 0, 0]);
    expect(puntosSemana(dias)).toBe(200);
  });
  it('marca hoy y los días futuros', () => {
    expect(dias[2].esHoy).toBe(true);
    expect(dias.map((d) => d.futuro)).toEqual([false, false, false, true, true, true, true]);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/semana.test.ts` → FAIL.
- [ ] **Step 3: Implementación**

```ts
// src/lib/semana.ts
import type { Session } from '../types';

const fmtMadrid = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Fecha de hoy (YYYY-MM-DD) en la zona del juego: la misma que usan las RPCs. */
export const hoyMadrid = (ahora: Date = new Date()) => fmtMadrid.format(ahora);

const aUTC = (f: string) => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const deUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const sumarDias = (fecha: string, n: number) => deUTC(aUTC(fecha) + n * 86_400_000);

/** Lunes de la semana de `fecha` (lunes = primer día). */
export const lunesDe = (fecha: string) => {
  const dow = new Date(aUTC(fecha)).getUTCDay();          // 0 = domingo
  return sumarDias(fecha, -((dow + 6) % 7));
};

export interface DiaSemana {
  fecha: string;
  etiqueta: 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
  puntos: number;
  esHoy: boolean;
  futuro: boolean;
}

const ETIQUETAS: DiaSemana['etiqueta'][] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function semanaActual(sesiones: Pick<Session, 'fecha' | 'puntos' | 'estado'>[], hoy: string): DiaSemana[] {
  const lunes = lunesDe(hoy);
  const porFecha = new Map(sesiones.filter((s) => s.estado === 'completada').map((s) => [s.fecha, s.puntos]));
  return ETIQUETAS.map((etiqueta, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, etiqueta, puntos: porFecha.get(fecha) ?? 0, esHoy: fecha === hoy, futuro: fecha > hoy };
  });
}

export const puntosSemana = (dias: DiaSemana[]) => dias.reduce((n, d) => n + d.puntos, 0);
```

- [ ] **Step 4:** `npx vitest run src/lib/semana.test.ts` → PASS (5 tests).
- [ ] **Step 5:** `git add src/lib/semana.ts src/lib/semana.test.ts && git commit -m "feat(ui): agrupar las sesiones de la semana por día en Europe/Madrid"`

---

### Task 3: Lógica pura — logros

**Files:** Create `src/lib/logros.ts`, `src/lib/logros.test.ts`

- [ ] **Step 1: Test que falla**

```ts
// src/lib/logros.test.ts
import { describe, expect, it } from 'vitest';
import { evaluarLogros, LOGROS } from './logros';
import type { FaseDetalle } from '../types';

const fase = (aciertos: number, total: number): FaseDetalle => ({ op: 'suma', aciertos, total, bonus_perfecta: 0, bonus_velocidad: 0, puntos: 0 });
const perfil = (puntos_total: number, racha_max: number) => ({ puntos_total, racha_max });
const completada = (detalle: FaseDetalle[] | null) => ({ estado: 'completada' as const, detalle });

describe('logros', () => {
  it('hay 8 medallas con ids únicos', () => {
    expect(LOGROS).toHaveLength(8);
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(8);
  });
  it('sin historial ni puntos no hay nada conseguido', () => {
    const r = evaluarLogros({ perfil: perfil(0, 0), sesiones: [] });
    expect(r.every((l) => !l.conseguido)).toBe(true);
  });
  it('primer reto y sesión perfecta salen del historial', () => {
    const r = evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([fase(5, 5), fase(4, 5)])] });
    const por = Object.fromEntries(r.map((l) => [l.id, l.conseguido]));
    expect(por.primer_reto).toBe(true);
    expect(por.perfecta).toBe(false);
    const r2 = evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([fase(5, 5), fase(5, 5)])] });
    expect(r2.find((l) => l.id === 'perfecta')?.conseguido).toBe(true);
  });
  it('las rachas y los puntos salen del perfil', () => {
    const por = Object.fromEntries(evaluarLogros({ perfil: perfil(1000, 7), sesiones: [] }).map((l) => [l.id, l.conseguido]));
    expect(por.racha_3).toBe(true);
    expect(por.racha_7).toBe(true);
    expect(por.racha_30).toBe(false);
    expect(por.puntos_500).toBe(true);
    expect(por.puntos_1000).toBe(true);
    expect(por.puntos_5000).toBe(false);
  });
  it('una sesión sin detalle no cuenta como perfecta', () => {
    expect(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada(null)] }).find((l) => l.id === 'perfecta')?.conseguido).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/logros.test.ts` → FAIL.
- [ ] **Step 3: Implementación**

```ts
// src/lib/logros.ts
import type { Acento } from '../config';
import type { NombreIcono } from '../components/Icono';
import type { Profile, Session } from '../types';

export interface ContextoLogros {
  perfil: Pick<Profile, 'puntos_total' | 'racha_max'>;
  sesiones: Pick<Session, 'estado' | 'detalle'>[];
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: NombreIcono;
  acento: Acento;
  condicion: (ctx: ContextoLogros) => boolean;
}

const completadas = (ctx: ContextoLogros) => ctx.sesiones.filter((s) => s.estado === 'completada');

const esPerfecta = (s: Pick<Session, 'detalle'>) => {
  const fases = s.detalle ?? [];
  const total = fases.reduce((n, f) => n + f.total, 0);
  return total > 0 && fases.every((f) => f.aciertos === f.total);
};

export const LOGROS: Logro[] = [
  { id: 'primer_reto', nombre: 'Primer reto', descripcion: 'Completa tu primer reto del día', icono: 'target', acento: 'azul', condicion: (c) => completadas(c).length >= 1 },
  { id: 'racha_3', nombre: 'Tres seguidos', descripcion: 'Racha de 3 días', icono: 'flame', acento: 'rosa', condicion: (c) => c.perfil.racha_max >= 3 },
  { id: 'racha_7', nombre: 'Una semana', descripcion: 'Racha de 7 días', icono: 'flame', acento: 'rosa', condicion: (c) => c.perfil.racha_max >= 7 },
  { id: 'racha_30', nombre: 'Un mes', descripcion: 'Racha de 30 días', icono: 'flame', acento: 'violeta', condicion: (c) => c.perfil.racha_max >= 30 },
  { id: 'perfecta', nombre: 'Sesión perfecta', descripcion: 'Todo bien en las 4 fases', icono: 'medal', acento: 'amarillo', condicion: (c) => completadas(c).some(esPerfecta) },
  { id: 'puntos_500', nombre: '500 puntos', descripcion: 'Acumula 500 puntos', icono: 'star', acento: 'amarillo', condicion: (c) => c.perfil.puntos_total >= 500 },
  { id: 'puntos_1000', nombre: '1.000 puntos', descripcion: 'Acumula 1.000 puntos', icono: 'star', acento: 'verde', condicion: (c) => c.perfil.puntos_total >= 1000 },
  { id: 'puntos_5000', nombre: '5.000 puntos', descripcion: 'Acumula 5.000 puntos', icono: 'star', acento: 'violeta', condicion: (c) => c.perfil.puntos_total >= 5000 },
];

export const evaluarLogros = (ctx: ContextoLogros) => LOGROS.map((l) => ({ ...l, conseguido: l.condicion(ctx) }));
```

(`Acento` y `NombreIcono` se definen en las tareas 4 y 5; el test pasa igualmente porque son imports de tipo.)

- [ ] **Step 4:** `npx vitest run src/lib/logros.test.ts` → PASS (5 tests).
- [ ] **Step 5:** `git add src/lib/logros.ts src/lib/logros.test.ts && git commit -m "feat(ui): derivar las medallas del perfil y del historial"`

---

### Task 4: Config, API, hook

**Files:** Modify `src/config.ts`, `src/lib/api.ts`; Create `src/hooks/useLuzCursor.ts`

- [ ] **Step 1: `config.ts`** — sustituir `FASE_INFO` y añadir `Acento`:

```ts
export type Acento = 'azul' | 'violeta' | 'verde' | 'amarillo' | 'rosa';

export const FASE_INFO: Record<(typeof ORDEN_FASES)[number], { nombre: string; simbolo: string; acento: Acento }> = {
  suma:  { nombre: 'Sumas',            simbolo: '+', acento: 'azul' },
  resta: { nombre: 'Restas',           simbolo: '−', acento: 'violeta' },
  mult:  { nombre: 'Multiplicaciones', simbolo: '×', acento: 'verde' },
  div:   { nombre: 'Divisiones',       simbolo: '÷', acento: 'rosa' },
};
```

- [ ] **Step 2: `api.ts`** — añadir al final:

```ts
/** Últimas sesiones completadas del jugador (RLS solo devuelve las suyas). */
export async function cargarSesiones(limite = 30): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions').select('id, fecha, estado, puntos, detalle')
    .eq('estado', 'completada').order('fecha', { ascending: false }).limit(limite);
  fail('historial', error);
  return (data ?? []) as Session[];
}
```

- [ ] **Step 3: `src/hooks/useLuzCursor.ts`**

```ts
import { useEffect } from 'react';

/** La luz ambiental sigue al puntero: escribe --mx/--my en <html>. Los paneles de vidrio la dejan pasar. */
export function useLuzCursor() {
  useEffect(() => {
    const raiz = document.documentElement;
    const mover = (e: PointerEvent) => {
      raiz.style.setProperty('--mx', `${e.clientX}px`);
      raiz.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', mover, { passive: true });
    return () => window.removeEventListener('pointermove', mover);
  }, []);
}
```

- [ ] **Step 4:** `npx tsc -b` fallará hasta la Task 7 (pantallas aún usan `.color`/`.emoji`): es esperado; seguir.
- [ ] **Step 5:** `git add src/config.ts src/lib/api.ts src/hooks && git commit -m "feat(ui): acentos por fase, lectura del historial y luz que sigue al cursor"`

---

### Task 5: Sistema de diseño (`index.html`, `index.css`)

**Files:** Modify `index.html`, `src/index.css`

- [ ] **Step 1: `index.html`** `<head>`:

```html
<meta charset="UTF-8" />
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2384a7ff'/%3E%3Cstop offset='1' stop-color='%238b5cf6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='18' fill='url(%23g)'/%3E%3Cg fill='none' stroke='white' stroke-width='4.5' stroke-linecap='round'%3E%3Cpath d='M32 14v9M32 41v9M14 32h9M41 32h9M19.3 19.3l6.4 6.4M38.3 38.3l6.4 6.4M19.3 44.7l6.4-6.4M38.3 25.7l6.4-6.4'/%3E%3C/g%3E%3C/svg%3E" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#f5f6fa" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
<title>Reto</title>
```

- [ ] **Step 2: `src/index.css`** — reemplazar el archivo completo por el CSS de la sección "CSS del sistema" al final de este plan (tokens, `.glass`, `.btn`, `.tecla`, `.tile-*`, `.chip`, `.track/.fill-*`, `.ambiente/.luz-cursor/.grano`, `.guijarro`, animaciones y `prefers-reduced-motion`).
- [ ] **Step 3:** `npm run build` debe compilar CSS sin error (los TSX aún pueden fallar por `.color`).
- [ ] **Step 4:** `git add index.html src/index.css && git commit -m "feat(ui): sistema de diseño Liquid Glass en modo claro"`

---

### Task 6: Componentes base

**Files:** Create `src/components/Icono.tsx`, `Boton.tsx`, `Barra.tsx`, `Mascota.tsx`, `Fondo.tsx`; Modify `Avatar.tsx`, `Cabecera.tsx`, `Keypad.tsx`, `Timer.tsx`. Código completo en la sección "Componentes" al final del plan.

- [ ] **Step 1:** Crear `Icono.tsx` (export `NombreIcono` e `Icono`).
- [ ] **Step 2:** Crear `Boton.tsx`, `Barra.tsx`, `Mascota.tsx`, `Fondo.tsx`.
- [ ] **Step 3:** Reescribir `Avatar.tsx`, `Cabecera.tsx`, `Keypad.tsx`, `Timer.tsx` manteniendo sus props.
- [ ] **Step 4:** `npm run lint` → sin errores.
- [ ] **Step 5:** `git add src/components && git commit -m "feat(ui): componentes base de vidrio, iconos, mascota y cabecera con nivel"`

---

### Task 7: Pantallas y App

**Files:** Modify `src/screens/Inicio.tsx`, `Fase.tsx`, `Transicion.tsx`, `Resumen.tsx`, `SinAcceso.tsx`, `src/App.tsx`. Código completo en la sección "Pantallas" al final del plan.

- [ ] **Step 1:** `Inicio.tsx` con props `{ perfil, sesiones, ejercicios, estadoReto, puntosHoy, onEmpezar, onVerResultado, cargando }`.
- [ ] **Step 2:** `Fase.tsx`: mismo estado y handlers; solo markup (panel de vidrio con luz del acento, chips de navegación, `Keypad`, `Timer`).
- [ ] **Step 3:** `Transicion.tsx`, `Resumen.tsx` (nueva prop `onVolver`), `SinAcceso.tsx` (añade `Cargando`).
- [ ] **Step 4:** `App.tsx`: estado `sesiones`, carga en paralelo con `cargarSesiones().catch(...)`, recarga tras finalizar, `enInicio` gobierna Inicio ↔ juego/resumen, `<Fondo />` envolviendo todo.
- [ ] **Step 5:** `npm test && npm run lint && npm run build` → todo verde (24 tests).
- [ ] **Step 6:** `git add -A src && git commit -m "feat(ui): dashboard con retos, progreso y logros reales y rediseño del flujo de juego"`

---

### Task 8: Verificación visual

- [ ] **Step 1:** Con `npm run dev` levantado y `.env.local`, capturar `http://127.0.0.1:5173/Matematicas-Gamificadas/` a 1440×1100 y 390×1600 con Chrome headless tras entrar con el link del jugador (la sesión vive en localStorage; con headless usar `--user-data-dir` persistente o el link con `?u=&t=`).
- [ ] **Step 2:** Comparar con el canvas: cabecera flotante, hero con saludo real, tira de stats, mascota, 3 tarjetas. Corregir desbordes.
- [ ] **Step 3:** Jugar una fase: entrada de dígitos de derecha a izquierda intacta, timer, chips de navegación, terminar fase → transición.
- [ ] **Step 4:** `git push origin main` y comprobar que el workflow `deploy` termina en verde.

---

## CSS del sistema (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Geist", -apple-system, "SF Pro Display", "SF Pro Text", system-ui, "Helvetica Neue", sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --color-fondo: #f5f6fa;
  --color-fondo-2: #eef0f7;
  --color-tinta: #101323;
  --color-tinta-2: #535a72;
  --color-tinta-3: #8b91a7;
  --color-linea: rgba(16, 19, 35, 0.07);

  --color-azul: oklch(0.74 0.13 255);     --color-azul-2: oklch(0.62 0.16 265);
  --color-violeta: oklch(0.74 0.13 300);  --color-violeta-2: oklch(0.62 0.16 305);
  --color-verde: oklch(0.76 0.13 160);    --color-verde-2: oklch(0.64 0.15 165);
  --color-amarillo: oklch(0.86 0.13 92);  --color-amarillo-2: oklch(0.76 0.15 80);
  --color-rosa: oklch(0.76 0.13 350);     --color-rosa-2: oklch(0.64 0.16 355);

  --ease-fluida: cubic-bezier(.2, .8, .2, 1);
}

:root { --mx: 50vw; --my: 20vh; color-scheme: light; }
html, body, #root { height: 100%; }
body {
  @apply bg-fondo text-tinta antialiased;
  -webkit-tap-highlight-color: transparent;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

@layer components {
  /* ---- Fondo ambiental ------------------------------------------------ */
  .ambiente { position: fixed; inset: -20%; z-index: 0; pointer-events: none;
    background:
      radial-gradient(42% 38% at 18% 12%, rgba(120,150,255,.35), transparent 70%),
      radial-gradient(38% 34% at 82% 18%, rgba(190,140,255,.30), transparent 70%),
      radial-gradient(34% 30% at 78% 78%, rgba(255,150,200,.26), transparent 70%),
      radial-gradient(30% 28% at 14% 82%, rgba(120,220,180,.24), transparent 70%),
      linear-gradient(180deg, var(--color-fondo) 0%, var(--color-fondo-2) 100%); }
  .luz-cursor { position: fixed; z-index: 0; pointer-events: none; width: 720px; height: 720px;
    left: var(--mx); top: var(--my); transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255,255,255,.9) 0%, transparent 60%);
    mix-blend-mode: soft-light; opacity: .9; }
  .grano { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: .035; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

  /* ---- Vidrio con esquinas continuas ---------------------------------- */
  .glass { position: relative; background: rgba(255,255,255,.58);
    -webkit-backdrop-filter: blur(28px) saturate(1.6); backdrop-filter: blur(28px) saturate(1.6);
    border: 1px solid var(--color-linea); corner-shape: superellipse(1.5);
    box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 18px 50px -18px rgba(30,40,80,.22), 0 2px 6px -2px rgba(30,40,80,.08);
    transition: transform .3s var(--ease-fluida), box-shadow .3s var(--ease-fluida), background .3s; }
  .glass::before { content: ""; position: absolute; inset: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; padding: 1px;
    background: linear-gradient(165deg, rgba(255,255,255,.85) 0%, transparent 32%, transparent 70%, rgba(255,255,255,.06) 100%);
    opacity: .7; mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000); mask-composite: exclude; }
  .glass-fuerte { background: rgba(255,255,255,.78); }
  .glass-raise:hover { transform: translateY(-4px); background: rgba(255,255,255,.78);
    box-shadow: 0 1px 0 rgba(255,255,255,.95) inset, 0 30px 70px -22px rgba(30,40,80,.30), 0 4px 10px -4px rgba(30,40,80,.10); }
  @supports not (backdrop-filter: blur(1px)) { .glass { background: rgba(255,255,255,.9); } }

  /* Luz ambiental del acento dentro de un panel de vidrio (enunciado de la fase) */
  .luz-azul     { background: radial-gradient(70% 55% at 50% 0%, color-mix(in oklch, var(--color-azul) 38%, transparent), transparent 70%), rgba(255,255,255,.62); }
  .luz-violeta  { background: radial-gradient(70% 55% at 50% 0%, color-mix(in oklch, var(--color-violeta) 38%, transparent), transparent 70%), rgba(255,255,255,.62); }
  .luz-verde    { background: radial-gradient(70% 55% at 50% 0%, color-mix(in oklch, var(--color-verde) 38%, transparent), transparent 70%), rgba(255,255,255,.62); }
  .luz-amarillo { background: radial-gradient(70% 55% at 50% 0%, color-mix(in oklch, var(--color-amarillo) 38%, transparent), transparent 70%), rgba(255,255,255,.62); }
  .luz-rosa     { background: radial-gradient(70% 55% at 50% 0%, color-mix(in oklch, var(--color-rosa) 38%, transparent), transparent 70%), rgba(255,255,255,.62); }

  /* ---- Botones y teclas ------------------------------------------------ */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 52px; padding: 0 22px;
    font-weight: 600; font-size: 16px; border-radius: 18px; corner-shape: superellipse(1.5); border: 1px solid transparent;
    user-select: none; cursor: pointer; transition: transform .2s var(--ease-fluida), box-shadow .3s, background .3s, opacity .2s; }
  .btn:active:not(:disabled) { transform: scale(.975); }
  .btn:disabled { opacity: .45; cursor: default; }
  .btn-primary { color: #fff; background: var(--color-tinta);
    box-shadow: 0 1px 0 rgba(255,255,255,.18) inset, 0 12px 28px -12px rgba(16,19,35,.55); }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,.18) inset, 0 18px 34px -14px rgba(16,19,35,.6); }
  .btn-glass { color: var(--color-tinta); background: rgba(255,255,255,.78); border-color: var(--color-linea);
    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 12px 30px -14px rgba(30,40,80,.22); }
  .btn-glass:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-peligro { color: #fff; background: linear-gradient(150deg, var(--color-rosa), var(--color-rosa-2)); }

  .tecla { display: grid; place-items: center; height: 60px; font-size: 26px; font-weight: 700; color: var(--color-tinta);
    background: rgba(255,255,255,.72); border: 1px solid var(--color-linea); border-radius: 16px; corner-shape: superellipse(1.5);
    box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 20px -12px rgba(30,40,80,.25); user-select: none; cursor: pointer;
    transition: transform .12s var(--ease-fluida), background .2s; }
  .tecla:active:not(:disabled) { transform: scale(.95); background: rgba(255,255,255,.95); }
  .tecla:disabled { opacity: .4; cursor: default; }
  .tecla-ok { color: #fff; background: var(--color-tinta); border-color: transparent; }

  /* ---- Tiles, chips, medallas ------------------------------------------ */
  .tile { position: relative; display: grid; place-items: center; color: #fff; border-radius: 18px; corner-shape: superellipse(1.5);
    transition: transform .35s var(--ease-fluida); }
  .tile::after { content: ""; position: absolute; inset: 0; border-radius: inherit; corner-shape: inherit;
    background: linear-gradient(160deg, rgba(255,255,255,.45), rgba(255,255,255,0) 55%); }
  .tile-azul     { background: linear-gradient(150deg, var(--color-azul), var(--color-azul-2)); box-shadow: 0 10px 22px -10px var(--color-azul-2); }
  .tile-violeta  { background: linear-gradient(150deg, var(--color-violeta), var(--color-violeta-2)); box-shadow: 0 10px 22px -10px var(--color-violeta-2); }
  .tile-verde    { background: linear-gradient(150deg, var(--color-verde), var(--color-verde-2)); box-shadow: 0 10px 22px -10px var(--color-verde-2); }
  .tile-amarillo { background: linear-gradient(150deg, var(--color-amarillo), var(--color-amarillo-2)); box-shadow: 0 10px 22px -10px var(--color-amarillo-2); }
  .tile-rosa     { background: linear-gradient(150deg, var(--color-rosa), var(--color-rosa-2)); box-shadow: 0 10px 22px -10px var(--color-rosa-2); }
  .tile-gris     { background: rgba(16,19,35,.07); color: var(--color-tinta-3); box-shadow: none; }
  .tile-gris::after { display: none; }

  .chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--color-tinta-2);
    padding: 6px 10px; border-radius: 10px; corner-shape: superellipse(1.5); background: rgba(255,255,255,.78); border: 1px solid var(--color-linea); }
  .chip-verde { color: var(--color-verde-2); }
  .chip-azul { color: var(--color-azul-2); }
  .chip-rosa { color: var(--color-rosa-2); }

  /* ---- Barras ---------------------------------------------------------- */
  .track { height: 6px; border-radius: 3px; background: rgba(16,19,35,.07); overflow: hidden; }
  .fill { height: 100%; border-radius: 3px; transform-origin: left; transition: width 1s linear; }
  .fill-azul     { background: linear-gradient(90deg, var(--color-azul), var(--color-azul-2)); }
  .fill-violeta  { background: linear-gradient(90deg, var(--color-violeta), var(--color-violeta-2)); }
  .fill-verde    { background: linear-gradient(90deg, var(--color-verde), var(--color-verde-2)); }
  .fill-amarillo { background: linear-gradient(90deg, var(--color-amarillo), var(--color-amarillo-2)); }
  .fill-rosa     { background: linear-gradient(90deg, var(--color-rosa), var(--color-rosa-2)); }
  .fill-crece { animation: grow 1.1s var(--ease-fluida) both .4s; }

  /* ---- Mascota: guijarro de vidrio ------------------------------------ */
  .guijarro { position: relative; animation: float 6s ease-in-out infinite;
    border-radius: 48% 52% 50% 50% / 56% 56% 44% 44%;
    background: linear-gradient(150deg, oklch(0.93 0.05 300) 0%, oklch(0.82 0.11 275) 45%, oklch(0.78 0.13 340) 100%);
    box-shadow: 0 30px 60px -20px oklch(0.62 0.16 285 / .55), 0 -2px 0 rgba(255,255,255,.7) inset,
                0 -30px 50px -20px oklch(0.6 0.15 300 / .35) inset, 0 20px 30px -20px rgba(255,255,255,.9) inset; }
  .guijarro-brillo { position: absolute; top: 9%; left: 15%; width: 42%; height: 26%; border-radius: 50%; filter: blur(1px);
    background: radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.95), rgba(255,255,255,0) 72%); }
  .guijarro-nucleo { position: absolute; inset: 30% 28% 34% 28%; border-radius: 50%; filter: blur(6px);
    background: radial-gradient(circle at 50% 45%, rgba(255,255,255,.75), rgba(255,255,255,0) 70%); }
  .guijarro-ojo { position: absolute; top: 46%; width: 8%; height: 11%; border-radius: 50%; background: #1a1c2e;
    box-shadow: 0 1px 0 rgba(255,255,255,.6) inset; animation: blink 5.5s infinite; }
  .guijarro-ojo::after { content: ""; position: absolute; top: 18%; left: 22%; width: 38%; height: 30%; border-radius: 50%; background: rgba(255,255,255,.85); }
  .guijarro-rubor { position: absolute; top: 60%; width: 14%; height: 8%; border-radius: 50%; filter: blur(3px); background: oklch(0.8 0.12 10 / .55); }
  .guijarro-sombra { position: absolute; border-radius: 50%; filter: blur(6px); animation: shade 6s ease-in-out infinite;
    background: radial-gradient(ellipse, oklch(0.6 0.12 285 / .35), transparent 70%); }
  .destello { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0;
    box-shadow: 0 0 10px 2px rgba(255,255,255,.8); animation: twinkle 3.2s ease-in-out infinite; }
  .orbita { position: absolute; border-radius: 50%; border: 1px dashed var(--color-linea); animation: spin 40s linear infinite; }
  .orbita::after { content: ""; position: absolute; top: -5px; left: 50%; width: 10px; height: 10px; border-radius: 50%;
    background: var(--color-amarillo); box-shadow: 0 0 14px var(--color-amarillo); }

  /* ---- Anillo de nivel ------------------------------------------------- */
  .anillo { position: relative; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-size: 12.5px; font-weight: 700;
    background: conic-gradient(var(--color-violeta-2) calc(var(--p) * 1turn), rgba(16,19,35,.07) 0); }
  .anillo::after { content: ""; position: absolute; inset: 3px; border-radius: 50%; background: var(--color-fondo); }
  .anillo > span { position: relative; z-index: 1; }

  /* ---- Aparición progresiva ------------------------------------------- */
  .in { animation: rise .7s var(--ease-fluida) both; }
  .d1 { animation-delay: .05s } .d2 { animation-delay: .15s } .d3 { animation-delay: .25s } .d4 { animation-delay: .35s }
  .d5 { animation-delay: .45s } .d6 { animation-delay: .55s } .d7 { animation-delay: .65s } .d8 { animation-delay: .75s }
  .pop { animation: pop .35s var(--ease-fluida) both; }
}

@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes pop { 0% { transform: scale(.85); opacity: 0 } 70% { transform: scale(1.03) } 100% { transform: scale(1); opacity: 1 } }
@keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes float { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-12px) rotate(1.5deg); } }
@keyframes shade { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(.85); opacity: .6; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
@keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(.4); } 50% { opacity: .9; transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

## Componentes

Ver los archivos finales en `src/components/` tras la Task 6; el código se transcribe íntegro en el commit de esa tarea (Icono con `PATHS` por nombre, `Boton` con variantes `primary | glass | peligro`, `Barra` con `valor 0–1` y `acento`, `Mascota` con `size`, `Fondo` con `useLuzCursor`, `Avatar` con gradiente por hash, `Cabecera` con anillo de nivel, `Keypad` con `.tecla`, `Timer` con `.track/.fill`).

## Pantallas

Ver los archivos finales en `src/screens/` y `src/App.tsx` tras la Task 7. Contratos:

```ts
// Inicio
interface Props {
  perfil: Profile; sesiones: Session[]; ejercicios: EjercicioDB[];
  estadoReto: 'nuevo' | 'en_curso' | 'completado'; puntosHoy: number;
  onEmpezar: () => void; onVerResultado: () => void; cargando: boolean;
}
// Resumen: añade onVolver: () => void
// SinAcceso: exporta además Cargando()
```
