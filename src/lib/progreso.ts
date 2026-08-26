import { ORDEN_FASES } from '../config';
import type { Op } from '../types';

/**
 * Progreso de la sesión en curso, en localStorage. Sirve para que un refresco
 * a mitad de partida vuelva al punto correcto (los ejercicios y respuestas ya
 * están en la DB). El timer de la fase en curso se reinicia: aceptable.
 *
 * Las fases se hacen en el orden que elija el jugador.
 */
export interface Progreso {
  hechas: Op[];                       // fases terminadas, en el orden en que se jugaron
  actual: Op | null;                  // fase en curso (o recién terminada, en 'transicion')
  pantalla: 'eligiendo' | 'jugando' | 'transicion' | 'finalizando';
  tiempos: Partial<Record<Op, number>>;   // segundos restantes al cerrar cada fase
  inicios: Partial<Record<Op, number>>;   // cuándo se eligió cada fase (epoch ms): el cronómetro sobrevive a salir o refrescar
}

export const PROGRESO_INICIAL: Progreso = { hechas: [], actual: null, pantalla: 'eligiendo', tiempos: {}, inicios: {} };

export const pendientes = (p: Progreso): Op[] => ORDEN_FASES.filter((op) => !p.hechas.includes(op));

const esOp = (x: unknown): x is Op => typeof x === 'string' && (ORDEN_FASES as readonly string[]).includes(x);

/** Acepta el formato actual y el antiguo ({ fase: n, pantalla }) y devuelve siempre un Progreso válido. */
export function normalizarProgreso(raw: unknown): Progreso {
  if (!raw || typeof raw !== 'object') return PROGRESO_INICIAL;
  const r = raw as Record<string, unknown>;
  const tiempos = (r.tiempos && typeof r.tiempos === 'object' ? r.tiempos : {}) as Progreso['tiempos'];
  const inicios = (r.inicios && typeof r.inicios === 'object' ? r.inicios : {}) as Progreso['inicios'];

  // Formato antiguo: índice secuencial en ORDEN_FASES
  if (typeof r.fase === 'number') {
    const n = Math.max(0, Math.min(ORDEN_FASES.length, r.fase));
    const hechas = [...ORDEN_FASES.slice(0, n)];
    if (n >= ORDEN_FASES.length) return { hechas, actual: null, pantalla: 'finalizando', tiempos, inicios };
    if (r.pantalla === 'transicion') return { hechas: [...hechas, ORDEN_FASES[n]], actual: ORDEN_FASES[n], pantalla: 'transicion', tiempos, inicios };
    return { hechas, actual: ORDEN_FASES[n], pantalla: 'jugando', tiempos, inicios };
  }

  const hechas = Array.isArray(r.hechas) ? [...new Set(r.hechas.filter(esOp))] : [];
  const actual = esOp(r.actual) ? r.actual : null;
  const pantallas: Progreso['pantalla'][] = ['eligiendo', 'jugando', 'transicion', 'finalizando'];
  let pantalla = pantallas.includes(r.pantalla as Progreso['pantalla']) ? (r.pantalla as Progreso['pantalla']) : 'eligiendo';
  if ((pantalla === 'jugando' || pantalla === 'transicion') && !actual) pantalla = 'eligiendo';
  if (hechas.length >= ORDEN_FASES.length) pantalla = pantalla === 'transicion' ? 'transicion' : 'finalizando';
  return { hechas, actual, pantalla, tiempos, inicios };
}

const clave = (sessionId: string) => `reto:${sessionId}`;

export function leerProgreso(sessionId: string): Progreso {
  try {
    const raw = localStorage.getItem(clave(sessionId));
    if (raw) return normalizarProgreso(JSON.parse(raw));
  } catch { /* localStorage no disponible o corrupto: empezamos de cero */ }
  return PROGRESO_INICIAL;
}

export function guardarProgreso(sessionId: string, p: Progreso) {
  try { localStorage.setItem(clave(sessionId), JSON.stringify(p)); } catch { /* ignorar */ }
}

export function borrarProgreso(sessionId: string) {
  try { localStorage.removeItem(clave(sessionId)); } catch { /* ignorar */ }
}
