import type { Session } from '../types';
import { sumarDias } from './semana';

export interface Ausencias {
  dias: number;      // días sin reto completado desde el primer reto (sin contar hoy)
  peorTanda: number; // la tanda más larga de días seguidos sin entrar
}

// El registro contrario a la racha: cuántos días no entró. Hoy no cuenta
// como falta mientras el día no haya acabado, y antes del primer reto no hay nada que contar.
export function ausencias(sesiones: Pick<Session, 'fecha' | 'estado'>[], hoy: string): Ausencias {
  const jugadas = new Set(sesiones.filter((s) => s.estado === 'completada').map((s) => s.fecha));
  if (jugadas.size === 0) return { dias: 0, peorTanda: 0 };
  const primera = [...jugadas].sort()[0];
  let dias = 0;
  let tanda = 0;
  let peor = 0;
  for (let f = primera; f < hoy; f = sumarDias(f, 1)) {
    if (jugadas.has(f)) { tanda = 0; continue; }
    dias++;
    tanda++;
    if (tanda > peor) peor = tanda;
  }
  return { dias, peorTanda: peor };
}
