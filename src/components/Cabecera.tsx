import type { Profile } from '../types';
import { Avatar } from './Avatar';

export function Cabecera({ perfil }: { perfil: Profile }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar nombre={perfil.nombre} url={perfil.avatar_url} size={40} />
        <span className="font-extrabold text-lg capitalize">{perfil.nombre}</span>
      </div>
      <div className="flex items-center gap-3 text-sm font-bold">
        <span className="rounded-full bg-slate-800 px-3 py-1" title="Racha">🔥 {perfil.racha_actual}</span>
        <span className="rounded-full bg-slate-800 px-3 py-1" title="Puntos totales">⭐ {perfil.puntos_total}</span>
      </div>
    </header>
  );
}
