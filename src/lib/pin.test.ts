import { describe, expect, it } from 'vitest';
import { pinCorrecto, sha256Hex } from './pin';

describe('pin', () => {
  it('sha256Hex coincide con el valor conocido', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('acepta el PIN configurado y rechaza otros', async () => {
    expect(await pinCorrecto('15591403')).toBe(true);
    expect(await pinCorrecto('15591404')).toBe(false);
    expect(await pinCorrecto('')).toBe(false);
  });
});
