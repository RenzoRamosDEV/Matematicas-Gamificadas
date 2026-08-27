import { ORDEN_FASES } from '../config';
import type { EjercicioDB, Op, Session } from '../types';
import { esCorrecta } from './correccion';
import { tieneLlevadas, tienePrestamos } from './generador';
import { lunesDe } from './semana';
import { nombreMes } from './calendario';

export interface Datos {
  sesiones: Pick<Session, 'id' | 'fecha' | 'estado' | 'puntos'>[];
  cuentas: EjercicioDB[];
}

export interface CuentaConFecha extends EjercicioDB { fecha: string }

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const pct = (aciertos: number, total: number) => (total ? Math.round((aciertos / total) * 1000) / 10 : null);
const tiempoMedio = (cs: Pick<EjercicioDB, 'ms' | 'respuesta'>[]) => {
  const t = media(cs.filter((c) => c.respuesta !== null && c.ms !== null && c.ms > 0).map((c) => c.ms as number));
  return t === null ? null : Math.round(t / 100) / 10;
};

export function cuentasCompletadas(d: Datos): CuentaConFecha[] {
  const fechaDe = new Map(d.sesiones.filter((s) => s.estado === 'completada').map((s) => [s.id, s.fecha]));
  return d.cuentas
    .filter((c) => fechaDe.has(c.session_id))
    .map((c) => ({ ...c, fecha: fechaDe.get(c.session_id)! }))
    .sort((a, b) => (a.fecha === b.fecha ? a.orden - b.orden : a.fecha < b.fecha ? -1 : 1));
}

export interface Resumen {
  retos: number; cuentas: number; aciertos: number; fallos: number;
  porcentaje: number | null; promedioPorReto: number | null; tiempoMedio: number | null; puntos: number;
}

export function resumenGeneral(d: Datos): Resumen {
  const completadas = d.sesiones.filter((s) => s.estado === 'completada');
  const cs = cuentasCompletadas(d);
  const aciertos = cs.filter(esCorrecta).length;
  return {
    retos: completadas.length, cuentas: cs.length, aciertos, fallos: cs.length - aciertos,
    porcentaje: pct(aciertos, cs.length),
    promedioPorReto: completadas.length ? Math.round((aciertos / completadas.length) * 10) / 10 : null,
    tiempoMedio: tiempoMedio(cs),
    puntos: completadas.reduce((n, s) => n + s.puntos, 0),
  };
}

export type Granularidad = 'dia' | 'semana' | 'mes' | 'anio';

export interface Periodo {
  clave: string; etiqueta: string;
  retos: number; cuentas: number; aciertos: number; fallos: number;
  porcentaje: number | null; tiempoMedio: number | null; puntos: number;
}

const fmtDia = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtDiaCorto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const utc = (f: string) => { const [y, m, dd] = f.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)); };

export function claveDe(fecha: string, g: Granularidad): string {
  if (g === 'dia') return fecha;
  if (g === 'semana') return lunesDe(fecha);
  if (g === 'mes') return fecha.slice(0, 7);
  return fecha.slice(0, 4);
}

export function etiquetaDe(clave: string, g: Granularidad): string {
  if (g === 'dia') return fmtDia.format(utc(clave));
  if (g === 'semana') return `Semana del ${fmtDiaCorto.format(utc(clave))}`;
  if (g === 'mes') return nombreMes(clave).replace(' de ', ' ');
  return clave;
}

export function porPeriodo(d: Datos, g: Granularidad): Periodo[] {
  const completadas = d.sesiones.filter((s) => s.estado === 'completada');
  const cs = cuentasCompletadas(d);
  const grupos = new Map<string, { sesiones: typeof completadas; cuentas: CuentaConFecha[] }>();
  const grupo = (k: string) => grupos.get(k) ?? (grupos.set(k, { sesiones: [], cuentas: [] }), grupos.get(k)!);
  for (const s of completadas) grupo(claveDe(s.fecha, g)).sesiones.push(s);
  for (const c of cs) grupo(claveDe(c.fecha, g)).cuentas.push(c);
  return [...grupos.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([clave, x]) => {
      const aciertos = x.cuentas.filter(esCorrecta).length;
      return {
        clave, etiqueta: etiquetaDe(clave, g),
        retos: x.sesiones.length, cuentas: x.cuentas.length, aciertos, fallos: x.cuentas.length - aciertos,
        porcentaje: pct(aciertos, x.cuentas.length), tiempoMedio: tiempoMedio(x.cuentas),
        puntos: x.sesiones.reduce((n, s) => n + s.puntos, 0),
      };
    });
}

