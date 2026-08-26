import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, FASE_INFO } from '../config';
import type { EjercicioDB, Op } from '../types';
import { Boton } from '../components/Boton';
import { Icono } from '../components/Icono';
import { Keypad } from '../components/Keypad';
import { Timer } from '../components/Timer';
import { borrarDigito, teclear } from '../lib/entrada';

interface Props {
  op: Op;
  numFase: number;                 // 1..4, para el título
  ejercicios: EjercicioDB[];       // solo los de esta fase, ordenados
  onRespuesta: (id: string, respuesta: number, ms: number) => void;
  onTerminar: (segundosRestantes: number) => void;
}

export function Fase({ op, numFase, ejercicios, onRespuesta, onTerminar }: Props) {
  const info = FASE_INFO[op];
  const total: number = CONFIG.TIEMPOS[op];

  const [idx, setIdx] = useState(() => Math.max(0, ejercicios.findIndex((e) => e.respuesta === null)));
  const [buffer, setBuffer] = useState('');
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>(
    () => Object.fromEntries(ejercicios.map((e) => [e.id, e.respuesta])),
  );
  const [msAcum, setMsAcum] = useState<Record<string, number>>(
    () => Object.fromEntries(ejercicios.map((e) => [e.id, e.ms ?? 0])),
  );
  const [restante, setRestante] = useState<number>(total);
  const [confirmando, setConfirmando] = useState(false);
  const desdeRef = useRef(Date.now());
  const terminadoRef = useRef(false);

  const actual = ejercicios[idx];
  const respondidas = Object.values(respuestas).filter((v) => v !== null).length;
  const todasHechas = respondidas === ejercicios.length;

  // Al cambiar de ejercicio: cargar su respuesta en el buffer y reiniciar el cronómetro por ejercicio
  useEffect(() => {
    const prev = respuestas[actual.id];
    setBuffer(prev === null || prev === undefined ? '' : String(prev));
    desdeRef.current = Date.now();
    setConfirmando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  /** Guarda lo que hay en el buffer (si hay algo y cambió). Devuelve true si guardó. */
  const commit = useCallback(() => {
    if (buffer === '') return false;
    const valor = Number(buffer);
    const ms = msAcum[actual.id] + (Date.now() - desdeRef.current);
    desdeRef.current = Date.now();
    setMsAcum((m) => ({ ...m, [actual.id]: ms }));
    if (respuestas[actual.id] === valor) return false;
    setRespuestas((r) => ({ ...r, [actual.id]: valor }));
    onRespuesta(actual.id, valor, ms);
    return true;
  }, [buffer, actual.id, msAcum, respuestas, onRespuesta]);

  const terminar = useCallback((segs: number) => {
    if (terminadoRef.current) return;
    terminadoRef.current = true;
    commit();
    onTerminar(segs);
  }, [commit, onTerminar]);

  // Timer de bloque
  useEffect(() => {
    const t = setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (restante === 0) terminar(0); }, [restante, terminar]);

  const irA = (i: number) => {
    commit();
    setIdx(((i % ejercicios.length) + ejercicios.length) % ejercicios.length);
  };

  const siguienteSinResponder = () => {
    const guardadoAhora = commit();
    // buscamos la siguiente sin responder, contando la actual como respondida si acabamos de guardarla
    for (let k = 1; k <= ejercicios.length; k++) {
      const j = (idx + k) % ejercicios.length;
      const e = ejercicios[j];
      if (respuestas[e.id] === null && !(j === idx && guardadoAhora)) { setIdx(j); return; }
    }
    if (idx < ejercicios.length - 1) setIdx(idx + 1);
  };

  // Suma, resta y multiplicación se escriben como en papel: de derecha a izquierda (ver lib/entrada.ts)
  const digito = (d: string) => setBuffer((b) => teclear(b, d, op));
  const borrar = () => setBuffer((b) => borrarDigito(b, op));

  // Teclado físico
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      if (/^[0-9]$/.test(ev.key)) digito(ev.key);
      else if (ev.key === 'Backspace') borrar();
      else if (ev.key === 'Enter') siguienteSinResponder();
      else if (ev.key === 'ArrowLeft') irA(idx - 1);
      else if (ev.key === 'ArrowRight') irA(idx + 1);
      else return;
      ev.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const ancho = Math.max(String(actual.a).length, String(actual.b).length);
  const pad = (s: string, n: number) => s.padStart(n, ' ').replaceAll(' ', ' ');

  return (
    <div className="min-h-full flex flex-col max-w-md mx-auto w-full px-4 pb-4 pt-3 gap-3">
      <div className="flex items-center justify-between in d1">
        <h1 className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <span className={`tile tile-${info.acento} w-9 h-9 rounded-[12px] text-lg`}>{info.simbolo}</span>
          <span className="leading-tight">
            <span className="block text-tinta-3 font-medium text-xs">Fase {numFase} de 4</span>
            {info.nombre}
          </span>
        </h1>
        <span className="chip tabular-nums">{respondidas}/{ejercicios.length}</span>
      </div>

      <Timer restante={restante} total={total} />

      {/* Navegación por ejercicios */}
      <nav className="flex justify-center gap-2 py-1" aria-label="Ejercicios">
        {ejercicios.map((e, i) => {
          const hecho = respuestas[e.id] !== null;
          const activo = i === idx;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => irA(i)}
              className={`h-9 w-9 rounded-[12px] text-sm font-bold transition-all duration-200
                ${hecho ? `tile tile-${info.acento}` : 'glass-fuerte border border-linea text-tinta-2'}
                ${activo ? 'ring-2 ring-tinta ring-offset-2 ring-offset-fondo scale-105' : ''}`}
              aria-label={`Ejercicio ${i + 1}${hecho ? ', respondido' : ''}`}
              aria-current={activo}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      {/* Enunciado tipo papel, sobre vidrio con la luz del acento de la fase */}
      <section className={`glass luz-${info.acento} rounded-[32px] flex-1 min-h-[240px] p-5 flex flex-col items-center justify-center`}>
        <div key={actual.id} className="pop font-mono font-bold text-5xl sm:text-6xl leading-tight tabular-nums text-right text-tinta">
          <div>{pad(String(actual.a), ancho + 2)}</div>
          <div>{info.simbolo}{pad(String(actual.b), ancho + 1)}</div>
          <div className="border-t-[3px] border-tinta/70 mt-1 pt-2 min-h-[1.2em]">
            <span className={buffer === '' ? 'text-tinta-3' : ''}>{pad(buffer === '' ? '?' : buffer, ancho + 2)}</span>
          </div>
        </div>
      </section>

      <Keypad onDigito={digito} onBorrar={borrar} onOk={siguienteSinResponder} okDisabled={buffer === ''} />

      <div className="flex items-center justify-between gap-3 pt-1">
        <Boton variante="glass" className="px-3.5" onClick={() => irA(idx - 1)} aria-label="Anterior"><Icono nombre="chevLeft" size={20} /></Boton>
        {todasHechas ? (
          <Boton className="flex-1" icono="check" onClick={() => terminar(restante)}>Terminar fase</Boton>
        ) : confirmando ? (
          <Boton variante="peligro" className="flex-1" onClick={() => terminar(restante)}>¿Seguro? Faltan {ejercicios.length - respondidas}</Boton>
        ) : (
          <button type="button" className="text-tinta-3 font-semibold text-sm underline flex-1" onClick={() => setConfirmando(true)}>
            Terminar sin acabar
          </button>
        )}
        <Boton variante="glass" className="px-3.5" onClick={() => irA(idx + 1)} aria-label="Siguiente"><Icono nombre="chev" size={20} /></Boton>
      </div>
    </div>
  );
}
