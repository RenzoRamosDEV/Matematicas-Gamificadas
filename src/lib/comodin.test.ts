import { describe, expect, it } from 'vitest';
import { comodinesDisponibles } from './comodin';

describe('comodinesDisponibles', () => {
  it('si la DB ya dice que hay, se respeta', () => {
    expect(comodinesDisponibles({ comodines_disponibles: 1, ultimo_comodin_fecha: '2026-08-20' }, '2026-08-27')).toBe(1);
  });
  it('gastado hace menos de 30 días: sigue a 0', () => {
    expect(comodinesDisponibles({ comodines_disponibles: 0, ultimo_comodin_fecha: '2026-08-17' }, '2026-08-27')).toBe(0);
    expect(comodinesDisponibles({ comodines_disponibles: 0, ultimo_comodin_fecha: '2026-07-29' }, '2026-08-27')).toBe(0); // 29 días
  });
  it('gastado hace 30 días o más: ya cuenta como disponible (la DB lo recargará al finalizar)', () => {
    expect(comodinesDisponibles({ comodines_disponibles: 0, ultimo_comodin_fecha: '2026-07-28' }, '2026-08-27')).toBe(1); // justo 30
    expect(comodinesDisponibles({ comodines_disponibles: 0, ultimo_comodin_fecha: '2026-06-01' }, '2026-08-27')).toBe(1);
    expect(comodinesDisponibles({ comodines_disponibles: 0, ultimo_comodin_fecha: null }, '2026-08-27')).toBe(1);
  });
});

import { estadoRacha } from './comodin';

describe('estadoRacha', () => {
  const base = { racha_actual: 4, comodines_disponibles: 1, ultimo_comodin_fecha: null };
  it('viva si jugó hoy o ayer', () => {
    expect(estadoRacha({ ...base, ultima_sesion_fecha: '2026-08-27' }, '2026-08-27')).toEqual({ estado: 'viva', racha: 4 });
    expect(estadoRacha({ ...base, ultima_sesion_fecha: '2026-08-26' }, '2026-08-27')).toEqual({ estado: 'viva', racha: 4 });
  });
  it('en juego si falló ayer y el comodín la puede salvar', () => {
    expect(estadoRacha({ ...base, ultima_sesion_fecha: '2026-08-25' }, '2026-08-27')).toEqual({ estado: 'en_juego', racha: 4 });
    // comodín gastado hace 31 días: se recargará, así que también la salva
    expect(estadoRacha({ ...base, comodines_disponibles: 0, ultimo_comodin_fecha: '2026-07-27', ultima_sesion_fecha: '2026-08-25' }, '2026-08-27').estado).toBe('en_juego');
  });
  it('perdida si falló ayer sin comodín, o faltan dos días o más', () => {
    expect(estadoRacha({ ...base, comodines_disponibles: 0, ultimo_comodin_fecha: '2026-08-20', ultima_sesion_fecha: '2026-08-25' }, '2026-08-27')).toEqual({ estado: 'perdida', racha: 0 });
    expect(estadoRacha({ ...base, ultima_sesion_fecha: '2026-08-24' }, '2026-08-27')).toEqual({ estado: 'perdida', racha: 0 });
  });
  it('sin empezar si nunca jugó', () => {
    expect(estadoRacha({ ...base, racha_actual: 0, ultima_sesion_fecha: null }, '2026-08-27')).toEqual({ estado: 'sin_empezar', racha: 0 });
  });
});
