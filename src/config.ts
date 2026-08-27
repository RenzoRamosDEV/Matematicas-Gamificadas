export const CONFIG = {
  EJERCICIOS_POR_FASE: 5,        // súbelo a 10 cuando te lo pida
  TIEMPOS: { suma: 120, resta: 150, mult: 300, div: 270 },  // segundos (espejo de cfg_tiempo_fase en SQL)
  PUNTOS_ACIERTO: 10,
  BONUS_FASE_PERFECTA: 25,
  BONUS_VELOCIDAD_ALTA: 20,      // >40% del tiempo restante
  BONUS_VELOCIDAD_MEDIA: 10,     // >20% del tiempo restante
  BONUS_SESION_PERFECTA: 100,
  /**
   * Dominio de los emails ficticios de los jugadores: <usuario>@renzoramosdev.github.io
   * (Supabase Auth rechaza dominios reservados como .local; el de Pages es real y nuestro.)
   */
  AUTH_EMAIL_DOMAIN: 'renzoramosdev.github.io',
} as const;

export const ORDEN_FASES = ['suma', 'resta', 'mult', 'div'] as const;

export type Acento = 'azul' | 'violeta' | 'verde' | 'amarillo' | 'rosa' | 'gris';

export const FASE_INFO: Record<(typeof ORDEN_FASES)[number], { nombre: string; simbolo: string; acento: Acento }> = {
  suma:  { nombre: 'Sumas',            simbolo: '+', acento: 'azul' },
  resta: { nombre: 'Restas',           simbolo: '−', acento: 'violeta' },
  mult:  { nombre: 'Multiplicaciones', simbolo: '×', acento: 'verde' },
  div:   { nombre: 'Divisiones',       simbolo: '÷', acento: 'rosa' },
};
