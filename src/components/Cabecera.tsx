import type { CSSProperties } from 'react';
import { nivel, progresoNivel } from '../lib/nivel';
import type { Profile } from '../types';
import { Avatar } from './Avatar';
import { Icono } from './Icono';

/** Cabecera de vidrio flotante: logo, indicador de nivel y avatar. */
export function Cabecera({ perfil, onSalir }: { perfil: Profile; onSalir?: () => void }) {
  const n = nivel(perfil.puntos_total);
  const { actual, meta } = progresoNivel(perfil.puntos_total);
  return (
    <header className="glass sticky top-3 sm:top-5 z-20 rounded-[26px] flex items-center justify-between gap-4 h-[62px] sm:h-[66px] pl-4 pr-3 sm:pl-5 in d1">
      <div className="flex items-center gap-3 font-bold text-[17px] tracking-tight">
        <div className="tile w-[34px] h-[34px] rounded-[11px]" style={{ background: 'linear-gradient(145deg, var(--color-azul), var(--color-violeta-2))' }}>
          <Icono nombre="spark" size={18} />
        </div>
        <span>Reto</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="flex items-center gap-2.5 rounded-2xl glass-fuerte border border-linea py-1 pl-1.5 pr-3"
          title={`Nivel ${n} · ${actual} / ${meta} XP`}
        >
          <div className="anillo" style={{ '--p': actual / meta } as CSSProperties}><span>{n}</span></div>
          <div className="hidden sm:flex flex-col leading-tight">
            <b className="text-[12.5px] font-semibold">Nivel {n}</b>
            <small className="text-[11px] text-tinta-3 tabular-nums">{actual} / {meta} XP</small>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Avatar nombre={perfil.nombre} url={perfil.avatar_url} size={38} />
          <span className="hidden sm:block font-semibold capitalize text-[14.5px]">{perfil.nombre}</span>
        </div>
        {onSalir && (
          <button
            type="button" onClick={onSalir} title="Salir" aria-label="Salir"
            className="w-10 h-10 rounded-[13px] grid place-items-center glass-fuerte border border-linea text-tinta-2 hover:text-tinta active:scale-95 transition"
          >
            <Icono nombre="salir" size={19} />
          </button>
        )}
      </div>
    </header>
  );
}
