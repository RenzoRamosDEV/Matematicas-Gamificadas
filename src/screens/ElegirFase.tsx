import type { EjercicioDB, Op } from '../types';
import { Icono } from '../components/Icono';
import { SelectorFases } from '../components/SelectorFases';

interface Props {
  ejercicios: EjercicioDB[];
  hechas: Op[];
  actual: Op | null;
  onElegir: (op: Op) => void;
  onVolver: () => void;
  cargando: boolean;
}

/** Pantalla previa a jugar: el jugador elige con qué operación seguir. */
export function ElegirFase({ ejercicios, hechas, actual, onElegir, onVolver, cargando }: Props) {
  const quedan = 4 - hechas.length;
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl flex flex-col gap-5">
        <button type="button" onClick={onVolver} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition in d1">
          <Icono nombre="chevLeft" size={16} />Inicio
        </button>
        <div className="text-center flex flex-col gap-2 in d1">
          <h1 className="text-[32px] sm:text-[44px] font-bold leading-[1.05] tracking-[-.03em] text-balance">
            {hechas.length === 0 ? '¿Con cuál empezamos?' : '¿Cuál va ahora?'}
          </h1>
          <p className="text-tinta-2 text-[16px] sm:text-[17px] text-pretty">
            {hechas.length === 0
              ? 'Elige tú el orden. El tiempo de cada fase empieza cuando la eliges.'
              : `Te ${quedan === 1 ? 'queda' : 'quedan'} ${quedan} ${quedan === 1 ? 'fase' : 'fases'}. El tiempo empieza al elegir.`}
          </p>
        </div>
        <SelectorFases ejercicios={ejercicios} hechas={hechas} actual={actual} onElegir={onElegir} cargando={cargando} />
        {cargando && <p className="text-center text-tinta-3 font-semibold animate-pulse">Preparando las cuentas…</p>}
      </div>
    </main>
  );
}
