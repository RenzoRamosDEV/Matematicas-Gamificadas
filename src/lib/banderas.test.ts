import { describe, expect, it } from 'vitest';
import { emojiDe, evaluar, hitosConseguidos, HITOS_BANDERAS, llevaTilde, PAISES, puntosDe, ronda } from './banderas';

describe('lista de países', () => {
  it('solo países de verdad: 195 (ONU + Vaticano y Palestina), códigos ISO únicos de 2 letras', () => {
    expect(PAISES).toHaveLength(195);
    expect(new Set(PAISES.map((p) => p.codigo)).size).toBe(195);
    expect(PAISES.every((p) => /^[A-Z]{2}$/.test(p.codigo))).toBe(true);
    expect(PAISES.every((p) => p.nombre.length > 1)).toBe(true);
  });
  it('el emoji sale del código ISO', () => {
    expect(emojiDe('ES')).toBe('🇪🇸');
    expect(emojiDe('JP')).toBe('🇯🇵');
    expect(emojiDe('mx')).toBe('🇲🇽');
  });
});

describe('evaluar la respuesta', () => {
  it('acierto normal: +2 aunque no ponga tildes ni mayúsculas', () => {
    expect(evaluar('Perú', 'peru')).toBe('bien');
    expect(evaluar('Francia', 'francia')).toBe('bien');
    expect(evaluar('España', 'espana')).toBe('bien');
    expect(puntosDe('bien')).toBe(2);
  });
  it('con su tilde bien puesta: +3 (solo si el país la lleva)', () => {
    expect(evaluar('Perú', 'perú')).toBe('con-tilde');
    expect(evaluar('Japón', 'JAPÓN')).toBe('con-tilde');
    expect(evaluar('Francia', 'Francia')).toBe('bien'); // sin tilde en el nombre no hay bonus
    expect(puntosDe('con-tilde')).toBe(3);
  });
  it('fallo: 0 puntos', () => {
    expect(evaluar('Perú', 'bolivia')).toBe('mal');
    expect(evaluar('Chad', '')).toBe('mal');
    expect(puntosDe('mal')).toBe(0);
  });
  it('perdona espacios de más y compara nombres compuestos', () => {
    expect(evaluar('Reino Unido', '  reino   unido ')).toBe('bien');
    expect(evaluar('Sudán del Sur', 'sudán del sur')).toBe('con-tilde');
  });
  it('llevaTilde distingue los países con tilde', () => {
    expect(llevaTilde('México')).toBe(true);
    expect(llevaTilde('España')).toBe(false); // la ñ no es tilde
    expect(llevaTilde('Chile')).toBe(false);
  });
});

describe('ronda', () => {
  it('saca n países distintos de la lista', () => {
    const r = ronda(10);
    expect(r).toHaveLength(10);
    expect(new Set(r.map((p) => p.codigo)).size).toBe(10);
    expect(r.every((p) => PAISES.some((x) => x.codigo === p.codigo))).toBe(true);
  });
});

describe('hitos de banderas adivinadas', () => {
  it('los hitos van de 10 a todas (195) y se calculan por total de distintas', () => {
    expect(HITOS_BANDERAS[HITOS_BANDERAS.length - 1]).toBe(PAISES.length);
    expect(hitosConseguidos(0)).toEqual({ conseguidos: [], siguiente: 10 });
    expect(hitosConseguidos(10)).toEqual({ conseguidos: [10], siguiente: 25 });
    expect(hitosConseguidos(120)).toEqual({ conseguidos: [10, 25, 50, 100], siguiente: 195 });
    expect(hitosConseguidos(195)).toEqual({ conseguidos: [10, 25, 50, 100, 195], siguiente: null });
  });
});
