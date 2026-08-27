import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, ORDEN_FASES } from './config';
import type { EjercicioDB, Op, Profile, ResultadoFinal, Session } from './types';
import { entrar, entrarConToken, haySesion, salir } from './lib/auth';
import { cargarPerfil, cargarSesiones, finalizarSesion, guardarRespuesta, iniciarSesion, insertarEjercicios, reintentar } from './lib/api';
import { genSesion } from './lib/generador';
import { borrarProgreso, guardarProgreso, leerProgreso, PROGRESO_INICIAL, type Progreso } from './lib/progreso';
import { supabaseConfigurado } from './lib/supabase';
import { Fondo } from './components/Fondo';
import { Icono } from './components/Icono';
import { Inicio, type EstadoReto } from './screens/Inicio';
import { ElegirFase } from './screens/ElegirFase';
import { Fase } from './screens/Fase';
import { Transicion } from './screens/Transicion';
import { Resumen } from './screens/Resumen';
import { Login } from './screens/Login';
import { Logros } from './screens/Logros';
import { Progreso as PaginaProgreso } from './screens/Progreso';
import { Pin } from './screens/Pin';
import { Admin } from './screens/Admin';
import { adminDesbloqueado, bloquearAdmin, desbloquearAdmin } from './lib/pin';
import { Cargando, ErrorPantalla } from './screens/Estados';

