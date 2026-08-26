import type { Profile, Session } from '../types';
import { evaluarLogros } from '../lib/logros';
import { Barra } from '../components/Barra';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import { Icono } from '../components/Icono';

interface Props {
  perfil: Profile;
  sesiones: Session[];
  onVolver: () => void;
  onSalir?: () => void;
}

const DELAYS = ['d2', 'd3', 'd3', 'd4', 'd4', 'd5', 'd5', 'd6'];

/** Página de insignias: las 8 medallas en grande, con su progreso real. */
export function Logros({ perfil, sesiones, onVolver, onSalir }: Props) {
  const logros = evaluarLogros({ perfil, sesiones });
  const conseguidos = logros.filter((l) => l.conseguido).length;

  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-12">
      <Cabecera perfil={perfil} onSalir={onSalir} />

      <section className="mt-6 sm:mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1 in d1">
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onVolver} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
            <Icono nombre="chevLeft" size={16} />Inicio
          </button>
          <h1 className="text-[36px] sm:text-5xl font-bold leading-[1.05] tracking-[-.03em]">Mis logros</h1>
          <p className="text-tinta-2 text-[17px]">
            {conseguidos === 0
              ? 'Todavía no tienes ninguna medalla. La primera cae al completar un reto.'
              : conseguidos === logros.length
                ? '¡Las tienes todas! Eres una máquina de calcular.'
                : `Llevas ${conseguidos} de ${logros.length}. Sigue jugando cada día para conseguir el resto.`}
          </p>
        </div>
        <div className="glass rounded-[22px] px-5 py-4 flex items-center gap-4 sm:min-w-[260px]">
          <span className="tile tile-violeta w-12 h-12 rounded-[15px]"><Icono nombre="medal" size={24} /></span>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-sm"><b className="font-semibold">Conseguidas</b><span className="text-tinta-2 tabular-nums">{conseguidos} / {logros.length}</span></div>
            <Barra valor={conseguidos / logros.length} acento="violeta" animada />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {logros.map((l, i) => (
          <article
            key={l.id}
            className={`glass glass-raise rounded-[30px] p-5 sm:p-6 flex flex-col items-center text-center gap-4 in ${DELAYS[i]} ${l.conseguido ? '' : 'saturate-50'}`}
            aria-label={`${l.nombre}: ${l.conseguido ? 'conseguida' : 'pendiente'}`}
          >
            <div className={`tile ${l.conseguido ? `tile-${l.acento}` : 'tile-gris'} w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-[28px]`}>
              <Icono nombre={l.conseguido ? l.icono : 'lock'} size={40} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-[17px] sm:text-[19px] font-bold tracking-tight">{l.nombre}</h2>
              <p className="text-[13.5px] sm:text-[14.5px] text-tinta-2 leading-snug text-pretty">{l.descripcion}</p>
            </div>
            <div className="w-full mt-auto flex flex-col gap-2">
              {l.conseguido ? (
                <span className="chip chip-verde self-center"><Icono nombre="check" size={13} />Conseguida</span>
              ) : (
                <>
                  <Barra valor={l.actual / l.meta} acento={l.acento} animada />
                  <span className="text-xs text-tinta-3 tabular-nums">{l.actual.toLocaleString('es-ES')} de {l.meta.toLocaleString('es-ES')}</span>
                </>
              )}
            </div>
          </article>
        ))}
      </section>

      <div className="mt-8 flex justify-center in d7">
        <Boton variante="glass" icono="chevLeft" onClick={onVolver}>Volver al inicio</Boton>
      </div>
    </div>
  );
}
