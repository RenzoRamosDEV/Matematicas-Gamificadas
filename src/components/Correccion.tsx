import { FASE_INFO } from '../config';
import { agruparPorOperacion, esCorrecta } from '../lib/correccion';
import type { EjercicioDB } from '../types';
import { Icono } from './Icono';

interface Props {
  ejercicios: EjercicioDB[];
  /** Con varias operaciones, agrupa con una cabecera por fase. Con una sola, lista directa. */
  className?: string;
}

/** Lista de cuentas corregidas: enunciado, respuesta del jugador y, si falló, la correcta. */
export function Correccion({ ejercicios, className = '' }: Props) {
  const grupos = agruparPorOperacion(ejercicios);
  if (grupos.length === 0) return <p className={`text-sm text-tinta-3 ${className}`}>No hay cuentas guardadas de este reto.</p>;
  const varias = grupos.length > 1;
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {grupos.map((g) => {
        const info = FASE_INFO[g.op];
        return (
          <section key={g.op} className="flex flex-col gap-1.5">
            {varias && (
              <header className="flex items-center gap-2 px-1">
                <span className={`tile tile-${info.acento} w-6 h-6 rounded-[8px] text-sm font-bold`}>{info.simbolo}</span>
                <span className="text-sm font-semibold">{info.nombre}</span>
                <span className="chip ml-auto tabular-nums">{g.aciertos}/{g.ejercicios.length}</span>
              </header>
            )}
            <ol className="flex flex-col gap-1.5">
              {g.ejercicios.map((e) => {
                const ok = esCorrecta(e);
                return (
                  <li key={e.id} className="glass-fuerte border border-linea rounded-[14px] px-3 py-2 flex items-center gap-3 text-[15px]">
                    <span className={`tile ${ok ? 'tile-verde' : 'tile-rojo'} w-7 h-7 rounded-[9px] shrink-0`} aria-label={ok ? 'Correcta' : 'Incorrecta'}>
                      <Icono nombre={ok ? 'check' : 'x'} size={15} />
                    </span>
                    <span className="font-mono tabular-nums font-semibold whitespace-nowrap">
                      {e.a} {info.simbolo} {e.b} <span className="text-tinta-3">=</span>
                    </span>
                    {ok ? (
                      <span className="font-mono tabular-nums font-bold text-verde-2">{e.sol}</span>
                    ) : (
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono tabular-nums font-bold text-rojo-2 line-through decoration-2">{e.respuesta ?? '—'}</span>
                        <Icono nombre="arrow" size={14} className="text-tinta-3" />
                        <span className="font-mono tabular-nums font-bold text-verde-2">{e.sol}</span>
                        {e.respuesta === null && <span className="text-xs text-tinta-3">sin responder</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
