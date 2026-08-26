import { describe, expect, it } from 'vitest';
import { genDiv, genFase, genMult, genResta, genSesion, genSuma, tieneLlevadas, tienePrestamos } from './generador';

const digitos = (n: number) => String(n).length;

describe('detectores', () => {
  it('llevadas', () => {
    expect(tieneLlevadas(123, 456)).toBe(false);
    expect(tieneLlevadas(129, 456)).toBe(true);
    expect(tieneLlevadas(999, 1)).toBe(true);
  });
  it('préstamos', () => {
    expect(tienePrestamos(456, 123)).toBe(false);
    expect(tienePrestamos(450, 123)).toBe(true);
  });
});

describe('genSuma', () => {
  it('rampa 3 → 4 dígitos', () => {
    for (let k = 0; k < 200; k++) {
      const e3 = genSuma(0, 10), e4 = genSuma(9, 10);
      expect(digitos(e3.a)).toBe(3); expect(digitos(e3.b)).toBe(3);
      expect(digitos(e4.a)).toBe(4); expect(digitos(e4.b)).toBe(4);
      expect(e3.sol).toBe(e3.a + e3.b);
    }
  });
});

describe('genResta', () => {
  it('nunca negativa ni cero, con b >= min', () => {
    for (let k = 0; k < 2000; k++) {
      const i = k % 10;
      const e = genResta(i, 10);
      expect(e.a).toBeGreaterThan(e.b);
      expect(e.b).toBeGreaterThanOrEqual(i < 4 ? 100 : 1000);
      expect(e.sol).toBe(e.a - e.b);
      expect(e.sol).toBeGreaterThan(0);
    }
  });
});

describe('genMult', () => {
  it('excluye 0, 1 y múltiplos de 10; a de 3 dígitos', () => {
    for (let k = 0; k < 2000; k++) {
      const i = k % 10;
      const e = genMult(i, 10);
      expect(digitos(e.a)).toBe(3);
      expect(e.b).toBeGreaterThanOrEqual(2);
      expect(e.b % 10).not.toBe(0);
      if (i < 5) expect(e.b).toBeLessThanOrEqual(9);
      else expect(e.b).toBeGreaterThanOrEqual(11);
      expect(e.sol).toBe(e.a * e.b);
    }
  });
});

describe('genDiv', () => {
  it('exacta, dividendo de 3 dígitos, divisor acotado', () => {
    for (let k = 0; k < 2000; k++) {
      const i = k % 10;
      const e = genDiv(i, 10);
      expect(e.a % e.b).toBe(0);
      expect(e.a).toBeGreaterThanOrEqual(100);
      expect(e.a).toBeLessThanOrEqual(999);
      expect(e.sol).toBe(e.a / e.b);
      expect(e.sol).toBeGreaterThanOrEqual(2);
      if (i < 6) expect(e.b).toBeLessThanOrEqual(9);
      else { expect(e.b).toBeGreaterThanOrEqual(11); expect(e.b).toBeLessThanOrEqual(29); }
    }
  });
});

describe('genFase', () => {
  it('sin repetidos', () => {
    for (const op of ['suma', 'resta', 'mult', 'div'] as const) {
      for (let k = 0; k < 50; k++) {
        const fase = genFase(op, 10);
        const claves = new Set(fase.map((e) => `${e.op}:${e.a}:${e.b}`));
        expect(claves.size).toBe(10);
      }
    }
  });
  it('cuota ~70% de llevadas en sumas y préstamos en restas', () => {
    let llev = 0, prest = 0;
    const N = 200;
    for (let k = 0; k < N; k++) {
      llev += genFase('suma', 10).filter((e) => tieneLlevadas(e.a, e.b)).length;
      prest += genFase('resta', 10).filter((e) => tienePrestamos(e.a, e.b)).length;
    }
    expect(llev / (N * 10)).toBeCloseTo(0.7, 1);
    expect(prest / (N * 10)).toBeCloseTo(0.7, 1);
  });
});

describe('genSesion', () => {
  it('4 fases en orden con orden global', () => {
    const s = genSesion(5);
    expect(s).toHaveLength(20);
    expect(s.map((e) => e.orden)).toEqual([...Array(20).keys()]);
    expect(s.slice(0, 5).every((e) => e.op === 'suma')).toBe(true);
    expect(s.slice(15).every((e) => e.op === 'div')).toBe(true);
  });
});
