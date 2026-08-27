import { colorDelDia, nombreMes, semanasDelMes, type ColorDia, type Mes } from '../lib/calendario';
import type { Session } from '../types';
import { Icono } from './Icono';

interface Props {
  mes: Mes;
  hoy: string;
  seleccion: string;
  sesiones: Map<string, Session>;
  conNota: Set<string>;
  onSeleccionar: (fecha: string) => void;
  onCambiarMes: (delta: number) => void;
}

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const BOLA: Record<Exclude<ColorDia, null>, string> = {
  verde: 'bg-verde-2 shadow-[0_0_8px_-1px_var(--color-verde-2)]',
  amarillo: 'bg-amarillo-2 shadow-[0_0_8px_-1px_var(--color-amarillo-2)]',
  rojo: 'bg-rojo-2 shadow-[0_0_8px_-1px_var(--color-rojo-2)]',
  gris: 'bg-gris',
};
const TEXTO_BOLA: Record<Exclude<ColorDia, null>, string> = { verde: 'Todo bien', amarillo: 'Algún fallo', rojo: 'Todo mal', gris: 'Sin reto' };

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
          const color = colorDelDia(s, c.fecha, hoy);
          const esHoy = c.fecha === hoy;
          const sel = c.fecha === seleccion;
          const futuro = c.fecha > hoy;
          const nota = conNota.has(c.fecha);
          return (
            <button
              key={c.fecha}
              type="button"
              onClick={() => onSeleccionar(c.fecha)}
              aria-label={`${c.fecha}${color ? `, ${TEXTO_BOLA[color]}` : ''}${s ? `, ${s.puntos} puntos` : ''}${nota ? ', con apunte' : ''}`}
              aria-pressed={sel}
              className={`relative aspect-square rounded-[12px] sm:rounded-[14px] flex flex-col items-center justify-center gap-1 text-sm font-semibold transition
                ${sel ? 'bg-tinta text-fondo shadow-[0_10px_24px_-12px_rgba(16,19,35,.4)]' : 'glass-fuerte border border-linea hover:bg-tinta/5'}
                ${!c.enMes ? 'opacity-35' : ''} ${futuro && !sel ? 'text-tinta-3' : ''}
                ${esHoy && !sel ? 'ring-2 ring-azul-2 ring-offset-2 ring-offset-fondo' : ''}`}
            >
              <span className="tabular-nums leading-none">{c.dia}</span>
              {color ? (
                <span className="flex items-center gap-1 leading-none">
                  <i className={`w-2 h-2 rounded-full ${BOLA[color]}`} aria-hidden="true" />
                  {s && <span className={`text-[10px] font-bold tabular-nums ${sel ? 'text-fondo/80' : 'text-tinta-2'}`}>+{s.puntos}</span>}
                </span>
              ) : (
                <span className="h-2" aria-hidden="true" />
              )}
              {nota && <Icono nombre="pencil" size={10} className={`absolute top-1 right-1 ${sel ? 'text-fondo/80' : 'text-tinta-3'}`} />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-tinta-3 font-medium">
        <span className="inline-flex items-center gap-1.5"><i className={`w-2 h-2 rounded-full ${BOLA.verde}`} />Todo bien</span>
        <span className="inline-flex items-center gap-1.5"><i className={`w-2 h-2 rounded-full ${BOLA.amarillo}`} />Algún fallo</span>
        <span className="inline-flex items-center gap-1.5"><i className={`w-2 h-2 rounded-full ${BOLA.rojo}`} />Todo mal</span>
        <span className="inline-flex items-center gap-1.5"><i className={`w-2 h-2 rounded-full ${BOLA.gris}`} />Sin reto</span>
        <span className="inline-flex items-center gap-1.5"><i className="w-3 h-3 rounded-full ring-2 ring-azul-2 ring-offset-1 ring-offset-fondo" />Hoy</span>
        <span className="inline-flex items-center gap-1.5"><Icono nombre="pencil" size={11} />Con apunte</span>
      </div>
    </div>
  );
}
