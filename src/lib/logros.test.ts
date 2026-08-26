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
  it('cada medalla informa de su progreso, acotado a la meta', () => {
    const por = Object.fromEntries(evaluarLogros({ perfil: perfil(620, 1), sesiones: [completada([fase(5, 5)])] }).map((l) => [l.id, l]));
    expect([por.racha_3.actual, por.racha_3.meta]).toEqual([1, 3]);
    expect([por.puntos_500.actual, por.puntos_500.meta]).toEqual([500, 500]);
    expect([por.puntos_1000.actual, por.puntos_1000.meta]).toEqual([620, 1000]);
    expect([por.primer_reto.actual, por.perfecta.actual]).toEqual([1, 1]);
  });
  it('una sesión sin detalle no cuenta como perfecta', () => {
    expect(evaluarLogros({ perfil: perfil(0, 0), sesiones: [completada(null)] }).find((l) => l.id === 'perfecta')?.conseguido).toBe(false);
  });
});
