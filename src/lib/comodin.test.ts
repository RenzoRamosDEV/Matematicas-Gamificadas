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
