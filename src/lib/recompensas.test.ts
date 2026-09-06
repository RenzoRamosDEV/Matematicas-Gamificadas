import { describe, expect, it } from 'vitest';
import { estadoRecompensa, RECOMPENSAS } from './recompensas';

describe('recompensas', () => {
  it('cine cada 6000 y comida cada 12000', () => {
    expect(RECOMPENSAS.map((r) => [r.id, r.cada])).toEqual([['cine', 6000], ['comida', 12000]]);
  });
  it('sin puntos: nada disponible y falta el precio entero', () => {
    expect(estadoRecompensa(0, 6000)).toEqual({ canjeadas: 0, progreso: 0, faltan: 6000, disponible: false });
  });
  it('a medio camino cuenta el progreso y lo que falta', () => {
    expect(estadoRecompensa(4200, 6000)).toEqual({ canjeadas: 0, progreso: 4200, faltan: 1800, disponible: false });
  });
  it('al llegar al precio queda disponible (y se puede pasar de largo sin canjear)', () => {
    expect(estadoRecompensa(6000, 6000).disponible).toBe(true);
    expect(estadoRecompensa(9000, 6000)).toEqual({ canjeadas: 0, progreso: 9000, faltan: 0, disponible: true });
  });
  it('canjear reinicia el contador desde los puntos del canje, sin gastar puntos', () => {
    // canjeó con 7000: la base es 7000 y vuelve a necesitar 6000 más
    const canjes = [{ puntos: 7000 }];
    expect(estadoRecompensa(7000, 6000, canjes)).toEqual({ canjeadas: 1, progreso: 0, faltan: 6000, disponible: false });
    expect(estadoRecompensa(10500, 6000, canjes)).toEqual({ canjeadas: 1, progreso: 3500, faltan: 2500, disponible: false });
    expect(estadoRecompensa(13000, 6000, canjes)).toEqual({ canjeadas: 1, progreso: 6000, faltan: 0, disponible: true });
  });
  it('cada recompensa lleva su cuenta: manda el canje más alto', () => {
    const canjes = [{ puntos: 6200 }, { puntos: 13000 }];
    expect(estadoRecompensa(15000, 6000, canjes)).toEqual({ canjeadas: 2, progreso: 2000, faltan: 4000, disponible: false });
  });
  it('los puntos negativos no rompen nada', () => {
    expect(estadoRecompensa(-5, 6000)).toEqual({ canjeadas: 0, progreso: 0, faltan: 6000, disponible: false });
  });
});
