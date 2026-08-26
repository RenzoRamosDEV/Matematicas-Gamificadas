import type { Ejercicio, EjercicioDB, Op, Profile, ResultadoFinal, Session } from '../types';
import { supabase } from './supabase';

const fail = (ctx: string, e: { message: string } | null) => {
  if (e) throw new Error(`${ctx}: ${e.message}`);
};

export async function cargarPerfil(): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').single();
  fail('perfil', error);
  return data as Profile;
}

/** Devuelve la sesión de hoy (o la crea) y sus ejercicios, ordenados. */
export async function iniciarSesion(): Promise<{ session: Session; ejercicios: EjercicioDB[] }> {
  const { data: id, error } = await supabase.rpc('iniciar_sesion');
  fail('iniciar_sesion', error);

  const [s, e] = await Promise.all([
    supabase.from('sessions').select('id, fecha, estado, puntos, detalle').eq('id', id).single(),
    supabase.from('exercises').select('*').eq('session_id', id).order('orden'),
  ]);
  fail('sesión', s.error);
  fail('ejercicios', e.error);
  return { session: s.data as Session, ejercicios: (e.data ?? []) as EjercicioDB[] };
}

export async function insertarEjercicios(
  sessionId: string,
  ejercicios: (Ejercicio & { orden: number })[],
): Promise<EjercicioDB[]> {
  const filas = ejercicios.map((e) => ({ ...e, session_id: sessionId }));
  const { data, error } = await supabase.from('exercises').insert(filas).select().order('orden');
  fail('insertar ejercicios', error);
  return data as EjercicioDB[];
}

export async function guardarRespuesta(id: string, respuesta: number | null, ms: number) {
  const { error } = await supabase.from('exercises').update({ respuesta, ms }).eq('id', id);
  fail('guardar respuesta', error);
}

export async function finalizarSesion(
  sessionId: string,
  tiemposRestantes: Partial<Record<Op, number>>,
): Promise<ResultadoFinal> {
  const { data, error } = await supabase.rpc('finalizar_sesion', {
    p_session_id: sessionId,
    p_tiempos_restantes: tiemposRestantes,
  });
  fail('finalizar_sesion', error);
  return data as ResultadoFinal;
}

/**
 * Historial completo de sesiones completadas del jugador (RLS solo devuelve las suyas).
 * Se trae entero porque los logros acumulan aciertos y retos de toda la historia;
 * a una sesión por día son unas 365 filas pequeñas al año.
 */
export async function cargarSesiones(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions').select('id, fecha, estado, puntos, detalle')
    .eq('estado', 'completada').order('fecha', { ascending: false }).limit(5000);
  fail('historial', error);
  return (data ?? []) as Session[];
}
