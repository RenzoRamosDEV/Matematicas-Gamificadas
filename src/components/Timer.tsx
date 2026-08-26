import { Barra } from './Barra';

export function Timer({ restante, total }: { restante: number; total: number }) {
  const m = Math.floor(restante / 60);
  const s = String(restante % 60).padStart(2, '0');
  const urgente = restante <= 20;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[12.5px] font-semibold text-tinta-3 mb-1.5">
        <span>Tiempo</span>
        <span className={`font-mono tabular-nums ${urgente ? 'text-rosa-2 animate-pulse' : 'text-tinta-2'}`}>{m}:{s}</span>
      </div>
      <Barra valor={restante / total} acento={urgente ? 'rosa' : 'azul'} />
    </div>
  );
}
