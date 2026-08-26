import { describe, expect, it } from 'vitest';
import { hoyMadrid, lunesDe, puntosSemana, semanaActual, sumarDias } from './semana';

describe('fechas', () => {
  it('hoyMadrid usa la zona Europe/Madrid', () => {
    expect(hoyMadrid(new Date('2026-08-26T23:30:00Z'))).toBe('2026-08-27'); // UTC+2 en verano
    expect(hoyMadrid(new Date('2026-01-10T12:00:00Z'))).toBe('2026-01-10');
  });
  it('sumarDias y lunesDe operan sobre YYYY-MM-DD', () => {
    expect(sumarDias('2026-08-30', 2)).toBe('2026-09-01');
    expect(lunesDe('2026-08-26')).toBe('2026-08-24'); // miércoles → lunes
    expect(lunesDe('2026-08-24')).toBe('2026-08-24');
    expect(lunesDe('2026-08-30')).toBe('2026-08-24'); // domingo → lunes anterior
  });
});

describe('semanaActual', () => {
  const sesiones = [
    { fecha: '2026-08-24', puntos: 120, estado: 'completada' as const },
    { fecha: '2026-08-25', puntos: 80, estado: 'completada' as const },
    { fecha: '2026-08-26', puntos: 200, estado: 'en_curso' as const },   // no cuenta
    { fecha: '2026-08-17', puntos: 999, estado: 'completada' as const },  // semana pasada
  ];
  const dias = semanaActual(sesiones, '2026-08-26');

  it('devuelve lunes a domingo con etiquetas', () => {
    expect(dias.map((d) => d.etiqueta)).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D']);
    expect(dias[0].fecha).toBe('2026-08-24');
    expect(dias[6].fecha).toBe('2026-08-30');
  });
  it('asigna puntos solo de sesiones completadas de esta semana', () => {
    expect(dias.map((d) => d.puntos)).toEqual([120, 80, 0, 0, 0, 0, 0]);
    expect(puntosSemana(dias)).toBe(200);
  });
  it('marca hoy y los días futuros', () => {
    expect(dias[2].esHoy).toBe(true);
    expect(dias.map((d) => d.futuro)).toEqual([false, false, false, true, true, true, true]);
  });
});
