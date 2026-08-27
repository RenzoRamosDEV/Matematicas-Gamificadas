import { ORDEN_FASES } from '../config';
import type { EjercicioDB, Op } from '../types';

/** Misma regla que la RPC: respondida y igual a la solución. Si la DB ya corrigió, manda su veredicto. */
export const esCorrecta = (e: Pick<EjercicioDB, 'respuesta' | 'sol' | 'correcta'>) =>
  e.correcta ?? (e.respuesta !== null && e.respuesta === e.sol);

export interface GrupoCorreccion { op: Op; ejercicios: EjercicioDB[]; aciertos: number }

/** Agrupa las cuentas por operación en el orden canónico, con su número de aciertos. */
export function agruparPorOperacion(ejercicios: EjercicioDB[]): GrupoCorreccion[] {
  return ORDEN_FASES
    .map((op) => {
      const de = ejercicios.filter((e) => e.op === op).sort((a, b) => a.orden - b.orden);
      return { op, ejercicios: de, aciertos: de.filter(esCorrecta).length };
    })
    .filter((g) => g.ejercicios.length > 0);
}
