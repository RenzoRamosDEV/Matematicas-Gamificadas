import type { Ejercicio, Op } from '../types';
import { ORDEN_FASES } from '../config';

export const r = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const tieneLlevadas = (a: number, b: number) => {
  let carry = 0;
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) + carry >= 10) return true;
    carry = 0; a = Math.floor(a / 10); b = Math.floor(b / 10);
  }
  return false;
};

export const tienePrestamos = (a: number, b: number) => {
  while (b > 0) {
    if (a % 10 < b % 10) return true;
    a = Math.floor(a / 10); b = Math.floor(b / 10);
  }
  return false;
};

export function genSuma(i: number, total: number): Ejercicio {
  const [min, max] = i < total * 0.4 ? [100, 999] : [1000, 9999];
  const a = r(min, max);
  const b = r(min, max);
  return { op: 'suma', a, b, sol: a + b };
}

export function genResta(i: number, total: number): Ejercicio {
  const [min, max] = i < total * 0.4 ? [100, 999] : [1000, 9999];
  const a = r(min + 1, max);
  const b = r(min, a - 1);
  return { op: 'resta', a, b, sol: a - b };
}

export function genMult(i: number, total: number): Ejercicio {
  const a = r(100, 999);
  let b: number;
  if (i < total / 2) {
    b = r(2, 9);
  } else {
    do { b = r(11, 99); } while (b % 10 === 0);
  }
  return { op: 'mult', a, b, sol: a * b };
}

export function genDiv(i: number, total: number): Ejercicio {
  const d = i < total * 0.6 ? r(2, 9) : r(11, 29);
  const qMin = Math.max(Math.ceil(100 / d), 2);
  const qMax = Math.floor(999 / d);
  const q = r(qMin, qMax);
  return { op: 'div', a: d * q, b: d, sol: q };
}

const GEN: Record<Op, (i: number, total: number) => Ejercicio> = {
  suma: genSuma, resta: genResta, mult: genMult, div: genDiv,
};

const clave = (e: Ejercicio) => `${e.op}:${e.a}:${e.b}`;

const CUOTA_DIFICILES = 0.7;
const MAX_INTENTOS = 50;

export function genFase(op: Op, total: number): Ejercicio[] {
  const out: Ejercicio[] = [];
  const vistos = new Set<string>();
  const maxDificiles = Math.round(total * CUOTA_DIFICILES);
  const maxLimpias = total - maxDificiles;
  let dificiles = 0;
  let limpias = 0;

  const esDificil = (e: Ejercicio) =>
    op === 'suma' ? tieneLlevadas(e.a, e.b)
    : op === 'resta' ? tienePrestamos(e.a, e.b)
    : null;

  for (let i = 0; i < total; i++) {
    let e = GEN[op](i, total);
    for (let intento = 0; intento < MAX_INTENTOS; intento++) {
      const repetido = vistos.has(clave(e));
      const dif = esDificil(e);
      const cuotaLlena = dif === null ? false : dif ? dificiles >= maxDificiles : limpias >= maxLimpias;
      if (!repetido && !cuotaLlena) break;
      e = GEN[op](i, total);
    }
    const dif = esDificil(e);
    if (dif === true) dificiles++;
    else if (dif === false) limpias++;
    vistos.add(clave(e));
    out.push(e);
  }
  return out;
}

export function genSesion(porFase: number): (Ejercicio & { orden: number })[] {
  return ORDEN_FASES.flatMap((op, f) =>
    genFase(op, porFase).map((e, i) => ({ ...e, orden: f * porFase + i })),
  );
}
