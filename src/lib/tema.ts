export type Tema = 'cristal' | 'papel' | 'terminal' | 'pop';

export const TEMAS: { id: Tema; nombre: string }[] = [
  { id: 'cristal', nombre: 'Cristal' },
  { id: 'papel', nombre: 'Papel de cole' },
  { id: 'terminal', nombre: 'Terminal retro' },
  { id: 'pop', nombre: 'Póster pop' },
];

const CLAVE = 'tema';

export const esTema = (v: unknown): v is Tema => TEMAS.some((t) => t.id === v);

export function temaGuardado(): Tema {
  try {
    const v = localStorage.getItem(CLAVE);
    return esTema(v) ? v : 'cristal';
  } catch {
    return 'cristal';
  }
}

// El tema vive en <html data-tema="...">; cristal es el diseño base y no lleva atributo.
export function aplicarTema(t: Tema) {
  if (t === 'cristal') delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = t;
  try {
    localStorage.setItem(CLAVE, t);
  } catch {
    // modo privado: el tema dura lo que dure la pestaña
  }
}
