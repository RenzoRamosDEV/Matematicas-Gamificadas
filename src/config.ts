export const CONFIG = {
  EJERCICIOS_POR_FASE: 5,
  TIEMPOS: { suma: 120, resta: 150, mult: 300, div: 270 },
  PUNTOS_ACIERTO: 10,
  BONUS_FASE_PERFECTA: 25,
  BONUS_VELOCIDAD_ALTA: 20,
  BONUS_VELOCIDAD_MEDIA: 10,
  BONUS_SESION_PERFECTA: 100,
  AUTH_EMAIL_DOMAIN: 'renzoramosdev.github.io',
  ADMIN_PIN_SHA256: 'b28209f6ae287fb789d774b764f6d05f2cab0b4641a377941f77996aa61ba9ea',
} as const;

export const ORDEN_FASES = ['suma', 'resta', 'mult', 'div'] as const;

export type Acento = 'azul' | 'violeta' | 'verde' | 'amarillo' | 'rosa' | 'gris' | 'rojo';

export const FASE_INFO: Record<(typeof ORDEN_FASES)[number], { nombre: string; simbolo: string; acento: Acento }> = {
  suma:  { nombre: 'Sumas',            simbolo: '+', acento: 'azul' },
  resta: { nombre: 'Restas',           simbolo: '−', acento: 'violeta' },
  mult:  { nombre: 'Multiplicaciones', simbolo: '×', acento: 'verde' },
  div:   { nombre: 'Divisiones',       simbolo: '÷', acento: 'rosa' },
};
