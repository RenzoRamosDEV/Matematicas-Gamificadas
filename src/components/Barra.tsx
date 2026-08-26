import type { Acento } from '../config';

/** Barra fina de progreso. `valor` va de 0 a 1. */
export function Barra({ valor, acento, className = '', animada }: { valor: number; acento: Acento; className?: string; animada?: boolean }) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <div className={`track ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`fill fill-${acento} ${animada ? 'fill-crece' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
