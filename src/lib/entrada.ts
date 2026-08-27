import type { Op } from '../types';

export const MAX_DIGITOS = 7;

export const escribeDerechaAIzquierda = (op: Op) => op !== 'div';

export function teclear(buffer: string, digito: string, op: Op): string {
  if (buffer.length >= MAX_DIGITOS) return buffer;
  if (escribeDerechaAIzquierda(op)) return digito + buffer;
  return buffer === '0' ? digito : buffer + digito;
}

export function borrarDigito(buffer: string, op: Op): string {
  return escribeDerechaAIzquierda(op) ? buffer.slice(1) : buffer.slice(0, -1);
}
