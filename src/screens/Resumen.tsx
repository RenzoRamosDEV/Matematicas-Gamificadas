import { FASE_INFO } from '../config';
import type { Profile, ResultadoFinal } from '../types';
import { Cabecera } from '../components/Cabecera';

export function Resumen({ perfil, resultado, yaJugado }: { perfil: Profile; resultado: ResultadoFinal; yaJugado: boolean }) {
  return (
    <div className="min-h-full flex flex-col">
      <Cabecera perfil={perfil} />
      <main className="flex-1 flex flex-col items-center gap-6 p-6 max-w-md mx-auto w-full">
        <div className="text-center animate-pop">
          <div className="text-6xl">{resultado.sesion_perfecta ? '👑' : yaJugado ? '✅' : '🎉'}</div>
          <h1 className="text-3xl font-black mt-2">{yaJugado ? 'Ya has jugado hoy' : '¡Reto completado!'}</h1>
          <p className="text-slate-400 mt-1">Vuelve mañana para seguir la racha 🔥</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          <Stat label="Hoy" valor={`+${resultado.puntos}`} />
          <Stat label="Total" valor={String(perfil.puntos_total)} icono="⭐" />
          <Stat label="Racha" valor={String(resultado.racha)} icono="🔥" destacado={resultado.racha >= 3} />
        </div>

        {resultado.comodin_usado && (
          <p className="text-amber-300 font-bold text-center text-sm">
            🃏 Ayer no jugaste, pero has usado tu comodín: la racha sigue viva.
          </p>
        )}
        {resultado.sesion_perfecta && (
          <p className="text-emerald-400 font-bold text-center">¡Todo perfecto! +100 puntos extra</p>
        )}

        <ul className="w-full space-y-2">
          {resultado.fases.map((f) => (
            <li key={f.op} className={`rounded-2xl bg-gradient-to-r ${FASE_INFO[f.op].color} p-4 flex items-center justify-between`}>
              <div>
                <div className="font-extrabold">{FASE_INFO[f.op].nombre}</div>
                <div className="text-sm opacity-90 flex gap-2 flex-wrap">
                  {f.bonus_perfecta > 0 && <span className="rounded-full bg-black/25 px-2">perfecta +{f.bonus_perfecta}</span>}
                  {f.bonus_velocidad > 0 && <span className="rounded-full bg-black/25 px-2">⚡ rápido +{f.bonus_velocidad}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">{f.aciertos}/{f.total}</div>
                <div className="text-sm opacity-90">+{f.puntos} pts</div>
              </div>
            </li>
          ))}
        </ul>

        {perfil.racha_max > resultado.racha && (
          <p className="text-slate-500 text-sm">Tu récord de racha: {perfil.racha_max} días</p>
        )}
      </main>
    </div>
  );
}

function Stat({ label, valor, icono, destacado }: { label: string; valor: string; icono?: string; destacado?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${destacado ? 'bg-amber-400 text-slate-950' : 'bg-slate-800'}`}>
      <div className="text-xs font-bold uppercase opacity-70">{label}</div>
      <div className="text-2xl font-black">{icono} {valor}</div>
    </div>
  );
}
