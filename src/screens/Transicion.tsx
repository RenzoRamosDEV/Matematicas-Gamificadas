import { FASE_INFO } from '../config';
import type { Op } from '../types';

interface Props {
  op: Op;
  aciertos: number;
  total: number;
  siguiente: Op | null;
  onSiguiente: () => void;
  cargando?: boolean;
}

const mensaje = (aciertos: number, total: number) => {
  if (aciertos === total) return ['¡PERFECTO!', '🏆'];
  if (aciertos >= total * 0.8) return ['¡Casi perfecto!', '🌟'];
  if (aciertos >= total * 0.5) return ['¡Buen trabajo!', '💪'];
  if (aciertos > 0) return ['¡Sigue así!', '🚀'];
  return ['Esta era difícil. ¡A por la siguiente!', '🙌'];
};

export function Transicion({ op, aciertos, total, siguiente, onSiguiente, cargando }: Props) {
  const [texto, emoji] = mensaje(aciertos, total);
  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="animate-pop space-y-3">
        <div className="text-7xl">{emoji}</div>
        <h1 className="text-3xl font-black">{texto}</h1>
        <p className="text-slate-300 text-lg">
          {FASE_INFO[op].nombre}: <span className="font-black text-amber-300 text-2xl">{aciertos}</span> de {total}
        </p>
        {aciertos === total && <p className="text-emerald-400 font-bold">+25 puntos por fase perfecta</p>}
      </div>

      <p className="text-slate-400">Respira. El tiempo no corre hasta que pulses.</p>

      <button className="btn btn-primary text-2xl px-10" onClick={onSiguiente} disabled={cargando}>
        {cargando ? 'Calculando…' : siguiente ? `Siguiente: ${FASE_INFO[siguiente].nombre} →` : 'Ver resultado 🎉'}
      </button>
    </main>
  );
}
