import { describe, expect, it } from 'vitest';
import { colorDelDia } from '../lib/calendario';
import type { FaseDetalle, Session } from '../types';

const fase = (aciertos: number): FaseDetalle => ({ op: 'suma', aciertos, total: 5, bonus_perfecta: 0, bonus_velocidad: 0, puntos: 0 });
const sesion = (fases: FaseDetalle[]): Session => ({ id: 'x', fecha: '2026-08-20', estado: 'completada', puntos: 0, detalle: fases });

describe('colorDelDia', () => {
  it('verde si todo bien, amarillo con algún fallo, rojo si todo mal', () => {
    expect(colorDelDia(sesion([fase(5), fase(5)]), '2026-08-20', '2026-08-26')).toBe('verde');
    expect(colorDelDia(sesion([fase(5), fase(3)]), '2026-08-20', '2026-08-26')).toBe('amarillo');
    expect(colorDelDia(sesion([fase(0), fase(0)]), '2026-08-20', '2026-08-26')).toBe('rojo');
  });
  it('gris si el día pasó sin reto; nada si es futuro', () => {
    expect(colorDelDia(undefined, '2026-08-20', '2026-08-26')).toBe('gris');
    expect(colorDelDia(undefined, '2026-08-26', '2026-08-26')).toBe(null);   // hoy, aún sin reto
    expect(colorDelDia(undefined, '2026-09-01', '2026-08-26')).toBe(null);
  });
});
