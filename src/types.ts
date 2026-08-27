export type Op = 'suma' | 'resta' | 'mult' | 'div';

export interface Ejercicio {
  op: Op;
  a: number;
  b: number;
  sol: number;
}

/** Fila de la tabla exercises */
export interface EjercicioDB extends Ejercicio {
  id: string;
  session_id: string;
  orden: number;
  respuesta: number | null;
  correcta: boolean | null;
  ms: number | null;
}

export interface Profile {
  id: string;
  nombre: string;
  avatar_url: string | null;
  puntos_total: number;
  racha_actual: number;
  racha_max: number;
  ultima_sesion_fecha: string | null;
  comodines_disponibles: number;
  ultimo_comodin_fecha: string | null;
}

export interface FaseDetalle {
  op: Op;
  aciertos: number;
  total: number;
  bonus_perfecta: number;
  bonus_velocidad: number;
  puntos: number;
}

export interface Session {
  id: string;
  fecha: string;
  estado: 'en_curso' | 'completada';
  puntos: number;
  detalle: FaseDetalle[] | null;
}

/** Lo que devuelve la RPC finalizar_sesion */
export interface ResultadoFinal {
  puntos: number;
  aciertos: number;
  total: number;
  sesion_perfecta: boolean;
  racha: number;
  comodin_usado: boolean;
  fases: FaseDetalle[];
}

/** Apunte del jugador en el calendario (tabla notas): puede haber varios por día */
export interface Nota {
  id: string;
  fecha: string;
  texto: string;
  created_at: string;
}
