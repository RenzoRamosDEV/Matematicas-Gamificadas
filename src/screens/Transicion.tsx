import { FASE_INFO } from '../config';
import type { Op } from '../types';
import { Barra } from '../components/Barra';
import { Boton } from '../components/Boton';
import { Icono, type NombreIcono } from '../components/Icono';

interface Props {
  op: Op;
  aciertos: number;
  total: number;
  siguiente: Op | null;
  onSiguiente: () => void;
  cargando?: boolean;
}

const mensaje = (aciertos: number, total: number): [string, NombreIcono] => {
  if (aciertos === total) return ['¡Perfecto!', 'medal'];
  if (aciertos >= total * 0.8) return ['¡Casi perfecto!', 'star'];
  if (aciertos >= total * 0.5) return ['¡Buen trabajo!', 'target'];
  if (aciertos > 0) return ['¡Sigue así!', 'arrow'];
  return ['Esta era difícil. ¡A por la siguiente!', 'flame'];
};

export function Transicion({ op, aciertos, total, siguiente, onSiguiente, cargando }: Props) {
  const [texto, icono] = mensaje(aciertos, total);
  const { acento, nombre } = FASE_INFO[op];
  return (
    <main className="min-h-full flex flex-col items-center justify-center p-6">
      <div className="glass rounded-[36px] p-8 sm:p-10 max-w-md w-full flex flex-col items-center gap-5 text-center pop">
        <div className={`tile tile-${acento} w-20 h-20 rounded-[24px]`}><Icono nombre={icono} size={36} /></div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">{texto}</h1>
        <p className="text-tinta-2">
          {nombre}: <b className="text-tinta text-xl tabular-nums">{aciertos}</b> de {total}
        </p>
        <Barra valor={total ? aciertos / total : 0} acento={acento} className="w-full" animada />
        {aciertos === total && total > 0 && <span className="chip chip-verde">+25 puntos por fase perfecta</span>}
        <p className="text-tinta-3 text-sm">Respira. El tiempo no corre hasta que pulses.</p>
        <Boton onClick={onSiguiente} disabled={cargando} icono="arrow" iconoAlFinal className="w-full">
          {cargando ? 'Calculando…' : siguiente ? `Siguiente: ${FASE_INFO[siguiente].nombre}` : 'Ver resultado'}
        </Boton>
      </div>
    </main>
  );
}
