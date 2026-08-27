import { describe, expect, it } from 'vitest';
import { agruparPorOperacion, esCorrecta } from './correccion';
import type { EjercicioDB } from '../types';

const ej = (op: EjercicioDB['op'], orden: number, sol: number, respuesta: number | null, correcta: boolean | null = null): EjercicioDB =>
  ({ id: `${op}${orden}`, session_id: 's', orden, op, a: 1, b: 1, sol, respuesta, correcta, ms: null });

describe('esCorrecta', () => {
  it('compara respuesta y solución; sin responder es fallo', () => {
    expect(esCorrecta(ej('suma', 0, 10, 10))).toBe(true);
    expect(esCorrecta(ej('suma', 0, 10, 11))).toBe(false);
    expect(esCorrecta(ej('suma', 0, 10, null))).toBe(false);
  });
  it('si la DB ya corrigió, manda su veredicto', () => {
    expect(esCorrecta(ej('suma', 0, 10, 10, false))).toBe(false);
  });
});

describe('agruparPorOperacion', () => {
  it('agrupa en orden canónico, ordena por orden y cuenta aciertos', () => {
    const g = agruparPorOperacion([ej('div', 1, 4, 4), ej('suma', 1, 5, 6), ej('suma', 0, 3, 3), ej('div', 0, 9, null)]);
    expect(g.map((x) => x.op)).toEqual(['suma', 'div']);
    expect(g[0].ejercicios.map((e) => e.orden)).toEqual([0, 1]);
    expect(g[0].aciertos).toBe(1);
    expect(g[1].aciertos).toBe(1);
  });
});