type Estado = 'cargando' | 'sin_acceso' | 'error' | 'listo';
type Vista = 'inicio' | 'reto' | 'logros' | 'progreso' | 'admin';

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
  const [progreso, setProgreso] = useState<Progreso>(PROGRESO_INICIAL);
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);
  const [yaJugado, setYaJugado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const vistaDeHash = (): Vista => {
    const h = location.hash.slice(1);
    return h === 'reto' || h === 'logros' || h === 'progreso' || h === 'admin' ? h : 'inicio';
  };
  const [vista, setVistaLocal] = useState<Vista>(vistaDeHash);
  useEffect(() => {
    const sync = () => setVistaLocal(vistaDeHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const setVista = (v: Vista) => {
    if (v === 'inicio') history.replaceState(null, '', location.pathname + location.search);
    else location.hash = v;
    setVistaLocal(v);
  };
  const abrirLogros = () => setVista('logros');
  const cerrarLogros = () => setVista('inicio');
  const [adminOk, setAdminOk] = useState(adminDesbloqueado);
  const desbloquear = () => { desbloquearAdmin(); setAdminOk(true); };
  const bloquear = () => { bloquearAdmin(); setAdminOk(false); setVista('inicio'); };

  const cola = useRef<Promise<void>>(Promise.resolve());
  const encolar = (fn: () => Promise<void>) => {
    cola.current = cola.current.then(fn).catch((e: Error) => setAviso(`Sin conexión: ${e.message}`));
  };

  const cargarHistorial = useCallback(async (previo: Session[]) => {
    try { return await reintentar(cargarSesiones); }
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
        setProgreso(ej.length ? leerProgreso(s.id) : PROGRESO_INICIAL);
      }
      setEstado('listo');
    } catch (e) {
      const msg = (e as Error).message;
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

  const onEntrar = async (usuario: string, password: string) => {
    const err = await entrar(usuario, password);
    if (!err) { setVista('inicio'); void cargar(); }
    return err;
  };

  const onSalir = async () => {
    await salir();
    setPerfil(null); setSession(null); setSesiones([]); setEjercicios([]); setResultado(null); setYaJugado(false);
    bloquearAdmin(); setAdminOk(false);
    setProgreso(PROGRESO_INICIAL); setVista('inicio'); cerrarLogros(); setMensaje(null); setEstado('sin_acceso');
  };

  const actualizarProgreso = (p: Progreso) => {
    setProgreso(p);
    if (session) guardarProgreso(session.id, p);
  };

  const irAlReto = () => {
    if (!resultado && progreso.pantalla === 'jugando') actualizarProgreso({ ...progreso, pantalla: 'eligiendo' });
    setVista('reto');
  };

  const elegirFase = async (op: Op) => {
    if (!session) return;
    if (!ejercicios.length) {
      setOcupado(true);
      try {
        setEjercicios(await insertarEjercicios(session.id, genSesion(CONFIG.EJERCICIOS_POR_FASE)));
      } catch (e) {
        setMensaje((e as Error).message); setEstado('error'); return;
      } finally { setOcupado(false); }
    }
    const inicios = { ...progreso.inicios, [op]: progreso.inicios[op] ?? Date.now() };
    actualizarProgreso({ ...progreso, actual: op, pantalla: 'jugando', inicios });
    setVista('reto');
  };

  const onRespuesta = useCallback((id: string, respuesta: number, ms: number) => {
    setEjercicios((prev) => prev.map((e) => (e.id === id ? { ...e, respuesta, ms } : e)));
    encolar(() => guardarRespuesta(id, respuesta, ms));
  }, []);

  const onTerminarFase = useCallback((segs: number) => {
    const op = progreso.actual;
    if (!op) return;
    actualizarProgreso({
      ...progreso,
      hechas: progreso.hechas.includes(op) ? progreso.hechas : [...progreso.hechas, op],
      tiempos: { ...progreso.tiempos, [op]: segs },
      pantalla: 'transicion',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progreso, session]);

  const finalizar = async (tiempos: Progreso['tiempos']) => {
    if (!session) return;
    setOcupado(true);
    try {
      await cola.current;
      const res = await finalizarSesion(session.id, tiempos);
      const [p, hist] = await Promise.all([cargarPerfil(), cargarHistorial(sesiones)]);
      setPerfil(p); setSesiones(hist); setResultado(res); setYaJugado(false);
      setSession({ ...session, estado: 'completada', puntos: res.puntos, detalle: res.fases });
      borrarProgreso(session.id);
    } catch (e) {
      setMensaje((e as Error).message); setEstado('error');
    } finally { setOcupado(false); }
  };

  const verResultado = () => actualizarProgreso({ ...progreso, actual: null, pantalla: 'finalizando' });

  useEffect(() => {
    if (estado === 'listo' && !resultado && ejercicios.length && progreso.pantalla === 'finalizando' && !ocupado) {
      void finalizar(progreso.tiempos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, progreso.pantalla]);

  if (estado === 'cargando') return <Fondo><Cargando /></Fondo>;
  if (estado === 'sin_acceso') return <Fondo><Login mensaje={mensaje} onEntrar={onEntrar} /></Fondo>;
  if (estado === 'error' || !perfil || !session) return <Fondo><ErrorPantalla mensaje={mensaje ?? 'Error desconocido'} onReintentar={cargar} /></Fondo>;

  const estadoReto: EstadoReto = resultado ? 'completado' : ejercicios.length ? 'en_curso' : 'nuevo';

  let contenido;
  if (vista === 'admin') {
    contenido = adminOk
      ? <Admin perfil={perfil} sesiones={sesiones} onIr={setVista} onBloquear={bloquear} onSalir={onSalir} onAviso={setAviso} />
      : <Pin onDesbloquear={desbloquear} onVolver={() => setVista('inicio')} />;
  } else if (vista === 'logros') {
    contenido = <Logros perfil={perfil} sesiones={sesiones} onVolver={cerrarLogros} onSalir={onSalir} onIr={setVista} />;
  } else if (vista === 'progreso') {
    contenido = <PaginaProgreso perfil={perfil} sesiones={sesiones} onVolver={() => setVista('inicio')} onSalir={onSalir} onAviso={setAviso} onIr={setVista} />;
  } else if (vista === 'inicio') {
    contenido = (
      <Inicio
        perfil={perfil} sesiones={sesiones} estadoReto={estadoReto} fasesHechas={progreso.hechas}
        puntosHoy={resultado?.puntos ?? session.puntos}
        onEmpezar={irAlReto} onVerResultado={() => setVista('reto')} onVerLogros={abrirLogros} onVerProgreso={() => setVista('progreso')} cargando={ocupado} onSalir={onSalir} onIr={setVista}
      />
    );
  } else if (resultado) {
    contenido = <Resumen perfil={perfil} resultado={resultado} ejercicios={ejercicios} yaJugado={yaJugado} onVolver={() => setVista('inicio')} onSalir={onSalir} onIr={setVista} />;
  } else if (progreso.pantalla === 'finalizando') {
    contenido = <Cargando texto="Calculando resultado…" />;
  } else if (progreso.pantalla === 'eligiendo' || !progreso.actual) {
    contenido = (
      <ElegirFase ejercicios={ejercicios} hechas={progreso.hechas} actual={progreso.actual}
        onElegir={elegirFase} onVolver={() => setVista('inicio')} cargando={ocupado} />
    );
  } else {
    const op = progreso.actual;
    const deFase = ejercicios.filter((e) => e.op === op);
    if (progreso.pantalla === 'transicion') {
      const aciertos = deFase.filter((e) => e.respuesta !== null && e.respuesta === e.sol).length;
      contenido = (
        <Transicion op={op} aciertos={aciertos} total={deFase.length} ejercicios={ejercicios} hechas={progreso.hechas}
          onElegir={elegirFase} onVerResultado={verResultado} onInicio={() => setVista('inicio')} cargando={ocupado} />
      );
    } else {
      contenido = (
        <Fase key={op} op={op} numFase={Math.min(progreso.hechas.length + 1, ORDEN_FASES.length)} ejercicios={deFase}
          inicio={progreso.inicios[op] ?? Date.now()} onRespuesta={onRespuesta} onTerminar={onTerminarFase} onInicio={() => setVista('inicio')} />
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
