import { describe, expect, it } from 'vitest';
import { CATEGORIAS, evaluarLogros, LOGROS } from './logros';
import type { FaseDetalle, Op } from '../types';

const fase = (op: Op, aciertos: number, total = 5, extra: Partial<FaseDetalle> = {}): FaseDetalle => ({
  op, aciertos, total, bonus_perfecta: aciertos === total ? 25 : 0, bonus_velocidad: 0, puntos: aciertos * 10, ...extra,
});
const perfil = (puntos_total: number, racha_max: number) => ({ puntos_total, racha_max });
const completada = (detalle: FaseDetalle[] | null, fecha = '2026-08-26', puntos = 0) => ({ estado: 'completada' as const, detalle, fecha, puntos });
const por = (r: ReturnType<typeof evaluarLogros>) => Object.fromEntries(r.map((l) => [l.id, l]));

describe('catálogo', () => {
  it('tiene muchas medallas, con ids únicos y categoría conocida', () => {
    expect(LOGROS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
    expect(LOGROS.every((l) => CATEGORIAS.includes(l.categoria))).toBe(true);
  });
  it('sin historial ni puntos no hay nada conseguido', () => {
    expect(evaluarLogros({ perfil: perfil(0, 0), sesiones: [] }).every((l) => !l.conseguido)).toBe(true);
  });
});

describe('retos, racha y puntos', () => {
  it('cuentan retos completados, racha máxima y puntos del perfil', () => {
    const sesiones = Array.from({ length: 5 }, (_, i) => completada([fase('suma', 3)], `2026-08-0${i + 1}`));
    const p = por(evaluarLogros({ perfil: perfil(1000, 7), sesiones }));
    expect(p.primer_reto.conseguido).toBe(true);
    expect(p.retos_5.conseguido).toBe(true);
    expect(p.retos_10.conseguido).toBe(false);
    expect([p.retos_10.actual, p.retos_10.meta]).toEqual([5, 10]);
    expect(p.racha_7.conseguido).toBe(true);
    expect(p.racha_14.conseguido).toBe(false);
    expect(p.puntos_1000.conseguido).toBe(true);
    expect([p.puntos_2500.actual, p.puntos_2500.meta]).toEqual([1000, 2500]);
  });
});

describe('por operación', () => {
  it('suma los aciertos de cada operación a lo largo del historial', () => {
    const sesiones = Array.from({ length: 6 }, (_, i) => completada([fase('suma', 5), fase('resta', 4), fase('mult', 1), fase('div', 0)], `2026-08-1${i}`));
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones }));
    expect(p.suma_25.conseguido).toBe(true);        // 30 aciertos
    expect([p.suma_100.actual, p.suma_100.meta]).toEqual([30, 100]);
    expect(p.resta_25.conseguido).toBe(false);      // 24
    expect(p.mult_25.actual).toBe(6);
    expect(p.div_25.actual).toBe(0);
  });
  it('la fase perfecta por operación mira bonus_perfecta', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([fase('suma', 5), fase('resta', 4)])] }));
    expect(p.suma_perfecta.conseguido).toBe(true);
    expect(p.resta_perfecta.conseguido).toBe(false);
  });
});

describe('perfección, velocidad y especiales', () => {
  const perfecta = [fase('suma', 5, 5, { bonus_velocidad: 20 }), fase('resta', 5), fase('mult', 5), fase('div', 5)];
  it('sesión perfecta y fases rápidas', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada(perfecta, '2026-08-26', 295)] }));
    expect(p.perfecta.conseguido).toBe(true);
    expect(p.perfectas_5.actual).toBe(1);
    expect(p.rapido_1.conseguido).toBe(true);
    expect([p.fases_perfectas_10.actual, p.fases_perfectas_10.meta]).toEqual([4, 10]);
  });
  it('una sesión con un fallo no es perfecta', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([fase('suma', 5), fase('resta', 4)])] }));
    expect(p.perfecta.conseguido).toBe(false);
  });
  it('gran día usa los puntos de la mejor sesión', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([], '2026-08-25', 120), completada([], '2026-08-26', 260)] }));
    expect(p.sesion_200.conseguido).toBe(true);
    expect([p.sesion_400.actual, p.sesion_400.meta]).toEqual([260, 400]);
  });
  it('finde matemático detecta sábado o domingo', () => {
    expect(por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([], '2026-08-26')] })).finde.conseguido).toBe(false); // miércoles
    expect(por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([], '2026-08-29')] })).finde.conseguido).toBe(true);  // sábado
    expect(por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada([], '2026-08-30')] })).finde.conseguido).toBe(true);  // domingo
  });
  it('aciertos totales suman todas las operaciones', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada(perfecta), completada(perfecta, '2026-08-25')] }));
    expect(p.aciertos_100.actual).toBe(40);
  });
  it('una sesión sin detalle no rompe nada', () => {
    const p = por(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada(null)] }));
    expect(p.perfecta.conseguido).toBe(false);
    expect(p.primer_reto.conseguido).toBe(true);
  });
});
