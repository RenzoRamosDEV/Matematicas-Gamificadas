import { describe, expect, it } from 'vitest';
import { claveDe, cuentasCompletadas, cuentasDelDia, etiquetaDe, porOperacion, porPeriodo, puntosDebiles, resumenGeneral, tiempos, type Datos } from './estadisticas';
import type { EjercicioDB, Op } from '../types';

let n = 0;
const cuenta = (session_id: string, op: Op, a: number, b: number, sol: number, respuesta: number | null, ms: number | null = 5000): EjercicioDB =>
  ({ id: `c${n++}`, session_id, orden: n, op, a, b, sol, respuesta, correcta: respuesta !== null && respuesta === sol, ms });

const datos: Datos = {
  sesiones: [
    { id: 's1', fecha: '2026-08-24', estado: 'completada', puntos: 100 },   // lunes
    { id: 's2', fecha: '2026-08-31', estado: 'completada', puntos: 50 },    // lunes siguiente
    { id: 's3', fecha: '2026-09-01', estado: 'en_curso', puntos: 0 },       // no cuenta
  ],
  cuentas: [
    cuenta('s1', 'suma', 149, 979, 1128, 1128, 4000),      // con llevadas, bien
    cuenta('s1', 'suma', 120, 305, 425, 400, 8000),        // sin llevadas, mal
    cuenta('s1', 'resta', 1000, 347, 653, 653, 6000),      // con préstamos, bien
    cuenta('s1', 'mult', 58, 7, 406, 406, 2000),           // tabla del 7, bien
    cuenta('s1', 'div', 735, 7, 105, 15, null),            // entre 7, mal, sin tiempo
    cuenta('s2', 'suma', 120, 305, 425, 400, 10000),       // la misma cuenta, otra vez mal
    cuenta('s2', 'div', 144, 12, 12, null, 0),             // sin responder
    cuenta('s3', 'suma', 1, 1, 2, 2, 1000),                // sesión en curso: excluida
  ],
};

describe('cuentasCompletadas', () => {
  it('excluye las sesiones en curso y añade la fecha', () => {
    const cs = cuentasCompletadas(datos);
    expect(cs).toHaveLength(7);
    expect(cs.every((c) => c.fecha !== '2026-09-01')).toBe(true);
    expect(cs[0].fecha).toBe('2026-08-24');
  });
});

describe('resumenGeneral', () => {
  it('cuenta retos, aciertos, porcentaje, promedio y tiempo medio', () => {
    const r = resumenGeneral(datos);
    expect(r.retos).toBe(2);
    expect(r.cuentas).toBe(7);
    expect(r.aciertos).toBe(3);
    expect(r.fallos).toBe(4);
    expect(r.porcentaje).toBe(42.9);
    expect(r.promedioPorReto).toBe(1.5);
    // tiempos de cuentas respondidas con ms > 0: 4000, 8000, 6000, 2000, 10000 → 6 s
    expect(r.tiempoMedio).toBe(6);
    expect(r.puntos).toBe(150);
  });
  it('sin datos devuelve nulos, no NaN', () => {
    const r = resumenGeneral({ sesiones: [], cuentas: [] });
    expect(r.porcentaje).toBeNull(); expect(r.promedioPorReto).toBeNull(); expect(r.tiempoMedio).toBeNull(); expect(r.retos).toBe(0);
  });
});

describe('porPeriodo', () => {
  it('agrupa por día, semana, mes y año con etiquetas en español', () => {
    expect(porPeriodo(datos, 'dia').map((p) => p.clave)).toEqual(['2026-08-31', '2026-08-24']);
    expect(porPeriodo(datos, 'semana').map((p) => p.clave)).toEqual(['2026-08-31', '2026-08-24']);
    expect(porPeriodo(datos, 'mes').map((p) => p.clave)).toEqual(['2026-08']);
    expect(porPeriodo(datos, 'anio').map((p) => p.clave)).toEqual(['2026']);
    expect(etiquetaDe('2026-08', 'mes')).toBe('Agosto 2026');
    expect(etiquetaDe('2026-08-24', 'semana')).toBe('Semana del 24 ago');
    expect(claveDe('2026-08-27', 'semana')).toBe('2026-08-24');
  });
  it('calcula los agregados de cada periodo', () => {
    const [agosto] = porPeriodo(datos, 'mes');
    expect(agosto.retos).toBe(2); expect(agosto.cuentas).toBe(7); expect(agosto.aciertos).toBe(3); expect(agosto.puntos).toBe(150);
    const s1 = porPeriodo(datos, 'dia').find((p) => p.clave === '2026-08-24')!;
    expect(s1.aciertos).toBe(3); expect(s1.fallos).toBe(2); expect(s1.porcentaje).toBe(60); expect(s1.tiempoMedio).toBe(5);
  });
});

describe('porOperacion y puntos débiles', () => {
  it('acierto por operación', () => {
    const por = Object.fromEntries(porOperacion(datos).map((g) => [g.op, g]));
    expect(por.suma.porcentaje).toBe(33.3);
    expect(por.resta.porcentaje).toBe(100);
    expect(por.div.porcentaje).toBe(0);
  });
  it('clasifica llevadas, préstamos, tablas y divisores', () => {
    const pd = puntosDebiles(datos);
    expect(pd.sumas.find((g) => g.etiqueta === 'Con llevadas')?.porcentaje).toBe(100);
    expect(pd.sumas.find((g) => g.etiqueta === 'Sin llevadas')?.porcentaje).toBe(0);
    expect(pd.restas.find((g) => g.etiqueta === 'Con préstamos')?.cuentas).toBe(1);
    expect(pd.tablas.map((g) => g.etiqueta)).toEqual(['Tabla del 7']);
    expect(pd.divisores.map((g) => g.etiqueta)).toEqual(['Entre 7', 'Entre 12']);
  });
  it('las más falladas agrupan la misma cuenta y guardan las respuestas dadas', () => {
    const [peor] = puntosDebiles(datos).masFalladas;
    expect([peor.a, peor.b, peor.op]).toEqual([120, 305, 'suma']);
    expect(peor.fallos).toBe(2); expect(peor.intentos).toBe(2); expect(peor.respuestas).toEqual([400, 400]);
  });
});

describe('tiempos y día a día', () => {
  it('tiempo por operación ignora cuentas sin tiempo o sin responder', () => {
    const t = tiempos(datos);
    expect(t.general).toBe(6);
    expect(t.porOperacion.find((x) => x.op === 'div')?.tiempoMedio).toBeNull();
    expect(t.porSemana.map((p) => p.clave)).toEqual(['2026-08-24', '2026-08-31']);
    expect(t.porMes[0].tiempoMedio).toBe(6);
  });
  it('cuentas de un día con segundos', () => {
    const cs = cuentasDelDia(datos, '2026-08-24');
    expect(cs).toHaveLength(5);
    expect(cs[0].segundos).toBe(4);
    expect(cs[4].segundos).toBeNull();
    expect(cuentasDelDia(datos, '2026-09-01')).toHaveLength(0);
  });
});
