import { sumarDias } from './semana';

export const DIAS_RECARGA_COMODIN = 30;

/**
 * Comodines que el jugador tiene realmente disponibles hoy. La DB recarga 1 comodín cada 30 días,
 * pero solo lo apunta al finalizar un reto; aquí anticipamos esa recarga para que el inicio no
 * muestre "0" cuando el comodín ya cubriría un día perdido.
 * Espejo de la regla de finalizar_sesion: comodines < 1 y (sin fecha de uso, o hace >= 30 días) → 1.
 */
export function comodinesDisponibles(perfil: { comodines_disponibles: number; ultimo_comodin_fecha: string | null }, hoy: string): number {
  if (perfil.comodines_disponibles >= 1) return perfil.comodines_disponibles;
  if (!perfil.ultimo_comodin_fecha || perfil.ultimo_comodin_fecha <= sumarDias(hoy, -DIAS_RECARGA_COMODIN)) return 1;
  return 0;
}
