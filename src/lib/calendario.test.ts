import { describe, expect, it } from 'vitest';
import { mesDe, mesVecino, nombreDia, nombreMes, semanasDelMes } from './calendario';

describe('meses', () => {
  it('mesDe y mesVecino cruzan el año', () => {
    expect(mesDe('2026-08-26')).toBe('2026-08');
    expect(mesVecino('2026-12', 1)).toBe('2027-01');
    expect(mesVecino('2026-01', -1)).toBe('2025-12');
  });
  it('nombres en español con mayúscula inicial', () => {
    expect(nombreMes('2026-08')).toBe('Agosto de 2026');
    expect(nombreDia('2026-08-26')).toBe('Miércoles, 26 de agosto');
  });
});

describe('semanasDelMes', () => {
  it('agosto 2026 empieza en sábado: la primera fila trae 5 días de julio', () => {
    const s = semanasDelMes('2026-08');
    expect(s[0].map((c) => c.fecha)).toEqual(['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']);
    expect(s[0].map((c) => c.enMes)).toEqual([false, false, false, false, false, true, true]);
    expect(s.length).toBe(6);
    expect(s.at(-1)!.at(-1)!.fecha).toBe('2026-09-06');
  });
  it('un mes que empieza en lunes no tiene relleno delante', () => {
    const s = semanasDelMes('2026-06');   // 1 de junio de 2026 es lunes
    expect(s[0][0]).toEqual({ fecha: '2026-06-01', dia: 1, enMes: true });
    expect(s.length).toBe(5);
  });
  it('todas las filas tienen 7 días', () => {
    for (const mes of ['2026-02', '2027-02', '2026-10']) {
      expect(semanasDelMes(mes).every((f) => f.length === 7)).toBe(true);
    }
  });
});
