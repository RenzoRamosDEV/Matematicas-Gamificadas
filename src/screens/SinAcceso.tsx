import type { ReactNode } from 'react';
import type { Acento } from '../config';
import { Boton } from '../components/Boton';
import { Icono, type NombreIcono } from '../components/Icono';
import { Mascota } from '../components/Mascota';

function Tarjeta({ icono, acento, titulo, children }: { icono: NombreIcono; acento: Acento; titulo: string; children: ReactNode }) {
  return (
    <main className="min-h-full grid place-items-center p-6">
      <div className="glass rounded-[30px] p-8 max-w-sm w-full text-center flex flex-col items-center gap-4 pop">
        <div className={`tile tile-${acento} w-16 h-16 rounded-[20px]`}><Icono nombre={icono} size={30} /></div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}

export function SinAcceso({ mensaje }: { mensaje?: string | null }) {
  return (
    <Tarjeta icono="lock" acento="violeta" titulo="Falta tu link">
      <p className="text-tinta-2 leading-snug text-pretty">
        {mensaje ?? 'Para jugar necesitas tu link secreto. Pídeselo a tu hermano y ábrelo una vez: después ya entras directo.'}
      </p>
    </Tarjeta>
  );
}

export function ErrorPantalla({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <Tarjeta icono="alert" acento="rosa" titulo="Algo se ha torcido">
      <p className="text-tinta-3 text-sm break-words">{mensaje}</p>
      <Boton onClick={onReintentar} icono="arrow" iconoAlFinal>Reintentar</Boton>
    </Tarjeta>
  );
}

export function Cargando({ texto = 'Preparando tu reto…' }: { texto?: string }) {
  return (
    <main className="min-h-full grid place-items-center p-6">
      <div className="flex flex-col items-center gap-2 pop">
        <Mascota size={120} />
        <p className="text-tinta-3 font-semibold animate-pulse">{texto}</p>
      </div>
    </main>
  );
}
