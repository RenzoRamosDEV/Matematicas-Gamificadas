import { useEffect, useState } from 'react';
import type { Op } from '../types';

/**
 * Colores de serie para las gráficas del panel. Validados (claro sobre #f5f6fa, oscuro sobre #0b0d15)
 * con el validador de paletas: separación normal y para daltonismo; la identidad de cada serie va
 * siempre acompañada de etiqueta o tabla, nunca solo por color.
 */
export interface Paleta { serie: Record<Op, string>; base: string; texto: string; suave: string; rejilla: string; eje: string }

const CLARA: Paleta = {
  serie: { suma: '#2a78d6', resta: '#eda100', mult: '#008300', div: '#d55181' },
  base: '#2a78d6', texto: '#535a72', suave: '#8b91a7', rejilla: 'rgba(16,19,35,.08)', eje: 'rgba(16,19,35,.18)',
};
const OSCURA: Paleta = {
  serie: { suma: '#3987e5', resta: '#c98500', mult: '#008300', div: '#d55181' },
  base: '#3987e5', texto: '#a3a9be', suave: '#6d738a', rejilla: 'rgba(255,255,255,.08)', eje: 'rgba(255,255,255,.18)',
};

export const paleta = (oscuro: boolean) => (oscuro ? OSCURA : CLARA);

/** Sigue a prefers-color-scheme en tiempo real. */
export function usePrefiereOscuro(): boolean {
  const [oscuro, setOscuro] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = (e: MediaQueryListEvent) => setOscuro(e.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return oscuro;
}
