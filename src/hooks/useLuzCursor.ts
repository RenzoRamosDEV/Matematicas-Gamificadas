import { useEffect } from 'react';

/** La luz ambiental sigue al puntero: escribe --mx/--my en <html>. Los paneles de vidrio la dejan pasar. */
export function useLuzCursor() {
  useEffect(() => {
    const raiz = document.documentElement;
    const mover = (e: PointerEvent) => {
      raiz.style.setProperty('--mx', `${e.clientX}px`);
      raiz.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', mover, { passive: true });
    return () => window.removeEventListener('pointermove', mover);
  }, []);
}
