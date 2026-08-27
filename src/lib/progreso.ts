import { ORDEN_FASES } from '../config';
import type { Op } from '../types';

export interface Progreso {
  hechas: Op[];
  actual: Op | null;
  pantalla: 'eligiendo' | 'jugando' | 'transicion' | 'finalizando';
  tiempos: Partial<Record<Op, number>>;
  inicios: Partial<Record<Op, number>>;
}

export const PROGRESO_INICIAL: Progreso = { hechas: [], actual: null, pantalla: 'eligiendo', tiempos: {}, inicios: {} };

export const pendientes = (p: Progreso): Op[] => ORDEN_FASES.filter((op) => !p.hechas.includes(op));

const esOp = (x: unknown): x is Op => typeof x === 'string' && (ORDEN_FASES as readonly string[]).includes(x);

export function normalizarProgreso(raw: unknown): Progreso {
  if (!raw || typeof raw !== 'object') return PROGRESO_INICIAL;
  const r = raw as Record<string, unknown>;
  const tiempos = (r.tiempos && typeof r.tiempos === 'object' ? r.tiempos : {}) as Progreso['tiempos'];
  const inicios = (r.inicios && typeof r.inicios === 'object' ? r.inicios : {}) as Progreso['inicios'];

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
  } catch {}
  return PROGRESO_INICIAL;
}

export function guardarProgreso(sessionId: string, p: Progreso) {
  try { localStorage.setItem(clave(sessionId), JSON.stringify(p)); } catch {}
}

export function borrarProgreso(sessionId: string) {
  try { localStorage.removeItem(clave(sessionId)); } catch {}
}
