import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../types';
import { Avatar } from './Avatar';
import { Icono, type NombreIcono } from './Icono';
import { aplicarTema, TEMAS, temaGuardado, type Tema } from '../lib/tema';
import { guardarTema } from '../lib/api';

export type Destino = 'inicio' | 'progreso' | 'logros' | 'admin';

interface Props {
  perfil: Profile;
  onIr?: (destino: Destino) => void;
  onSalir?: () => void;
}

const OPCIONES: { destino: Destino; texto: string; icono: NombreIcono }[] = [
  { destino: 'progreso', texto: 'Mi progreso', icono: 'chart' },
  { destino: 'logros', texto: 'Mis logros', icono: 'medal' },
  { destino: 'admin', texto: 'Modo admin', icono: 'lock' },
];

export function MenuPerfil({ perfil, onIr, onSalir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState<Tema>(temaGuardado);
  const ref = useRef<HTMLDivElement>(null);

  // El menú se queda abierto al cambiar de estilo para poder probarlos en vivo.
  // Se guarda también en la cuenta; si falla la red, al menos queda en el dispositivo.
  const cambiarTema = (t: Tema) => {
    aplicarTema(t);
    setTema(t);
    void guardarTema(perfil.id, t).catch(() => {});
  };

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); document.removeEventListener('keydown', tecla); };
  }, [abierto]);

  const elegir = (f?: () => void) => { setAbierto(false); f?.(); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setAbierto((v) => !v)} aria-haspopup="menu" aria-expanded={abierto} aria-label="Menú de perfil"
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-[14px] hover:bg-tinta/5 active:scale-[.98] transition"
      >
        <Avatar nombre={perfil.nombre} url={perfil.avatar_url} size={38} />
        <span className="hidden sm:block font-semibold capitalize text-[14.5px]">{perfil.nombre}</span>
        <Icono nombre="chev" size={14} className={`text-tinta-3 transition-transform ${abierto ? 'rotate-90' : ''}`} />
      </button>

      {abierto && (
        <div role="menu" className="menu-flotante absolute right-0 top-[calc(100%+8px)] z-30 min-w-[210px] rounded-[18px] p-1.5 flex flex-col pop">
          {OPCIONES.map((o) => (
            <button key={o.destino} type="button" role="menuitem" onClick={() => elegir(() => onIr?.(o.destino))}
              className="flex items-center gap-2.5 px-3 h-11 rounded-[12px] text-[14.5px] font-semibold text-left hover:bg-tinta/5 transition">
              <span className="text-tinta-2"><Icono nombre={o.icono} size={18} /></span>{o.texto}
            </button>
          ))}
          <div className="h-px my-1 mx-2 bg-linea" role="separator" />
          <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-0.5 text-[11px] font-semibold text-tinta-3 uppercase tracking-wide">
            <Icono nombre="pencil" size={12} />Estilo
          </div>
          {TEMAS.map((t) => (
            <button key={t.id} type="button" role="menuitemradio" aria-checked={tema === t.id} onClick={() => cambiarTema(t.id)}
              className="flex items-center gap-2.5 px-3 h-11 rounded-[12px] text-[14.5px] font-semibold text-left hover:bg-tinta/5 transition">
              <Muestra tema={t.id} />
              <span className="flex-1">{t.nombre}</span>
              {tema === t.id && <Icono nombre="check" size={16} className="text-verde-2" />}
            </button>
          ))}
          {onSalir && (
            <>
              <div className="h-px my-1 mx-2 bg-linea" role="separator" />
              <button type="button" role="menuitem" onClick={() => elegir(onSalir)}
                className="flex items-center gap-2.5 px-3 h-11 rounded-[12px] text-[14.5px] font-semibold text-left text-tinta-2 hover:bg-tinta/5 transition">
                <Icono nombre="salir" size={18} />Salir
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const MUESTRAS: Record<Tema, React.CSSProperties> = {
  cristal: { background: 'linear-gradient(150deg, #84a7ff, #8b5cf6)' },
  papel: { background: 'repeating-linear-gradient(0deg, transparent 0 5px, rgba(91,139,217,.5) 5px 6px), #f7f2e7', border: '1px solid #b9b29e' },
  terminal: { background: '#04070a', border: '1px solid #39ff6e' },
  pop: { background: '#ffd23f', border: '2px solid #111' },
};

function Muestra({ tema }: { tema: Tema }) {
  return <span aria-hidden="true" className="w-[18px] h-[18px] rounded-[6px] shrink-0" style={MUESTRAS[tema]} />;
}
