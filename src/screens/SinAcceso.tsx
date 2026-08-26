export function SinAcceso({ mensaje }: { mensaje?: string | null }) {
  return (
    <main className="min-h-full grid place-items-center p-6 text-center">
      <div className="max-w-sm space-y-5 animate-pop">
        <div className="text-7xl">🔐</div>
        <h1 className="text-3xl font-black">Falta tu link</h1>
        <p className="text-slate-300 text-lg">
          {mensaje ?? 'Para jugar necesitas tu link secreto. Pídeselo a tu hermano y ábrelo una vez: después ya entras directo.'}
        </p>
      </div>
    </main>
  );
}

export function ErrorPantalla({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <main className="min-h-full grid place-items-center p-6 text-center">
      <div className="max-w-sm space-y-5">
        <div className="text-7xl">😵‍💫</div>
        <h1 className="text-2xl font-black">Algo se ha torcido</h1>
        <p className="text-slate-400 text-sm break-words">{mensaje}</p>
        <button className="btn btn-primary" onClick={onReintentar}>Reintentar</button>
      </div>
    </main>
  );
}
