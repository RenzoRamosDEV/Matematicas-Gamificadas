import { useEffect, useState } from 'react';
import type { Op } from '../types';
import { esTema, type Tema } from './tema';

export interface Paleta { serie: Record<Op, string>; base: string; texto: string; suave: string; rejilla: string; eje: string }

const CLARA: Paleta = {
  serie: { suma: '#2a78d6', resta: '#eda100', mult: '#008300', div: '#d55181' },
  base: '#2a78d6', texto: '#535a72', suave: '#8b91a7', rejilla: 'rgba(16,19,35,.08)', eje: 'rgba(16,19,35,.18)',
};
const OSCURA: Paleta = {
  serie: { suma: '#3987e5', resta: '#c98500', mult: '#008300', div: '#d55181' },
  base: '#3987e5', texto: '#a3a9be', suave: '#6d738a', rejilla: 'rgba(255,255,255,.08)', eje: 'rgba(255,255,255,.18)',
};

// Cada tema con paleta propia trae la suya; cristal sigue al modo claro/oscuro del dispositivo.
const POR_TEMA: Partial<Record<Tema, Paleta>> = {
  papel: {
    serie: { suma: '#5b8bd9', resta: '#e5a93d', mult: '#67a97b', div: '#e2708a' },
    base: '#5b8bd9', texto: '#5b6470', suave: '#8a8f98', rejilla: 'rgba(47,54,64,.1)', eje: 'rgba(47,54,64,.3)',
  },
  terminal: {
    serie: { suma: '#39ff6e', resta: '#ffb347', mult: '#2ecc5f', div: '#ff9d1f' },
    base: '#39ff6e', texto: '#2ecc5f', suave: '#1d9c4a', rejilla: 'rgba(57,255,110,.12)', eje: 'rgba(57,255,110,.4)',
  },
  pop: {
    serie: { suma: '#2f8fe6', resta: '#f5b800', mult: '#4dbd68', div: '#ff4fa3' },
    base: '#2f8fe6', texto: '#3f3f46', suave: '#6b7280', rejilla: 'rgba(17,17,17,.1)', eje: 'rgba(17,17,17,.7)',
  },
};

export const paleta = (oscuro: boolean, tema: Tema = 'cristal') =>
  POR_TEMA[tema] ?? (oscuro ? OSCURA : CLARA);

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

// Tema activo leído de <html data-tema>; se entera al momento si se cambia desde el menú.
export function useTemaActivo(): Tema {
  const leer = (): Tema => {
    const t = document.documentElement.dataset.tema;
    return esTema(t) ? t : 'cristal';
  };
  const [tema, setTema] = useState<Tema>(leer);
  useEffect(() => {
    const mo = new MutationObserver(() => setTema(leer()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
    return () => mo.disconnect();
  }, []);
  return tema;
}

export function usePaleta(): Paleta {
  return paleta(usePrefiereOscuro(), useTemaActivo());
}
