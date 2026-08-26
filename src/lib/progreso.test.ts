import { describe, expect, it } from 'vitest';
import { normalizarProgreso, pendientes, PROGRESO_INICIAL, type Progreso } from './progreso';

describe('normalizarProgreso', () => {
  it('con basura devuelve el progreso inicial', () => {
    expect(normalizarProgreso(null)).toEqual(PROGRESO_INICIAL);
    expect(normalizarProgreso('x')).toEqual(PROGRESO_INICIAL);
    expect(normalizarProgreso({ hechas: ['nada'], actual: 'raro', pantalla: 'jugando' })).toEqual(PROGRESO_INICIAL);
  });
  it('migra el formato antiguo secuencial', () => {
    expect(normalizarProgreso({ fase: 0, pantalla: 'jugando', tiempos: {} }))
      .toEqual({ hechas: [], actual: 'suma', pantalla: 'jugando', tiempos: {}, inicios: {} });
    expect(normalizarProgreso({ fase: 1, pantalla: 'transicion', tiempos: { suma: 30, resta: 10 } }))
      .toEqual({ hechas: ['suma', 'resta'], actual: 'resta', pantalla: 'transicion', tiempos: { suma: 30, resta: 10 }, inicios: {} });
    expect(normalizarProgreso({ fase: 4, pantalla: 'jugando', tiempos: {} }).pantalla).toBe('finalizando');
  });
  it('respeta el formato nuevo y corrige incoherencias', () => {
    const p: Progreso = { hechas: ['div', 'suma'], actual: 'mult', pantalla: 'jugando', tiempos: { div: 5, suma: 0 }, inicios: { mult: 1700000000000 } };
    expect(normalizarProgreso(p)).toEqual(p);
    expect(normalizarProgreso({ hechas: ['div'], actual: null, pantalla: 'jugando' }).pantalla).toBe('eligiendo');
    expect(normalizarProgreso({ hechas: ['suma', 'resta', 'mult', 'div'], actual: null, pantalla: 'eligiendo' }).pantalla).toBe('finalizando');
    expect(normalizarProgreso({ hechas: ['suma', 'suma'], actual: null, pantalla: 'eligiendo' }).hechas).toEqual(['suma']);
  });
});

describe('pendientes', () => {
  it('devuelve las fases que faltan en el orden canónico', () => {
    expect(pendientes({ ...PROGRESO_INICIAL, hechas: ['div', 'suma'] })).toEqual(['resta', 'mult']);
    expect(pendientes(PROGRESO_INICIAL)).toEqual(['suma', 'resta', 'mult', 'div']);
  });
});
