import { useEffect } from 'react';

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
