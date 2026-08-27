import { describe, expect, it } from 'vitest';
import { pinCorrecto, sha256Hex, sha256HexJs } from './pin';

describe('pin', () => {
  it('sha256Hex coincide con el valor conocido', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('la versión en JS puro da lo mismo que Web Crypto, también con textos largos y no ASCII', async () => {
    for (const t of ['', 'abc', '15591403', 'ñandú 🧮 con acentos', 'x'.repeat(200)]) {
      expect(sha256HexJs(t)).toBe(await sha256Hex(t));
    }
    expect(sha256HexJs('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  it('acepta el PIN configurado y rechaza otros', async () => {
    expect(await pinCorrecto('15591403')).toBe(true);
    expect(await pinCorrecto('15591404')).toBe(false);
    expect(await pinCorrecto('')).toBe(false);
  });
});
