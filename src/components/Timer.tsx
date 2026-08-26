export function Timer({ restante, total }: { restante: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (restante / total) * 100));
  const m = Math.floor(restante / 60);
  const s = String(restante % 60).padStart(2, '0');
  const urgente = restante <= 20;
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-bold text-slate-400 mb-1">
        <span>Tiempo</span>
        <span className={`font-mono tabular-nums ${urgente ? 'text-rose-400 animate-pulse' : ''}`}>{m}:{s}</span>
      </div>
      <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${urgente ? 'bg-rose-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
