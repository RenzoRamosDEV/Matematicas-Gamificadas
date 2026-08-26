import type { Ejercicio, EjercicioDB, Nota, Op, Profile, ResultadoFinal, Session } from '../types';
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

// ---------- Apuntes del calendario ----------------------------------------
export async function cargarNotas(): Promise<Nota[]> {
  const { data, error } = await supabase.from('notas').select('id, fecha, texto, created_at').order('created_at');
  fail('notas', error);
  return (data ?? []) as Nota[];
}

/** Añade un apunte a un día. user_id lo pone la DB (auth.uid()). */
export async function crearNota(fecha: string, texto: string): Promise<Nota> {
  const { data, error } = await supabase.from('notas').insert({ fecha, texto }).select('id, fecha, texto, created_at').single();
  fail('guardar apunte', error);
  return data as Nota;
}

export async function borrarNota(id: string): Promise<void> {
  const { error } = await supabase.from('notas').delete().eq('id', id);
  fail('borrar apunte', error);
}

/**
 * Reintenta una lectura que puede fallar por un desfase de reloj justo tras iniciar sesión
 * ("JWT issued at future") o por un corte breve de red.
 */
export async function reintentar<T>(fn: () => Promise<T>, veces = 2, esperaMs = 1500): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i <= veces; i++) {
    try { return await fn(); }
    catch (e) { ultimo = e; if (i < veces) await new Promise((r) => setTimeout(r, esperaMs)); }
  }
  throw ultimo;
}
