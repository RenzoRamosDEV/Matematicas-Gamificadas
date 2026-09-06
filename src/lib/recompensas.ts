import type { Acento } from '../config';
import type { NombreIcono } from '../components/Icono';

export interface Recompensa {
  id: string;
  nombre: string;
  detalle: string;
  cada: number; // puntos que cuesta cada vez (espejo de cfg_precio_recompensa en SQL)
  icono: NombreIcono;
  acento: Acento;
}

// Premios de verdad, pactados en casa. Al canjear se reinicia el contador
// de esa recompensa, pero los puntos totales no se gastan.
export const RECOMPENSAS: Recompensa[] = [
  { id: 'cine', nombre: 'Ir al cine', detalle: 'Cada 6.000 puntos', cada: 6000, icono: 'play', acento: 'rosa' },
  { id: 'comida', nombre: 'Comida fuera, la que tú elijas', detalle: 'Cada 12.000 puntos', cada: 12000, icono: 'trophy', acento: 'amarillo' },
];

export interface Canje {
  id: string;
  recompensa: string;
  puntos: number; // puntos totales que llevaba al canjear: la nueva base del contador
  created_at: string;
}

export interface EstadoRecompensa {
  canjeadas: number;
  progreso: number;   // puntos ganados desde el último canje
  faltan: number;
  disponible: boolean;
}

export function estadoRecompensa(puntosTotal: number, cada: number, canjes: Pick<Canje, 'puntos'>[] = []): EstadoRecompensa {
  const puntos = Math.max(0, puntosTotal);
  const base = canjes.reduce((m, c) => Math.max(m, c.puntos), 0);
  const progreso = Math.max(0, puntos - base);
  return { canjeadas: canjes.length, progreso, faltan: Math.max(0, cada - progreso), disponible: progreso >= cada };
}
