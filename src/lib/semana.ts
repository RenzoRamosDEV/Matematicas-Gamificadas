import type { Session } from '../types';

const fmtMadrid = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });

export const hoyMadrid = (ahora: Date = new Date()) => fmtMadrid.format(ahora);

const aUTC = (f: string) => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const deUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const sumarDias = (fecha: string, n: number) => deUTC(aUTC(fecha) + n * 86_400_000);

export const lunesDe = (fecha: string) => {
  const dow = new Date(aUTC(fecha)).getUTCDay();
  return sumarDias(fecha, -((dow + 6) % 7));
};

export interface DiaSemana {
  fecha: string;
  etiqueta: 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';
  puntos: number;
  esHoy: boolean;
  futuro: boolean;
}

const ETIQUETAS: DiaSemana['etiqueta'][] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function semanaActual(sesiones: Pick<Session, 'fecha' | 'puntos' | 'estado'>[], hoy: string): DiaSemana[] {
  const lunes = lunesDe(hoy);
  const porFecha = new Map(sesiones.filter((s) => s.estado === 'completada').map((s) => [s.fecha, s.puntos]));
  return ETIQUETAS.map((etiqueta, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, etiqueta, puntos: porFecha.get(fecha) ?? 0, esHoy: fecha === hoy, futuro: fecha > hoy };
  });
}

export const puntosSemana = (dias: DiaSemana[]) => dias.reduce((n, d) => n + d.puntos, 0);
