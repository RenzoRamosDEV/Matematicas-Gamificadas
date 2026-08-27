import type { Acento } from '../config';
import type { NombreIcono } from '../components/Icono';
import type { FaseDetalle, Op, Profile, Session } from '../types';

export interface ContextoLogros {
  perfil: Pick<Profile, 'puntos_total' | 'racha_max'>;
  sesiones: Pick<Session, 'estado' | 'detalle' | 'fecha' | 'puntos'>[];
}

export type CategoriaLogro =
  | 'Retos' | 'Racha' | 'Puntos'
  | 'Sumas' | 'Restas' | 'Multiplicaciones' | 'Divisiones'
  | 'Perfección' | 'Velocidad' | 'Especiales';

export const CATEGORIAS: CategoriaLogro[] = [
  'Retos', 'Racha', 'Puntos', 'Sumas', 'Restas', 'Multiplicaciones', 'Divisiones', 'Perfección', 'Velocidad', 'Especiales',
];

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: NombreIcono;
  acento: Acento;
  categoria: CategoriaLogro;
  condicion: (ctx: ContextoLogros) => boolean;
  progreso: (ctx: ContextoLogros) => { actual: number; meta: number };
}

const completadas = (c: ContextoLogros) => c.sesiones.filter((s) => s.estado === 'completada');
const fases = (c: ContextoLogros): FaseDetalle[] => completadas(c).flatMap((s) => s.detalle ?? []);

const aciertosDeSesion = (s: Pick<Session, 'detalle'>) => (s.detalle ?? []).reduce((n, f) => n + f.aciertos, 0);
const totalDeSesion = (s: Pick<Session, 'detalle'>) => (s.detalle ?? []).reduce((n, f) => n + f.total, 0);
export const esRetoValido = (s: Pick<Session, 'estado' | 'detalle'>) => {
  const total = totalDeSesion(s);
  return s.estado === 'completada' && total > 0 && aciertosDeSesion(s) * 2 >= total;
};
const retosValidos = (c: ContextoLogros) => c.sesiones.filter(esRetoValido);

const esPerfecta = (s: Pick<Session, 'detalle'>) => {
  const f = s.detalle ?? [];
  const total = f.reduce((n, x) => n + x.total, 0);
  return total > 0 && f.every((x) => x.aciertos === x.total);
};

const retos = (c: ContextoLogros) => retosValidos(c).length;
const rachaMax = (c: ContextoLogros) => c.perfil.racha_max;
const puntosTotal = (c: ContextoLogros) => c.perfil.puntos_total;
const aciertosDe = (op: Op) => (c: ContextoLogros) => fases(c).filter((f) => f.op === op).reduce((n, f) => n + f.aciertos, 0);
const aciertosTotales = (c: ContextoLogros) => fases(c).reduce((n, f) => n + f.aciertos, 0);
const fasesPerfectasDe = (op: Op) => (c: ContextoLogros) => fases(c).filter((f) => f.op === op && f.bonus_perfecta > 0).length;
const fasesPerfectas = (c: ContextoLogros) => fases(c).filter((f) => f.bonus_perfecta > 0).length;
const fasesRapidas = (c: ContextoLogros) => fases(c).filter((f) => f.bonus_velocidad > 0).length;
const sesionesPerfectas = (c: ContextoLogros) => completadas(c).filter(esPerfecta).length;
const mejorSesion = (c: ContextoLogros) => completadas(c).reduce((m, s) => Math.max(m, s.puntos), 0);
const esFinde = (fecha: string) => { const d = new Date(`${fecha}T00:00:00Z`).getUTCDay(); return d === 0 || d === 6; };
const retosEnFinde = (c: ContextoLogros) => retosValidos(c).filter((s) => esFinde(s.fecha)).length;

const logro = (
  id: string, categoria: CategoriaLogro, nombre: string, descripcion: string,
  icono: NombreIcono, acento: Acento, valor: (c: ContextoLogros) => number, objetivo: number,
): Logro => ({
  id, categoria, nombre, descripcion, icono, acento,
  condicion: (c) => valor(c) >= objetivo,
  progreso: (c) => ({ actual: Math.min(valor(c), objetivo), meta: objetivo }),
});

const OPS: { op: Op; cat: CategoriaLogro; icono: NombreIcono; acento: Acento; plural: string; niveles: [string, string, string] }[] = [
  { op: 'suma',  cat: 'Sumas',            icono: 'plus',   acento: 'azul',    plural: 'sumas',            niveles: ['Sumador', 'Maestro de sumas', 'Leyenda de las sumas'] },
  { op: 'resta', cat: 'Restas',           icono: 'minus',  acento: 'violeta', plural: 'restas',           niveles: ['Restador', 'Maestro de restas', 'Leyenda de las restas'] },
  { op: 'mult',  cat: 'Multiplicaciones', icono: 'times',  acento: 'verde',   plural: 'multiplicaciones', niveles: ['Multiplicador', 'Maestro de tablas', 'Leyenda de las tablas'] },
  { op: 'div',   cat: 'Divisiones',       icono: 'divide', acento: 'rosa',    plural: 'divisiones',       niveles: ['Divisor', 'Maestro de divisiones', 'Leyenda de las divisiones'] },
];

