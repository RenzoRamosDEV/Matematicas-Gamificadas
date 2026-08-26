import type { SVGProps } from 'react';

/** Set de iconos lineales (estilo Lucide/SF Symbols): stroke 1.75, rejilla de 24. */
const PATHS = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15v-4"/><path d="M12 15V8"/><path d="M16 15v-6"/>',
  medal: '<circle cx="12" cy="14" r="5"/><path d="m9 9.5-3-5.5h4l2 3.5L14 4h4l-3 5.5"/>',
  flame: '<path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.2-2.2-5.1-3.4-7.2-.5 1.4-1.2 2.3-2.3 2.8C12.2 8.8 12 6.3 10.3 4 8.4 6 6 9.6 6 13.5 6 17 8.4 21 12 21z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6z"/><path d="m9.5 12 1.8 1.8L15 10.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.2-3.3 3.7-5 7-5s5.8 1.7 7 5"/>',
  play: '<path d="M8 6.5v11l9-5.5z" fill="currentColor" stroke="none"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  chevLeft: '<path d="m15 6-6 6 6 6"/>',
  spark: '<path d="M12 4v4"/><path d="M12 16v4"/><path d="M4 12h4"/><path d="M16 12h4"/><path d="m6.8 6.8 2.4 2.4"/><path d="m14.8 14.8 2.4 2.4"/><path d="m6.8 17.2 2.4-2.4"/><path d="m14.8 9.2 2.4-2.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  backspace: '<path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 10 5 5"/><path d="m17 10-5 5"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v5"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  x: '<path d="m6 6 12 12"/><path d="m18 6-12 12"/>',
} as const;

export type NombreIcono = keyof typeof PATHS;

type Props = { nombre: NombreIcono; size?: number } & Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML'>;

export function Icono({ nombre, size = 24, ...rest }: Props) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      // Los paths son constantes propias, no contenido de usuario.
      dangerouslySetInnerHTML={{ __html: PATHS[nombre] }}
      {...rest}
    />
  );
}
