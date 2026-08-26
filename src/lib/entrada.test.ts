import { describe, expect, it } from 'vitest';
import { borrarDigito, escribeDerechaAIzquierda, MAX_DIGITOS, teclear } from './entrada';

describe('sentido de escritura', () => {
  it('suma, resta y multiplicación van de derecha a izquierda; la división no', () => {
    expect(escribeDerechaAIzquierda('suma')).toBe(true);
    expect(escribeDerechaAIzquierda('resta')).toBe(true);
    expect(escribeDerechaAIzquierda('mult')).toBe(true);
    expect(escribeDerechaAIzquierda('div')).toBe(false);
  });
});

describe('teclear', () => {
  it('en la suma el primer dígito son las unidades y los siguientes entran por la izquierda', () => {
    let b = '';
    b = teclear(b, '1', 'suma'); expect(b).toBe('1');    // 772 + 159 = 931: primero el 1
    b = teclear(b, '3', 'suma'); expect(b).toBe('31');
    b = teclear(b, '9', 'suma'); expect(b).toBe('931');
  });
  it('permite un cero intermedio al escribir de derecha a izquierda (105)', () => {
    let b = teclear('', '5', 'resta');
    b = teclear(b, '0', 'resta'); expect(b).toBe('05');
    b = teclear(b, '1', 'resta'); expect(b).toBe('105');
    expect(Number(b)).toBe(105);
  });
  it('en la división se escribe de izquierda a derecha y sin ceros a la izquierda', () => {
    let b = teclear('', '0', 'div'); expect(b).toBe('0');
    b = teclear(b, '4', 'div'); expect(b).toBe('4');
    b = teclear(b, '2', 'div'); expect(b).toBe('42');
  });
  it('no supera el máximo de dígitos', () => {
    const lleno = '1'.repeat(MAX_DIGITOS);
    expect(teclear(lleno, '2', 'suma')).toBe(lleno);
    expect(teclear(lleno, '2', 'div')).toBe(lleno);
  });
});

describe('borrarDigito', () => {
  it('borra el último tecleado: el de la izquierda en suma, el de la derecha en división', () => {
    expect(borrarDigito('931', 'suma')).toBe('31');
    expect(borrarDigito('931', 'div')).toBe('93');
    expect(borrarDigito('', 'suma')).toBe('');
  });
});
