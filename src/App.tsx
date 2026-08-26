import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, ORDEN_FASES } from './config';
import type { EjercicioDB, Profile, ResultadoFinal, Session } from './types';
import { entrarConToken, haySesion } from './lib/auth';
import { cargarPerfil, finalizarSesion, guardarRespuesta, iniciarSesion, insertarEjercicios } from './lib/api';
import { genSesion } from './lib/generador';
import { borrarProgreso, guardarProgreso, leerProgreso, type Progreso } from './lib/progreso';
import { supabaseConfigurado } from './lib/supabase';
import { Inicio } from './screens/Inicio';
import { Fase } from './screens/Fase';
import { Transicion } from './screens/Transicion';
import { Resumen } from './screens/Resumen';
import { ErrorPantalla, SinAcceso } from './screens/SinAcceso';

type Estado = 'cargando' | 'sin_acceso' | 'error' | 'listo';

/** Reconstruye el resultado de una sesión ya completada (para el "resumen del día"). */
function resultadoDesdeSesion(s: Session, perfil: Profile): ResultadoFinal {
  const fases = s.detalle ?? [];
  const aciertos = fases.reduce((n, f) => n + f.aciertos, 0);
  const total = fases.reduce((n, f) => n + f.total, 0);
  return { puntos: s.puntos, aciertos, total, sesion_perfecta: total > 0 && aciertos === total,
           racha: perfil.racha_actual, comodin_usado: false, fases };
}

export default function App() {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ejercicios, setEjercicios] = useState<EjercicioDB[]>([]);
  const [progreso, setProgreso] = useState<Progreso>({ fase: 0, pantalla: 'jugando', tiempos: {} });
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [yaJugado, setYaJugado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Siempre se aterriza en el inicio; desde ahí se empieza o se continúa el reto en curso
  const [enInicio, setEnInicio] = useState(true);

  // Cola de escrituras a la DB: se encadenan para no perder ninguna y poder esperarlas antes de finalizar
  const cola = useRef<Promise<void>>(Promise.resolve());
  const encolar = (fn: () => Promise<void>) => {
    cola.current = cola.current.then(fn).catch((e: Error) => setAviso(`Sin conexión: ${e.message}`));
  };

  const cargar = useCallback(async () => {
    setEstado('cargando');
    setMensaje(null);
    try {
      if (!supabaseConfigurado) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (mira .env.example).');
      const errToken = await entrarConToken();
      if (errToken) { setMensaje(errToken); setEstado('sin_acceso'); return; }
      if (!(await haySesion())) { setEstado('sin_acceso'); return; }

      const p = await cargarPerfil();
      const { session: s, ejercicios: ej } = await iniciarSesion();
      setPerfil(p); setSession(s); setEjercicios(ej);

      if (s.estado === 'completada') {
        setResultado(resultadoDesdeSesion(s, p));
        setYaJugado(true);
        borrarProgreso(s.id);
      } else {
        setProgreso(ej.length ? leerProgreso(s.id) : { fase: 0, pantalla: 'jugando', tiempos: {} });
      }
      setEstado('listo');
    } catch (e) {
      setMensaje((e as Error).message);
      setEstado('error');
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const actualizarProgreso = (p: Progreso) => {
    setProgreso(p);
    if (session) guardarProgreso(session.id, p);
  };

  const empezar = async () => {
    if (!session) return;
    if (ejercicios.length) { setEnInicio(false); return; }   // reto a medias: continuar donde estaba
    setOcupado(true);
    try {
      const filas = await insertarEjercicios(session.id, genSesion(CONFIG.EJERCICIOS_POR_FASE));
      setEjercicios(filas);
      actualizarProgreso({ fase: 0, pantalla: 'jugando', tiempos: {} });
      setEnInicio(false);
    } catch (e) {
      setMensaje((e as Error).message); setEstado('error');
    } finally { setOcupado(false); }
  };

  const onRespuesta = useCallback((id: string, respuesta: number, ms: number) => {
    setEjercicios((prev) => prev.map((e) => (e.id === id ? { ...e, respuesta, ms } : e)));
    encolar(() => guardarRespuesta(id, respuesta, ms));
  }, []);

  const onTerminarFase = useCallback((segs: number) => {
    const op = ORDEN_FASES[progreso.fase];
    actualizarProgreso({ ...progreso, pantalla: 'transicion', tiempos: { ...progreso.tiempos, [op]: segs } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progreso, session]);

  const finalizar = async (tiempos: Progreso['tiempos']) => {
    if (!session) return;
    setOcupado(true);
    try {
      await cola.current;                       // que todas las respuestas estén en la DB
      const res = await finalizarSesion(session.id, tiempos);
      const p = await cargarPerfil();
      setPerfil(p); setResultado(res); setYaJugado(false);
      borrarProgreso(session.id);
    } catch (e) {
      setMensaje((e as Error).message); setEstado('error');
    } finally { setOcupado(false); }
  };

  const onSiguiente = () => {
    const siguiente = progreso.fase + 1;
    if (siguiente >= ORDEN_FASES.length) {
      actualizarProgreso({ ...progreso, fase: siguiente });
      void finalizar(progreso.tiempos);
    } else {
      actualizarProgreso({ ...progreso, fase: siguiente, pantalla: 'jugando' });
    }
  };

  // Si se refrescó justo antes de finalizar (todas las fases hechas), finalizamos ahora
  useEffect(() => {
    if (estado === 'listo' && !resultado && ejercicios.length && progreso.fase >= ORDEN_FASES.length && !ocupado) {
      void finalizar(progreso.tiempos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, progreso.fase]);

  // ---------- render ----------
  if (estado === 'cargando') return <Pantalla>Cargando…</Pantalla>;
  if (estado === 'sin_acceso') return <SinAcceso mensaje={mensaje} />;
  if (estado === 'error' || !perfil || !session) return <ErrorPantalla mensaje={mensaje ?? 'Error desconocido'} onReintentar={cargar} />;

  let contenido;
  if (resultado) {
    contenido = <Resumen perfil={perfil} resultado={resultado} yaJugado={yaJugado} />;
  } else if (enInicio) {
    contenido = <Inicio perfil={perfil} onEmpezar={empezar} cargando={ocupado} enCurso={ejercicios.length > 0} />;
  } else if (progreso.fase >= ORDEN_FASES.length) {
    contenido = <Pantalla>Calculando resultado…</Pantalla>;
  } else {
    const op = ORDEN_FASES[progreso.fase];
    const deFase = ejercicios.filter((e) => e.op === op);
    if (progreso.pantalla === 'transicion') {
      const aciertos = deFase.filter((e) => e.respuesta !== null && e.respuesta === e.sol).length;
      contenido = (
        <Transicion op={op} aciertos={aciertos} total={deFase.length}
          siguiente={ORDEN_FASES[progreso.fase + 1] ?? null} onSiguiente={onSiguiente} cargando={ocupado} />
      );
    } else {
      contenido = (
        <Fase key={op} op={op} numFase={progreso.fase + 1} ejercicios={deFase}
          onRespuesta={onRespuesta} onTerminar={onTerminarFase} />
      );
    }
  }

  return (
    <>
      {contenido}
      {aviso && (
        <div role="alert" className="fixed bottom-3 inset-x-3 rounded-2xl bg-rose-600 text-white p-3 text-sm font-bold flex justify-between">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} aria-label="Cerrar">✕</button>
        </div>
      )}
    </>
  );
}

function Pantalla({ children }: { children: React.ReactNode }) {
  return <main className="min-h-full grid place-items-center text-slate-400 font-bold text-xl animate-pulse">{children}</main>;
}
