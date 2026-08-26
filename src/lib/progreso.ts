import type { Op } from '../types';

/**
 * Progreso de la sesión en curso, en localStorage. Sirve para que un refresco
 * a mitad de partida vuelva a la fase correcta (los ejercicios y respuestas ya
 * están en la DB). El timer de la fase en curso se reinicia: aceptable.
 */
export interface Progreso {
  fase: number;                      // índice en ORDEN_FASES; 4 = todas hechas
  pantalla: 'jugando' | 'transicion';
  tiempos: Partial<Record<Op, number>>;   // segundos restantes al cerrar cada fase
}

const clave = (sessionId: string) => `reto:${sessionId}`;

export function leerProgreso(sessionId: string): Progreso {
  try {
    const raw = localStorage.getItem(clave(sessionId));
    if (raw) return JSON.parse(raw) as Progreso;
  } catch { /* localStorage no disponible o corrupto: empezamos de cero */ }
  return { fase: 0, pantalla: 'jugando', tiempos: {} };
}

export function guardarProgreso(sessionId: string, p: Progreso) {
  try { localStorage.setItem(clave(sessionId), JSON.stringify(p)); } catch { /* ignorar */ }
}

export function borrarProgreso(sessionId: string) {
  try { localStorage.removeItem(clave(sessionId)); } catch { /* ignorar */ }
}
