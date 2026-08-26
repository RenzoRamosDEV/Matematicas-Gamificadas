import { CONFIG, FASE_INFO, ORDEN_FASES } from '../config';
import type { EjercicioDB, Op } from '../types';
import { Icono } from './Icono';

interface Props {
  ejercicios: EjercicioDB[];   // los de la sesión (puede estar vacío si aún no se ha empezado)
  hechas: Op[];
  actual: Op | null;           // fase a medias (si se refrescó jugando)
  onElegir: (op: Op) => void;
  cargando?: boolean;
}

/** Las 4 fases como tarjetas elegibles; las hechas se muestran con su resultado y no se pueden repetir. */
export function SelectorFases({ ejercicios, hechas, actual, onElegir, cargando }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
      {ORDEN_FASES.map((op, i) => {
        const info = FASE_INFO[op];
        const hecha = hechas.includes(op);
        const enCurso = !hecha && actual === op && ejercicios.some((e) => e.op === op && e.respuesta !== null);
        const deFase = ejercicios.filter((e) => e.op === op);
        const aciertos = deFase.filter((e) => e.respuesta !== null && e.respuesta === e.sol).length;
        const minutos = Math.round(CONFIG.TIEMPOS[op] / 60);
        return (
          <button
            key={op}
            type="button"
            disabled={hecha || cargando}
            onClick={() => onElegir(op)}
            className={`glass rounded-[26px] p-4 sm:p-5 text-left flex flex-col gap-3 transition in d${i + 2}
              ${hecha ? 'opacity-70 cursor-default' : 'glass-raise cursor-pointer active:scale-[.98]'}`}
            aria-label={`${info.nombre}${hecha ? `, hecha: ${aciertos} de ${deFase.length}` : enCurso ? ', a medias' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`tile ${hecha ? 'tile-gris' : `tile-${info.acento}`} w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] text-2xl sm:text-[28px] font-bold`}>
                {hecha ? <Icono nombre="check" size={24} /> : info.simbolo}
              </span>
              {hecha ? (
                <span className="chip chip-verde tabular-nums">{aciertos}/{deFase.length}</span>
              ) : enCurso ? (
                <span className="chip chip-azul">A medias</span>
              ) : (
                <span className="chip"><Icono nombre="clock" size={12} />{minutos} min</span>
              )}
            </div>
            <div>
              <div className="font-bold text-[16px] sm:text-[18px] tracking-tight">{info.nombre}</div>
              <div className="text-[12.5px] sm:text-sm text-tinta-2">
                {hecha ? 'Hecha' : `${CONFIG.EJERCICIOS_POR_FASE} cuentas`}
              </div>
            </div>
            {!hecha && (
              <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-tinta-2">
                {enCurso ? 'Continuar' : 'Empezar'}<Icono nombre="arrow" size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
