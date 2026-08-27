import { sumarDias } from './semana';

export const DIAS_RECARGA_COMODIN = 30;

export function comodinesDisponibles(perfil: { comodines_disponibles: number; ultimo_comodin_fecha: string | null }, hoy: string): number {
  if (perfil.comodines_disponibles >= 1) return perfil.comodines_disponibles;
  if (!perfil.ultimo_comodin_fecha || perfil.ultimo_comodin_fecha <= sumarDias(hoy, -DIAS_RECARGA_COMODIN)) return 1;
  return 0;
}

export type EstadoRacha = 'sin_empezar' | 'viva' | 'en_juego' | 'perdida';

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
