import type { Op } from '../types';

export const MAX_DIGITOS = 7;

/**
 * En papel, suma, resta y multiplicación se escriben de derecha a izquierda
 * (primero las unidades), así que cada dígito nuevo entra por la izquierda y
 * los ya escritos no se mueven. La división es la excepción: el cociente se
 * escribe de izquierda a derecha.
 */
export const escribeDerechaAIzquierda = (op: Op) => op !== 'div';

/** Añade un dígito al buffer respetando el sentido de escritura de la operación. */
export function teclear(buffer: string, digito: string, op: Op): string {
  if (buffer.length >= MAX_DIGITOS) return buffer;
  if (escribeDerechaAIzquierda(op)) return digito + buffer;   // "5" → "05" → "105": el cero puede ser intermedio
  return buffer === '0' ? digito : buffer + digito;            // sin ceros a la izquierda
}

/** Borra el último dígito tecleado (el de la izquierda si se escribe de derecha a izquierda). */
export function borrarDigito(buffer: string, op: Op): string {
  return escribeDerechaAIzquierda(op) ? buffer.slice(1) : buffer.slice(0, -1);
}
