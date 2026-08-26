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
