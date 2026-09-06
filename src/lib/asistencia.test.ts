import { describe, expect, it } from 'vitest';
import { ausencias } from './asistencia';

const s = (fecha: string, estado: 'completada' | 'en_curso' = 'completada') => ({ fecha, estado });

describe('ausencias', () => {
  it('sin retos completados no hay nada que contar', () => {
    expect(ausencias([], '2026-09-06')).toEqual({ dias: 0, peorTanda: 0 });
    expect(ausencias([s('2026-09-05', 'en_curso')], '2026-09-06')).toEqual({ dias: 0, peorTanda: 0 });
  });
  it('jugar todos los días es 0', () => {
    expect(ausencias([s('2026-09-04'), s('2026-09-05')], '2026-09-06')).toEqual({ dias: 0, peorTanda: 0 });
  });
  it('hoy no cuenta como falta aunque todavía no haya jugado', () => {
    expect(ausencias([s('2026-09-05')], '2026-09-06')).toEqual({ dias: 0, peorTanda: 0 });
  });
  it('cuenta los huecos y la peor tanda seguida', () => {
    // juega el 1, falta 2-3, juega el 4, falta 5-6-7, juega el 8; hoy es 9
    const ses = [s('2026-09-01'), s('2026-09-04'), s('2026-09-08')];
    expect(ausencias(ses, '2026-09-09')).toEqual({ dias: 5, peorTanda: 3 });
  });
  it('los retos a medias no cuentan como día jugado', () => {
    expect(ausencias([s('2026-09-01'), s('2026-09-03', 'en_curso')], '2026-09-05')).toEqual({ dias: 3, peorTanda: 3 });
  });
  it('cruza meses sin despeinarse', () => {
    expect(ausencias([s('2026-08-30'), s('2026-09-02')], '2026-09-03')).toEqual({ dias: 2, peorTanda: 2 });
  });
});
