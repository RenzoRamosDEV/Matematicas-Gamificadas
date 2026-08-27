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

export type EstadoRacha = 'sin_empezar' | 'viva' | 'en_juego' | 'perdida';

/**
 * Qué pasará con la racha al completar el reto de hoy, con la misma regla que finalizar_sesion:
 * jugó ayer (u hoy) → sigue; ayer no pero anteayer sí y hay comodín → el comodín la salva ("en juego");
 * cualquier otro caso → se reinicia a 1 ("perdida"). Sirve para avisar en el inicio antes de jugar.
 */
export function estadoRacha(
  perfil: { racha_actual: number; ultima_sesion_fecha: string | null; comodines_disponibles: number; ultimo_comodin_fecha: string | null },
  hoy: string,
): { estado: EstadoRacha; racha: number } {
  const ultima = perfil.ultima_sesion_fecha;
  if (!ultima || perfil.racha_actual === 0) return { estado: 'sin_empezar', racha: 0 };
  if (ultima === hoy || ultima === sumarDias(hoy, -1)) return { estado: 'viva', racha: perfil.racha_actual };
  if (ultima === sumarDias(hoy, -2) && comodinesDisponibles(perfil, hoy) > 0) return { estado: 'en_juego', racha: perfil.racha_actual };
  return { estado: 'perdida', racha: 0 };
}
