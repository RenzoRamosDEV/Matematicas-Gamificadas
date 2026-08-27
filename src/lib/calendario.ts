import type { Session } from '../types';
import { sumarDias } from './semana';

export type Mes = string;

export const mesDe = (fecha: string): Mes => fecha.slice(0, 7);

export function mesVecino(mes: Mes, delta: number): Mes {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const fmtMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export function nombreMes(mes: Mes): string {
  const [y, m] = mes.split('-').map(Number);
  const s = fmtMes.format(new Date(Date.UTC(y, m - 1, 1)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const fmtDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
export function nombreDia(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const s = fmtDia.format(new Date(Date.UTC(y, m - 1, d)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface CeldaMes {
  fecha: string;
  dia: number;
  enMes: boolean;
}

export function semanasDelMes(mes: Mes): CeldaMes[][] {
  const [y, m] = mes.split('-').map(Number);
  const primero = `${mes}-01`;
  const dow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const inicio = sumarDias(primero, -((dow + 6) % 7));
  const diasEnMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const filas = Math.ceil((((dow + 6) % 7) + diasEnMes) / 7);
  const semanas: CeldaMes[][] = [];
  for (let f = 0; f < filas; f++) {
    const semana: CeldaMes[] = [];
    for (let c = 0; c < 7; c++) {
      const fecha = sumarDias(inicio, f * 7 + c);
      semana.push({ fecha, dia: Number(fecha.slice(8, 10)), enMes: fecha.startsWith(mes) });
    }
    semanas.push(semana);
  }
  return semanas;
}

export type ColorDia = 'verde' | 'amarillo' | 'rojo' | 'gris' | null;

export function colorDelDia(sesion: Session | undefined, fecha: string, hoy: string): ColorDia {
  if (!sesion) return fecha < hoy ? 'gris' : null;
  const fases = sesion.detalle ?? [];
  const total = fases.reduce((n, f) => n + f.total, 0);
  const aciertos = fases.reduce((n, f) => n + f.aciertos, 0);
  if (total === 0) return 'gris';
  if (aciertos === total) return 'verde';
  if (aciertos === 0) return 'rojo';
  return 'amarillo';
}