const porOperacion: Logro[] = OPS.flatMap(({ op, cat, icono, acento, plural, niveles }) => [
  logro(`${op}_25`,  cat, niveles[0], `Acierta 25 ${plural}`,  icono, acento, aciertosDe(op), 25),
  logro(`${op}_100`, cat, niveles[1], `Acierta 100 ${plural}`, icono, acento, aciertosDe(op), 100),
  logro(`${op}_250`, cat, niveles[2], `Acierta 250 ${plural}`, icono, acento, aciertosDe(op), 250),
  logro(`${op}_perfecta`, cat, `${cat} sin fallos`, `Una fase de ${plural} con todo bien`, 'medal', acento, fasesPerfectasDe(op), 1),
]);

export const LOGROS: Logro[] = [
  logro('primer_reto', 'Retos', 'Primer reto', 'Completa un reto con al menos la mitad bien', 'target', 'azul', retos, 1),
  logro('retos_5',   'Retos', 'Cinco retos',    'Cinco retos con al menos la mitad bien',   'target', 'azul', retos, 5),
  logro('retos_10',  'Retos', 'Diez retos',     'Diez retos con al menos la mitad bien',  'target', 'verde', retos, 10),
  logro('retos_30',  'Retos', 'Treinta retos',  'Treinta retos con al menos la mitad bien',  'target', 'violeta', retos, 30),
  logro('retos_100', 'Retos', 'Cien retos',     'Cien retos con al menos la mitad bien', 'trophy', 'amarillo', retos, 100),
  logro('racha_3',   'Racha', 'Tres seguidos', 'Racha de 3 días',   'flame', 'rosa', rachaMax, 3),
  logro('racha_7',   'Racha', 'Una semana',    'Racha de 7 días',   'flame', 'rosa', rachaMax, 7),
  logro('racha_14',  'Racha', 'Dos semanas',   'Racha de 14 días',  'flame', 'amarillo', rachaMax, 14),
  logro('racha_30',  'Racha', 'Un mes',        'Racha de 30 días',  'flame', 'violeta', rachaMax, 30),
  logro('racha_100', 'Racha', 'Cien días',     'Racha de 100 días', 'trophy', 'amarillo', rachaMax, 100),
  logro('puntos_500',   'Puntos', '500 puntos',    'Acumula 500 puntos',    'star', 'amarillo', puntosTotal, 500),
  logro('puntos_1000',  'Puntos', '1.000 puntos',  'Acumula 1.000 puntos',  'star', 'verde', puntosTotal, 1000),
  logro('puntos_2500',  'Puntos', '2.500 puntos',  'Acumula 2.500 puntos',  'star', 'azul', puntosTotal, 2500),
  logro('puntos_5000',  'Puntos', '5.000 puntos',  'Acumula 5.000 puntos',  'star', 'violeta', puntosTotal, 5000),
  logro('puntos_10000', 'Puntos', '10.000 puntos', 'Acumula 10.000 puntos', 'trophy', 'amarillo', puntosTotal, 10000),
  ...porOperacion,
  logro('fases_perfectas_10', 'Perfección', 'Diez perfectas',   'Diez fases con todo bien',            'medal', 'amarillo', fasesPerfectas, 10),
  logro('perfecta',           'Perfección', 'Sesión perfecta',  'Todo bien en las 4 fases de un reto', 'medal', 'amarillo', sesionesPerfectas, 1),
  logro('perfectas_5',        'Perfección', 'Cinco perfectas',  'Cinco retos sin ningún fallo',        'trophy', 'violeta', sesionesPerfectas, 5),
  logro('rapido_1',  'Velocidad', 'Rayo',       'Una fase perfecta con bonus de velocidad',   'zap', 'azul', fasesRapidas, 1),
  logro('rapido_10', 'Velocidad', 'Relámpago',  'Diez fases perfectas con bonus de velocidad', 'zap', 'violeta', fasesRapidas, 10),
  logro('aciertos_100',  'Especiales', 'Cien aciertos', 'Acierta 100 cuentas en total',   'check', 'verde', aciertosTotales, 100),
  logro('aciertos_500',  'Especiales', 'Quinientos',    'Acierta 500 cuentas en total',   'check', 'azul', aciertosTotales, 500),
  logro('aciertos_1000', 'Especiales', 'Mil aciertos',  'Acierta 1.000 cuentas en total', 'trophy', 'amarillo', aciertosTotales, 1000),
  logro('sesion_200',    'Especiales', 'Gran día',      'Consigue 200 puntos en un solo reto', 'spark', 'rosa', mejorSesion, 200),
  logro('sesion_400',    'Especiales', 'Día redondo',   'Consigue 400 puntos en un solo reto', 'spark', 'amarillo', mejorSesion, 400),
  logro('finde',         'Especiales', 'Finde matemático', 'Un reto con al menos la mitad bien en sábado o domingo', 'calendar', 'verde', retosEnFinde, 1),
];

export type LogroEvaluado = Logro & { conseguido: boolean; actual: number; meta: number };

export const evaluarLogros = (ctx: ContextoLogros): LogroEvaluado[] =>
  LOGROS.map((l) => ({ ...l, conseguido: l.condicion(ctx), ...l.progreso(ctx) }));
