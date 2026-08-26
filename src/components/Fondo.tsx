import type { ReactNode } from 'react';
import { useLuzCursor } from '../hooks/useLuzCursor';

/** Capas ambientales (glows, grano y luz que sigue al cursor) bajo el contenido. */
export function Fondo({ children }: { children: ReactNode }) {
  useLuzCursor();
  return (
    <>
      <div className="ambiente" aria-hidden="true" />
      <div className="luz-cursor" aria-hidden="true" />
      <div className="grano" aria-hidden="true" />
      <div className="relative z-[1] min-h-full">{children}</div>
    </>
  );
}
