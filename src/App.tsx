import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, ORDEN_FASES } from './config';
import type { EjercicioDB, Profile, ResultadoFinal, Session } from './types';
import { entrar, entrarConToken, haySesion, salir } from './lib/auth';
import { cargarPerfil, cargarSesiones, finalizarSesion, guardarRespuesta, iniciarSesion, insertarEjercicios } from './lib/api';
import { genSesion } from './lib/generador';
import { borrarProgreso, guardarProgreso, leerProgreso, type Progreso } from './lib/progreso';
import { supabaseConfigurado } from './lib/supabase';
import { Fondo } from './components/Fondo';
import { Icono } from './components/Icono';
import { Inicio, type EstadoReto } from './screens/Inicio';
import { Fase } from './screens/Fase';
import { Transicion } from './screens/Transicion';
import { Resumen } from './screens/Resumen';
import { Login } from './screens/Login';
import { Logros } from './screens/Logros';
import { Cargando, ErrorPantalla } from './screens/Estados';

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
  const [sesiones, setSesiones] = useState<Session[]>([]);
  const [ejercicios, setEjercicios] = useState<EjercicioDB[]>([]);
  const [progreso, setProgreso] = useState<Progreso>({ fase: 0, pantalla: 'jugando', tiempos: {} });
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [yaJugado, setYaJugado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  // Siempre se aterriza en el inicio; desde ahí se empieza o se continúa el reto, o se ve el resultado del día
  const [enInicio, setEnInicio] = useState(true);
  // La página de logros vive en #logros: así funciona el botón atrás y se puede enlazar
  const [enLogros, setEnLogros] = useState(() => location.hash === '#logros');
  useEffect(() => {
    const sync = () => setEnLogros(location.hash === '#logros');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const abrirLogros = () => { location.hash = 'logros'; };
  const cerrarLogros = () => { history.replaceState(null, '', location.pathname + location.search); setEnLogros(false); };

  // Cola de escrituras a la DB: se encadenan para no perder ninguna y poder esperarlas antes de finalizar
  const cola = useRef<Promise<void>>(Promise.resolve());
  const encolar = (fn: () => Promise<void>) => {
    cola.current = cola.current.then(fn).catch((e: Error) => setAviso(`Sin conexión: ${e.message}`));
  };

  /** El historial no es imprescindible para jugar: si falla, se avisa y se sigue con lo que haya. */
  const cargarHistorial = useCallback(async (previo: Session[]) => {
    try { return await cargarSesiones(); }
    catch (e) { setAviso(`Historial no disponible: ${(e as Error).message}`); return previo; }
  }, []);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    setMensaje(null);
    try {
      if (!supabaseConfigurado) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (mira .env.example).');
      const errToken = await entrarConToken();
      if (errToken) { setMensaje(errToken); setEstado('sin_acceso'); return; }
      if (!(await haySesion())) { setEstado('sin_acceso'); return; }

      const [p, { session: s, ejercicios: ej }, hist] = await Promise.all([cargarPerfil(), iniciarSesion(), cargarHistorial([])]);
      setPerfil(p); setSession(s); setEjercicios(ej); setSesiones(hist);

      if (s.estado === 'completada') {
        setResultado(resultadoDesdeSesion(s, p));
        setYaJugado(true);
        borrarProgreso(s.id);
      } else {
        setProgreso(ej.length ? leerProgreso(s.id) : { fase: 0, pantalla: 'jugando', tiempos: {} });
      }
      setEstado('listo');
    } catch (e) {
      const msg = (e as Error).message;
      // Sesión guardada de un usuario que ya no existe (borrado en Supabase): fuera y al login
      if (msg.startsWith('perfil')) {
        await salir();
        setMensaje('Tu sesión ya no es válida. Entra de nuevo.');
        setEstado('sin_acceso');
        return;
      }
      setMensaje(msg);
      setEstado('error');
    }
  }, [cargarHistorial]);

  useEffect(() => { void cargar(); }, [cargar]);

  /** Login con usuario y contraseña: si entra, carga todo y aterriza en el inicio. */
  const onEntrar = async (usuario: string, password: string) => {
    const err = await entrar(usuario, password);
    if (!err) { setEnInicio(true); void cargar(); }
    return err;
  };

  const onSalir = async () => {
    await salir();
    setPerfil(null); setSession(null); setSesiones([]); setEjercicios([]); setResultado(null); setYaJugado(false);
    setEnInicio(true); cerrarLogros(); setMensaje(null); setEstado('sin_acceso');
  };

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
      const [p, hist] = await Promise.all([cargarPerfil(), cargarHistorial(sesiones)]);
      setPerfil(p); setSesiones(hist); setResultado(res); setYaJugado(false);
      setSession({ ...session, estado: 'completada', puntos: res.puntos, detalle: res.fases });
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
  if (estado === 'cargando') return <Fondo><Cargando /></Fondo>;
  if (estado === 'sin_acceso') return <Fondo><Login mensaje={mensaje} onEntrar={onEntrar} /></Fondo>;
  if (estado === 'error' || !perfil || !session) return <Fondo><ErrorPantalla mensaje={mensaje ?? 'Error desconocido'} onReintentar={cargar} /></Fondo>;

  const estadoReto: EstadoReto = resultado ? 'completado' : ejercicios.length ? 'en_curso' : 'nuevo';

  let contenido;
  if (enLogros) {
    contenido = <Logros perfil={perfil} sesiones={sesiones} onVolver={cerrarLogros} onSalir={onSalir} />;
  } else if (enInicio) {
    contenido = (
      <Inicio
        perfil={perfil} sesiones={sesiones} ejercicios={ejercicios} estadoReto={estadoReto}
        puntosHoy={resultado?.puntos ?? session.puntos}
        onEmpezar={empezar} onVerResultado={() => setEnInicio(false)} onVerLogros={abrirLogros} cargando={ocupado} onSalir={onSalir}
      />
    );
  } else if (resultado) {
    contenido = <Resumen perfil={perfil} resultado={resultado} yaJugado={yaJugado} onVolver={() => setEnInicio(true)} onSalir={onSalir} />;
  } else if (progreso.fase >= ORDEN_FASES.length) {
    contenido = <Cargando texto="Calculando resultado…" />;
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
    <Fondo>
      {contenido}
      {aviso && (
        <div role="alert" className="glass fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:w-96 z-30 rounded-[18px] p-3.5 text-sm font-semibold flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-rosa-2"><Icono nombre="alert" size={18} className="shrink-0" />{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar" className="text-tinta-3 shrink-0"><Icono nombre="x" size={18} /></button>
        </div>
      )}
    </Fondo>
  );
}
