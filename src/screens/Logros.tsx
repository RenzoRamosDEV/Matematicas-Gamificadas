import type { Profile, Session } from '../types';
import { CATEGORIAS, evaluarLogros, type LogroEvaluado } from '../lib/logros';
import { Barra } from '../components/Barra';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import type { Destino } from '../components/MenuPerfil';
import { Icono } from '../components/Icono';

interface Props {
  perfil: Profile;
  sesiones: Session[];
  onVolver: () => void;
  onSalir?: () => void;
  onIr: (destino: Destino) => void;
}

export function Logros({ perfil, sesiones, onVolver, onSalir, onIr }: Props) {
  const logros = evaluarLogros({ perfil, sesiones });
  const conseguidos = logros.filter((l) => l.conseguido).length;
  const grupos = CATEGORIAS.map((cat) => ({ cat, items: logros.filter((l) => l.categoria === cat) })).filter((g) => g.items.length);

  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-12">
      <Cabecera perfil={perfil} onIr={onIr} onSalir={onSalir} />

      <section className="mt-6 sm:mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1 in d1">
        <div className="flex flex-col gap-2">
          <button type="button" onClick={onVolver} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
            <Icono nombre="chevLeft" size={16} />Inicio
          </button>
          <h1 className="text-[36px] sm:text-5xl font-bold leading-[1.05] tracking-[-.03em]">Mis logros</h1>
          <p className="text-tinta-2 text-[17px] text-pretty">
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

      {grupos.map((g, gi) => {
        const hechas = g.items.filter((l) => l.conseguido).length;
        return (
          <section key={g.cat} className={`mt-8 in ${gi < 7 ? `d${gi + 2}` : 'd8'}`}>
            <div className="flex items-baseline justify-between px-1 mb-3">
              <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight">{g.cat}</h2>
              <span className="chip tabular-nums">{hechas} de {g.items.length}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {g.items.map((l) => <Insignia key={l.id} logro={l} />)}
            </div>
          </section>
        );
      })}

      <div className="mt-10 flex justify-center">
        <Boton variante="glass" icono="chevLeft" onClick={onVolver}>Volver al inicio</Boton>
      </div>
    </div>
  );
}

function Insignia({ logro: l }: { logro: LogroEvaluado }) {
  return (
    <article
      className={`glass glass-raise rounded-[26px] p-4 sm:p-5 flex flex-col items-center text-center gap-3 ${l.conseguido ? '' : 'saturate-50'}`}
      aria-label={`${l.nombre}: ${l.conseguido ? 'conseguida' : 'pendiente'}`}
    >
      <div className={`tile ${l.conseguido ? `tile-${l.acento}` : 'tile-gris'} w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-[24px]`}>
        <Icono nombre={l.conseguido ? l.icono : 'lock'} size={34} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[15.5px] sm:text-[17px] font-bold tracking-tight text-balance">{l.nombre}</h3>
        <p className="text-[12.5px] sm:text-[13.5px] text-tinta-2 leading-snug text-pretty">{l.descripcion}</p>
      </div>
      <div className="w-full mt-auto flex flex-col gap-1.5">
        {l.conseguido ? (
          <span className="chip chip-verde self-center"><Icono nombre="check" size={13} />Conseguida</span>
        ) : (
          <>
            <Barra valor={l.actual / l.meta} acento={l.acento} animada />
            <span className="text-[11px] text-tinta-3 tabular-nums">{l.actual.toLocaleString('es-ES')} de {l.meta.toLocaleString('es-ES')}</span>
          </>
        )}
      </div>
    </article>
  );
}