export interface Grupo { etiqueta: string; cuentas: number; aciertos: number; porcentaje: number | null; tiempoMedio: number | null }

const grupoDe = (etiqueta: string, cs: CuentaConFecha[]): Grupo => {
  const aciertos = cs.filter(esCorrecta).length;
  return { etiqueta, cuentas: cs.length, aciertos, porcentaje: pct(aciertos, cs.length), tiempoMedio: tiempoMedio(cs) };
};

export function porOperacion(d: Datos): (Grupo & { op: Op })[] {
  const cs = cuentasCompletadas(d);
  return ORDEN_FASES.map((op) => ({ op, ...grupoDe(op, cs.filter((c) => c.op === op)) }));
}

export interface CuentaFallada { op: Op; a: number; b: number; sol: number; fallos: number; intentos: number; respuestas: (number | null)[] }

export interface PuntosDebiles {
  sumas: Grupo[]; restas: Grupo[]; tablas: Grupo[]; divisores: Grupo[]; masFalladas: CuentaFallada[];
}

export function puntosDebiles(d: Datos, topN = 10): PuntosDebiles {
  const cs = cuentasCompletadas(d);
  const de = (op: Op) => cs.filter((c) => c.op === op);
  const sumas = de('suma'); const restas = de('resta'); const mult = de('mult'); const div = de('div');

  const porB = (xs: CuentaConFecha[], prefijo: string) =>
    [...new Set(xs.map((c) => c.b))].sort((a, b) => a - b).map((b) => grupoDe(`${prefijo}${b}`, xs.filter((c) => c.b === b)));

  const falladas = new Map<string, CuentaFallada>();
  for (const c of cs) {
    const k = `${c.op}|${c.a}|${c.b}`;
    const f = falladas.get(k) ?? { op: c.op, a: c.a, b: c.b, sol: c.sol, fallos: 0, intentos: 0, respuestas: [] };
    f.intentos += 1;
    if (!esCorrecta(c)) { f.fallos += 1; f.respuestas.push(c.respuesta); }
    falladas.set(k, f);
  }

  return {
    sumas: [grupoDe('Con llevadas', sumas.filter((c) => tieneLlevadas(c.a, c.b))), grupoDe('Sin llevadas', sumas.filter((c) => !tieneLlevadas(c.a, c.b)))],
    restas: [grupoDe('Con préstamos', restas.filter((c) => tienePrestamos(c.a, c.b))), grupoDe('Sin préstamos', restas.filter((c) => !tienePrestamos(c.a, c.b)))],
    tablas: porB(mult, 'Tabla del '),
    divisores: porB(div, 'Entre '),
    masFalladas: [...falladas.values()].filter((f) => f.fallos > 0)
      .sort((x, y) => y.fallos - x.fallos || y.intentos - x.intentos || x.a - y.a).slice(0, topN),
  };
}

export interface PuntoTiempo { clave: string; etiqueta: string; tiempoMedio: number | null; cuentas: number }
export interface Tiempos {
  general: number | null;
  porOperacion: { op: Op; tiempoMedio: number | null }[];
  porSemana: PuntoTiempo[];
  porMes: PuntoTiempo[];
}

const serieTiempo = (cs: CuentaConFecha[], g: Granularidad): PuntoTiempo[] => {
  const grupos = new Map<string, CuentaConFecha[]>();
  for (const c of cs) { const k = claveDe(c.fecha, g); grupos.set(k, [...(grupos.get(k) ?? []), c]); }
  return [...grupos.entries()].sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([clave, xs]) => ({ clave, etiqueta: etiquetaDe(clave, g), tiempoMedio: tiempoMedio(xs), cuentas: xs.length }));
};

export function tiempos(d: Datos): Tiempos {
  const cs = cuentasCompletadas(d);
  return {
    general: tiempoMedio(cs),
    porOperacion: ORDEN_FASES.map((op) => ({ op, tiempoMedio: tiempoMedio(cs.filter((c) => c.op === op)) })),
    porSemana: serieTiempo(cs, 'semana'),
    porMes: serieTiempo(cs, 'mes'),
  };
}

export function cuentasDelDia(d: Datos, fecha: string): (CuentaConFecha & { segundos: number | null })[] {
  return cuentasCompletadas(d).filter((c) => c.fecha === fecha)
    .map((c) => ({ ...c, segundos: c.ms !== null && c.ms > 0 ? Math.round(c.ms / 100) / 10 : null }));
}
