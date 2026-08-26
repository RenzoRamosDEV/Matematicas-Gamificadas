import { Boton } from '../components/Boton';
import { Icono } from '../components/Icono';
import { Mascota } from '../components/Mascota';

export function ErrorPantalla({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <main className="min-h-full grid place-items-center p-6">
      <div className="glass rounded-[30px] p-8 max-w-sm w-full text-center flex flex-col items-center gap-4 pop">
        <div className="tile tile-rosa w-16 h-16 rounded-[20px]"><Icono nombre="alert" size={30} /></div>
        <h1 className="text-2xl font-bold tracking-tight">Algo se ha torcido</h1>
        <p className="text-tinta-3 text-sm break-words">{mensaje}</p>
        <Boton onClick={onReintentar} icono="arrow" iconoAlFinal>Reintentar</Boton>
      </div>
    </main>
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
