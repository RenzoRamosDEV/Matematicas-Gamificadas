import type { CSSProperties } from 'react';
import { nivel, progresoNivel } from '../lib/nivel';
import type { Profile } from '../types';
import { Icono } from './Icono';
import { MenuPerfil, type Destino } from './MenuPerfil';

interface Props {
  perfil: Profile;
  onIr?: (destino: Destino) => void;
  onSalir?: () => void;
}

/** Cabecera de vidrio flotante: logo, indicador de nivel y menú de perfil. */
export function Cabecera({ perfil, onIr, onSalir }: Props) {
  const n = nivel(perfil.puntos_total);
  const { actual, meta } = progresoNivel(perfil.puntos_total);
  return (
    <header className="glass sticky top-3 sm:top-5 z-20 rounded-[26px] flex items-center justify-between gap-4 h-[62px] sm:h-[66px] pl-4 pr-2 sm:pl-5 sm:pr-3 in d1">
      <button type="button" onClick={() => onIr?.('inicio')} className="flex items-center gap-3 font-bold text-[17px] tracking-tight" aria-label="Ir al inicio">
        <div className="tile w-[34px] h-[34px] rounded-[11px]" style={{ background: 'linear-gradient(145deg, var(--color-azul), var(--color-violeta-2))' }}>
          <Icono nombre="spark" size={18} />
        </div>
        <span>Reto Diario</span>
      </button>

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
        <MenuPerfil perfil={perfil} onIr={onIr} onSalir={onSalir} />
      </div>
    </header>
  );
}
