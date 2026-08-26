import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, FASE_INFO } from '../config';
import type { EjercicioDB, Op } from '../types';
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

  return (
    <div className="min-h-full flex flex-col max-w-md mx-auto w-full px-4 pb-4 pt-3 gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-black text-xl">
          <span className="text-slate-400 font-bold">Fase {numFase}/4 ·</span> {info.nombre}
        </h1>
        <span className="text-sm font-bold text-slate-400">{respondidas}/{ejercicios.length}</span>
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
              className={`h-9 w-9 rounded-full font-extrabold text-sm transition
                ${hecho ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'}
                ${activo ? 'ring-4 ring-amber-400 scale-110' : ''}`}
              aria-label={`Ejercicio ${i + 1}${hecho ? ', respondido' : ''}`}
              aria-current={activo}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      {/* Enunciado tipo papel */}
      <section className={`flex-1 rounded-3xl bg-gradient-to-br ${info.color} p-5 flex flex-col items-center justify-center shadow-xl`}>
        <div key={actual.id} className="animate-pop font-mono font-black text-5xl sm:text-6xl leading-tight tabular-nums text-right">
          <div>{String(actual.a).padStart(ancho + 2, ' ').replaceAll(' ', ' ')}</div>
          <div>
            {info.simbolo}{String(actual.b).padStart(ancho + 1, ' ').replaceAll(' ', ' ')}
          </div>
          <div className="border-t-4 border-white/80 mt-1 pt-2 min-h-[1.2em]">
            <span className={buffer === '' ? 'opacity-50' : ''}>
              {(buffer === '' ? '?' : buffer).padStart(ancho + 2, ' ').replaceAll(' ', ' ')}
            </span>
          </div>
        </div>
      </section>

      <Keypad onDigito={digito} onBorrar={borrar} onOk={siguienteSinResponder} okDisabled={buffer === ''} />

      <div className="flex items-center justify-between gap-3 pt-1">
        <button type="button" className="btn btn-ghost py-3 px-4" onClick={() => irA(idx - 1)} aria-label="Anterior">←</button>
        {todasHechas ? (
          <button type="button" className="btn btn-primary flex-1" onClick={() => terminar(restante)}>
            Terminar fase ✓
          </button>
        ) : confirmando ? (
          <button type="button" className="btn bg-rose-500 text-white flex-1 py-3 text-base" onClick={() => terminar(restante)}>
            ¿Seguro? Faltan {ejercicios.length - respondidas}
          </button>
        ) : (
          <button type="button" className="text-slate-500 font-bold text-sm underline flex-1" onClick={() => setConfirmando(true)}>
            Terminar sin acabar
          </button>
        )}
        <button type="button" className="btn btn-ghost py-3 px-4" onClick={() => irA(idx + 1)} aria-label="Siguiente">→</button>
      </div>
    </div>
  );
}
