import { nombreMes, semanasDelMes, type Mes } from '../lib/calendario';
import type { Session } from '../types';
import { Icono } from './Icono';

interface Props {
  mes: Mes;
  hoy: string;
  seleccion: string;
  sesiones: Map<string, Session>;   // por fecha, solo completadas
  conNota: Set<string>;             // fechas con apunte
  onSeleccionar: (fecha: string) => void;
  onCambiarMes: (delta: number) => void;
}

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Calendario mensual: retos completados con sus puntos, apuntes y el día seleccionado. */
export function Calendario({ mes, hoy, seleccion, sesiones, conNota, onSeleccionar, onCambiarMes }: Props) {
  const semanas = semanasDelMes(mes);
  const esMesActual = mes === hoy.slice(0, 7);
  return (
    <div className="glass rounded-[30px] p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior"
          className="w-10 h-10 rounded-[13px] grid place-items-center glass-fuerte border border-linea text-tinta-2 hover:text-tinta active:scale-95 transition">
          <Icono nombre="chevLeft" size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight">{nombreMes(mes)}</h2>
          {!esMesActual && (
            <button type="button" onClick={() => onSeleccionar(hoy)} className="chip chip-azul hover:text-tinta transition">Hoy</button>
          )}
        </div>
        <button type="button" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente"
          className="w-10 h-10 rounded-[13px] grid place-items-center glass-fuerte border border-linea text-tinta-2 hover:text-tinta active:scale-95 transition">
          <Icono nombre="chev" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
        {DIAS.map((d, i) => (
          <div key={d} className={`text-[11px] font-semibold pb-1 ${i >= 5 ? 'text-tinta-3' : 'text-tinta-2'}`}>{d}</div>
        ))}
        {semanas.flat().map((c) => {
          const s = sesiones.get(c.fecha);
          const esHoy = c.fecha === hoy;
          const sel = c.fecha === seleccion;
          const futuro = c.fecha > hoy;
          const nota = conNota.has(c.fecha);
          return (
            <button
              key={c.fecha}
              type="button"
              onClick={() => onSeleccionar(c.fecha)}
              aria-label={`${c.fecha}${s ? `, reto completado, ${s.puntos} puntos` : ''}${nota ? ', con apunte' : ''}`}
              aria-pressed={sel}
              className={`relative aspect-square rounded-[12px] sm:rounded-[14px] flex flex-col items-center justify-center gap-0.5 text-sm font-semibold transition
                ${sel ? 'bg-tinta text-white shadow-[0_10px_24px_-12px_rgba(16,19,35,.6)]'
                  : s ? 'tile tile-verde text-white'
                  : 'glass-fuerte border border-linea hover:bg-white'}
                ${!c.enMes ? 'opacity-35' : ''} ${futuro && !sel ? 'text-tinta-3' : ''}
                ${esHoy && !sel ? 'ring-2 ring-azul-2 ring-offset-2 ring-offset-fondo' : ''}`}
            >
              <span className="tabular-nums leading-none">{c.dia}</span>
              {s && <span className={`text-[10px] font-bold leading-none tabular-nums ${sel ? 'text-white/80' : 'text-white/90'}`}>+{s.puntos}</span>}
              {nota && <i className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${sel ? 'bg-amarillo' : 'bg-amarillo-2'}`} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-[12px] text-tinta-3 font-medium">
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-[4px] tile tile-verde" />Reto completado</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-full ring-2 ring-azul-2 ring-offset-1 ring-offset-fondo" />Hoy</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-1.5 h-1.5 rounded-full bg-amarillo-2" />Con apunte</span>
      </div>
    </div>
  );
}
