import { useState, type FormEvent } from 'react';
import { Boton } from '../components/Boton';
import { Icono } from '../components/Icono';
import { Mascota } from '../components/Mascota';

interface Props {
  /** Mensaje inicial (p. ej. un link de acceso que no funcionó). */
  mensaje?: string | null;
  /** Devuelve un mensaje de error o null si entró. */
  onEntrar: (usuario: string, password: string) => Promise<string | null>;
}

export function Login({ mensaje, onEntrar }: Props) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(mensaje ?? null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const err = await onEntrar(usuario, password);
    if (err) { setError(err); setOcupado(false); }
    // si entró, App cambia de pantalla; no hace falta reactivar el botón
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6">
      <form className="glass rounded-[32px] p-7 sm:p-8 max-w-sm w-full flex flex-col gap-5 pop" onSubmit={enviar} noValidate>
        <div className="flex flex-col items-center gap-1 text-center">
          <Mascota size={110} />
          <h1 className="text-2xl font-bold tracking-tight">¡Hola! ¿Quién eres?</h1>
          <p className="text-tinta-2 text-sm text-pretty">Escribe tu usuario y tu contraseña para entrar.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta-2">
          Usuario
          <input
            className="campo" value={usuario} onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta-2">
          Contraseña
          <input
            className="campo" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p role="alert" className="chip chip-rosa self-center text-center"><Icono nombre="alert" size={14} />{error}</p>
        )}

        <Boton type="submit" icono="arrow" iconoAlFinal disabled={ocupado || !usuario.trim() || !password}>
          {ocupado ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>

      {/* Texto descriptivo visible para personas y rastreadores: qué es la app */}
      <footer className="mt-6 max-w-md text-center text-[12.5px] leading-snug text-tinta-3 text-pretty in d3">
        <p>
          <strong className="text-tinta-2 font-semibold">Reto Diario</strong> es un juego gratuito de cálculo mental: cada día, sumas, restas,
          multiplicaciones y divisiones en cuatro fases, con puntos, racha e insignias. El acceso lo da quien administra el juego.
          {' '}<a className="underline hover:text-tinta" href="https://github.com/RenzoRamosDEV/Matematicas-Gamificadas" rel="noopener" target="_blank">Código abierto</a>.
        </p>
      </footer>
    </main>
  );
}
