export const CONFIG = {
  EJERCICIOS_POR_FASE: 5,        // súbelo a 10 cuando te lo pida
  TIEMPOS: { suma: 120, resta: 150, mult: 300, div: 270 },  // segundos (espejo de cfg_tiempo_fase en SQL)
  PUNTOS_ACIERTO: 10,
  BONUS_FASE_PERFECTA: 25,
  BONUS_VELOCIDAD_ALTA: 20,      // >40% del tiempo restante
  BONUS_VELOCIDAD_MEDIA: 10,     // >20% del tiempo restante
  BONUS_SESION_PERFECTA: 100,
  /** Dominio de los emails ficticios de los jugadores: <usuario>@juego.local */
  AUTH_EMAIL_DOMAIN: 'juego.local',
  /** Usuario por defecto si el link no lleva ?u= */
  USUARIO_POR_DEFECTO: 'hermano',
} as const;

export const ORDEN_FASES = ['suma', 'resta', 'mult', 'div'] as const;

export const FASE_INFO = {
  suma:  { nombre: 'Sumas',            simbolo: '+', emoji: '➕', color: 'from-emerald-500 to-teal-600' },
  resta: { nombre: 'Restas',           simbolo: '−', emoji: '➖', color: 'from-sky-500 to-blue-600' },
  mult:  { nombre: 'Multiplicaciones', simbolo: '×', emoji: '✖️', color: 'from-violet-500 to-purple-600' },
  div:   { nombre: 'Divisiones',       simbolo: '÷', emoji: '➗', color: 'from-rose-500 to-pink-600' },
} as const;
