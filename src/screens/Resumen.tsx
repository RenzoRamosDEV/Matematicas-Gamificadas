import { FASE_INFO, type Acento } from '../config';
import type { Profile, ResultadoFinal } from '../types';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import { Icono, type NombreIcono } from '../components/Icono';

interface Props {
  perfil: Profile;
  resultado: ResultadoFinal;
  yaJugado: boolean;
  onVolver: () => void;
  onSalir?: () => void;
}

export function Resumen({ perfil, resultado, yaJugado, onVolver, onSalir }: Props) {
  const perfecta = resultado.sesion_perfecta;
  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-12">
      <Cabecera perfil={perfil} onSalir={onSalir} />
      <main className="max-w-md mx-auto w-full flex flex-col gap-5 mt-8">
        <div className="text-center flex flex-col items-center gap-3 pop">
          <div className={`tile ${perfecta ? 'tile-amarillo' : 'tile-verde'} w-20 h-20 rounded-[24px]`}>
            <Icono nombre={perfecta ? 'medal' : 'check'} size={36} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{yaJugado ? 'Ya has jugado hoy' : '¡Reto completado!'}</h1>
          <p className="text-tinta-2">Vuelve mañana para seguir la racha.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 in d2">
          <Stat label="Hoy" valor={`+${resultado.puntos}`} icono="target" acento="azul" />
          <Stat label="Total" valor={perfil.puntos_total.toLocaleString('es-ES')} icono="star" acento="amarillo" />
          <Stat label="Racha" valor={`${resultado.racha}`} icono="flame" acento="rosa" />
        </div>

        {(resultado.comodin_usado || perfecta) && (
          <div className="flex flex-col items-center gap-2 in d2">
            {resultado.comodin_usado && <span className="chip chip-azul text-center">Ayer no jugaste, pero has usado tu comodín: la racha sigue viva</span>}
            {perfecta && <span className="chip chip-verde">¡Todo perfecto! +100 puntos extra</span>}
          </div>
        )}

        <ul className="flex flex-col gap-2.5 in d3">
          {resultado.fases.map((f) => {
            const info = FASE_INFO[f.op];
            return (
              <li key={f.op} className="glass rounded-[22px] p-3.5 flex items-center gap-3">
                <div className={`tile tile-${info.acento} w-11 h-11 rounded-[14px] text-xl font-bold shrink-0`}>{info.simbolo}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{info.nombre}</div>
                  {(f.bonus_perfecta > 0 || f.bonus_velocidad > 0) && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {f.bonus_perfecta > 0 && <span className="chip chip-verde">Perfecta +{f.bonus_perfecta}</span>}
                      {f.bonus_velocidad > 0 && <span className="chip chip-azul"><Icono nombre="clock" size={12} />Rápido +{f.bonus_velocidad}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tabular-nums">{f.aciertos}/{f.total}</div>
                  <div className="text-xs text-tinta-3">+{f.puntos} pts</div>
                </div>
              </li>
            );
          })}
        </ul>

        {perfil.racha_max > resultado.racha && (
          <p className="text-tinta-3 text-sm text-center">Tu récord de racha: {perfil.racha_max} días</p>
        )}

        <Boton variante="glass" icono="chevLeft" onClick={onVolver} className="self-center in d4">Volver al inicio</Boton>
      </main>
    </div>
  );
}

function Stat({ label, valor, icono, acento }: { label: string; valor: string; icono: NombreIcono; acento: Acento }) {
  return (
    <div className="glass rounded-[18px] p-3 flex flex-col items-center gap-1.5 text-center">
      <span className={`tile tile-${acento} w-8 h-8 rounded-[10px]`}><Icono nombre={icono} size={16} /></span>
      <b className="text-[17px] font-bold tabular-nums leading-none">{valor}</b>
      <small className="text-[11px] text-tinta-3">{label}</small>
    </div>
  );
}
