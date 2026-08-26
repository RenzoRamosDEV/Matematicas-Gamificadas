/** Puntos necesarios para subir de nivel. Solo presentación: el backend no conoce niveles. */
export const PUNTOS_POR_NIVEL = 500;

export const nivel = (puntos: number) => Math.floor(Math.max(0, puntos) / PUNTOS_POR_NIVEL) + 1;

export const progresoNivel = (puntos: number) => ({
  actual: Math.max(0, puntos) % PUNTOS_POR_NIVEL,
  meta: PUNTOS_POR_NIVEL,
});
