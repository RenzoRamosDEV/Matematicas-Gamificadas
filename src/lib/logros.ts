import type { Acento } from '../config';
import type { NombreIcono } from '../components/Icono';
import type { Profile, Session } from '../types';

export interface ContextoLogros {
  perfil: Pick<Profile, 'puntos_total' | 'racha_max'>;
  sesiones: Pick<Session, 'estado' | 'detalle'>[];
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: NombreIcono;
  acento: Acento;
  condicion: (ctx: ContextoLogros) => boolean;
  /** Cuánto lleva hacia la medalla (para la página de logros). */
  progreso: (ctx: ContextoLogros) => { actual: number; meta: number };
}

const completadas = (ctx: ContextoLogros) => ctx.sesiones.filter((s) => s.estado === 'completada');
const racha = (meta: number) => (c: ContextoLogros) => ({ actual: Math.min(c.perfil.racha_max, meta), meta });
const puntos = (meta: number) => (c: ContextoLogros) => ({ actual: Math.min(c.perfil.puntos_total, meta), meta });

const esPerfecta = (s: Pick<Session, 'detalle'>) => {
  const fases = s.detalle ?? [];
  const total = fases.reduce((n, f) => n + f.total, 0);
  return total > 0 && fases.every((f) => f.aciertos === f.total);
};

export const LOGROS: Logro[] = [
  { id: 'primer_reto', nombre: 'Primer reto', descripcion: 'Completa tu primer reto del día', icono: 'target', acento: 'azul', condicion: (c) => completadas(c).length >= 1, progreso: (c) => ({ actual: Math.min(completadas(c).length, 1), meta: 1 }) },
  { id: 'racha_3', nombre: 'Tres seguidos', descripcion: 'Racha de 3 días', icono: 'flame', acento: 'rosa', condicion: (c) => c.perfil.racha_max >= 3, progreso: racha(3) },
  { id: 'racha_7', nombre: 'Una semana', descripcion: 'Racha de 7 días', icono: 'flame', acento: 'rosa', condicion: (c) => c.perfil.racha_max >= 7, progreso: racha(7) },
  { id: 'racha_30', nombre: 'Un mes', descripcion: 'Racha de 30 días', icono: 'flame', acento: 'violeta', condicion: (c) => c.perfil.racha_max >= 30, progreso: racha(30) },
  { id: 'perfecta', nombre: 'Sesión perfecta', descripcion: 'Todo bien en las 4 fases', icono: 'medal', acento: 'amarillo', condicion: (c) => completadas(c).some(esPerfecta), progreso: (c) => ({ actual: Math.min(completadas(c).filter(esPerfecta).length, 1), meta: 1 }) },
  { id: 'puntos_500', nombre: '500 puntos', descripcion: 'Acumula 500 puntos', icono: 'star', acento: 'amarillo', condicion: (c) => c.perfil.puntos_total >= 500, progreso: puntos(500) },
  { id: 'puntos_1000', nombre: '1.000 puntos', descripcion: 'Acumula 1.000 puntos', icono: 'star', acento: 'verde', condicion: (c) => c.perfil.puntos_total >= 1000, progreso: puntos(1000) },
  { id: 'puntos_5000', nombre: '5.000 puntos', descripcion: 'Acumula 5.000 puntos', icono: 'star', acento: 'violeta', condicion: (c) => c.perfil.puntos_total >= 5000, progreso: puntos(5000) },
];

export const evaluarLogros = (ctx: ContextoLogros) => LOGROS.map((l) => ({ ...l, conseguido: l.condicion(ctx), ...l.progreso(ctx) }));
