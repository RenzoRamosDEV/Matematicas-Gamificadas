import { CONFIG, FASE_INFO, ORDEN_FASES } from '../config';
import type { Profile } from '../types';
import { Cabecera } from '../components/Cabecera';

const minutosTotales = Math.round(Object.values(CONFIG.TIEMPOS).reduce((a, b) => a + b, 0) / 60);

export function Inicio({ perfil, onEmpezar, cargando, enCurso }: { perfil: Profile; onEmpezar: () => void; cargando: boolean; enCurso?: boolean }) {
  const saludo = perfil.racha_actual > 0 ? `¡Llevas ${perfil.racha_actual} día${perfil.racha_actual === 1 ? '' : 's'} seguidos!` : '¡Hoy empieza tu racha!';
  return (
    <div className="min-h-full flex flex-col">
      <Cabecera perfil={perfil} />
      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 text-center">
        <div className="animate-pop space-y-2">
          <div className="text-7xl">🧮</div>
          <h1 className="text-4xl font-black">Reto de hoy</h1>
          <p className="text-amber-300 font-bold text-lg">{saludo}</p>
        </div>

        <ul className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {ORDEN_FASES.map((op) => (
            <li key={op} className={`rounded-2xl bg-gradient-to-br ${FASE_INFO[op].color} p-4 text-left shadow-lg`}>
              <div className="text-3xl font-black">{FASE_INFO[op].simbolo}</div>
              <div className="font-extrabold">{FASE_INFO[op].nombre}</div>
              <div className="text-sm opacity-80">{CONFIG.EJERCICIOS_POR_FASE} cuentas · {Math.round(CONFIG.TIEMPOS[op] / 60)} min</div>
            </li>
          ))}
        </ul>

        <p className="text-slate-400">{enCurso ? 'Tienes un reto a medias: sigues donde lo dejaste.' : `Unos ${minutosTotales} minutos como mucho. Papel y lápiz a mano 📝`}</p>

        <button className="btn btn-primary text-2xl px-10" onClick={onEmpezar} disabled={cargando}>
          {cargando ? 'Preparando…' : enCurso ? '¡Continuar!' : '¡Empezar!'}
        </button>
      </main>
    </div>
  );
}
