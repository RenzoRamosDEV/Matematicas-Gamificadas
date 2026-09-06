import { describe, expect, it } from 'vitest';
import { esTema, TEMAS, temaGuardado } from './tema';

describe('temas', () => {
  it('hay 4 temas con ids únicos y cristal es el primero', () => {
    expect(TEMAS).toHaveLength(4);
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(4);
    expect(TEMAS[0].id).toBe('cristal');
  });
  it('esTema valida solo los ids conocidos', () => {
    expect(esTema('papel')).toBe(true);
    expect(esTema('terminal')).toBe(true);
    expect(esTema('oscuro')).toBe(false);
    expect(esTema(null)).toBe(false);
  });
  it('sin almacenamiento disponible cae a cristal', () => {
    expect(temaGuardado()).toBe('cristal');
  });
});
