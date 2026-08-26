import { FASE_INFO } from '../config';
import type { EjercicioDB, Op } from '../types';
import { Barra } from '../components/Barra';
import { Boton } from '../components/Boton';
import { Icono, type NombreIcono } from '../components/Icono';
import { SelectorFases } from '../components/SelectorFases';

interface Props {
  op: Op;                       // fase recién terminada
  aciertos: number;
  total: number;
  ejercicios: EjercicioDB[];
  hechas: Op[];
  onElegir: (op: Op) => void;   // siguiente fase, la que quiera el jugador
  onVerResultado: () => void;   // cuando no queda ninguna
  onInicio: () => void;
  cargando?: boolean;
}

const mensaje = (aciertos: number, total: number): [string, NombreIcono] => {
  if (aciertos === total) return ['¡Perfecto!', 'medal'];
  if (aciertos >= total * 0.8) return ['¡Casi perfecto!', 'star'];
  if (aciertos >= total * 0.5) return ['¡Buen trabajo!', 'target'];
  if (aciertos > 0) return ['¡Sigue así!', 'arrow'];
  return ['Esta era difícil. ¡A por la siguiente!', 'flame'];
};

export function Transicion({ op, aciertos, total, ejercicios, hechas, onElegir, onVerResultado, onInicio, cargando }: Props) {
  const [texto, icono] = mensaje(aciertos, total);
  const { acento, nombre } = FASE_INFO[op];
  const quedan = 4 - hechas.length;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl flex flex-col gap-5">
        <button type="button" onClick={onInicio} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition in d1">
          <Icono nombre="chevLeft" size={16} />Inicio
        </button>
        <div className="glass rounded-[32px] p-6 sm:p-8 flex flex-col items-center gap-4 text-center pop">
          <div className={`tile tile-${acento} w-20 h-20 rounded-[24px]`}><Icono nombre={icono} size={36} /></div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">{texto}</h1>
          <p className="text-tinta-2">
            {nombre}: <b className="text-tinta text-xl tabular-nums">{aciertos}</b> de {total}
          </p>
          <Barra valor={total ? aciertos / total : 0} acento={acento} className="w-full" animada />
          {aciertos === total && total > 0 && <span className="chip chip-verde">+25 puntos por fase perfecta</span>}
        </div>

        {quedan > 0 ? (
          <>
            <div className="text-center flex flex-col gap-1 in d2">
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-tight">¿Cuál va ahora?</h2>
              <p className="text-tinta-3 text-sm">Respira. El tiempo no corre hasta que elijas.</p>
            </div>
            <SelectorFases ejercicios={ejercicios} hechas={hechas} actual={null} onElegir={onElegir} cargando={cargando} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 in d2">
            <p className="text-tinta-2">¡Has terminado las cuatro fases!</p>
            <Boton onClick={onVerResultado} disabled={cargando} icono="medal" className="w-full sm:w-auto">
              {cargando ? 'Calculando…' : 'Ver resultado'}
            </Boton>
          </div>
        )}
      </div>
    </main>
  );
}
