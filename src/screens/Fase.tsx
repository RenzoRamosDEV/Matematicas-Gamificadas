import { useCallback, useEffect, useRef, useState } from 'react';
import { CONFIG, FASE_INFO } from '../config';
import type { EjercicioDB, Op } from '../types';
import { Boton } from '../components/Boton';
import { Icono } from '../components/Icono';
import { Keypad } from '../components/Keypad';
import { Barra } from '../components/Barra';
import { borrarDigito, escribeDerechaAIzquierda, teclear } from '../lib/entrada';

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
  const rtl = escribeDerechaAIzquierda(op);

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

  const m = Math.floor(restante / 60);
  const s = String(restante % 60).padStart(2, '0');
  const urgente = restante <= 20;
  const digitosA = String(actual.a).split('');
  const digitosB = String(actual.b).split('');
  const digitosR = buffer.split('');

  return (
    <div className="min-h-dvh max-w-5xl mx-auto w-full px-4 sm:px-8 pt-3 sm:pt-5 pb-4 flex flex-col gap-3 sm:gap-4">
      {/* Cabecera de la fase */}
      <header className="glass rounded-[22px] px-3 sm:px-4 h-[60px] flex items-center justify-between gap-3 in d1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`tile tile-${info.acento} w-9 h-9 rounded-[12px] text-lg font-bold shrink-0`}>{info.simbolo}</span>
          <div className="leading-tight min-w-0">
            <div className="text-tinta-3 font-medium text-[11px]">Fase {numFase} de 4</div>
            <div className="font-bold tracking-tight truncate">{info.nombre}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip tabular-nums"><Icono nombre="check" size={12} />{respondidas}/{ejercicios.length}</span>
          <span className={`chip tabular-nums font-mono ${urgente ? 'chip-rosa animate-pulse' : ''}`}><Icono nombre="clock" size={12} />{m}:{s}</span>
        </div>
      </header>
      <Barra valor={restante / total} acento={urgente ? 'rosa' : info.acento} />

      <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-3 sm:gap-5 items-start">
        {/* Pizarra: la cuenta en columna, como en papel */}
        <section className={`glass luz-${info.acento} rounded-[32px] sm:rounded-[36px] p-4 sm:p-8 flex flex-col gap-4 min-h-[380px] lg:min-h-[520px] in d2`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-tinta-2 text-sm font-semibold">Cuenta {idx + 1} de {ejercicios.length}</span>
            <nav className="flex gap-1.5" aria-label="Cuentas">
              {ejercicios.map((e, i) => {
                const hecho = respuestas[e.id] !== null;
                const activo = i === idx;
                return (
                  <button
                    key={e.id} type="button" onClick={() => irA(i)}
                    aria-label={`Cuenta ${i + 1}${hecho ? ', respondida' : ''}`} aria-current={activo}
                    className={`h-7 min-w-7 px-2 rounded-full text-[11px] font-bold transition-all duration-200
                      ${hecho ? `tile tile-${info.acento}` : 'glass-fuerte border border-linea text-tinta-2'}
                      ${activo ? 'ring-2 ring-tinta ring-offset-2 ring-offset-fondo' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </nav>
          </div>

          <div key={actual.id} className="flex-1 flex flex-col items-center justify-center py-2 pop">
            <div className="flex flex-col items-end gap-1.5 sm:gap-2 font-mono tabular-nums">
              <div className="flex">{digitosA.map((d, i) => <Celda key={i}>{d}</Celda>)}</div>
              <div className="flex">
                <Celda className="text-tinta-2">{info.simbolo}</Celda>
                {digitosB.map((d, i) => <Celda key={i}>{d}</Celda>)}
              </div>
              <div className="h-[3px] w-full rounded-full bg-tinta/70 my-1" />
              <div className="flex gap-1 sm:gap-1.5" aria-live="polite" aria-label={buffer ? `Respuesta ${buffer}` : 'Sin respuesta'}>
                {rtl && <Cursor />}
                {digitosR.map((d, i) => <Celda key={i} respuesta>{d}</Celda>)}
                {!rtl && <Cursor />}
              </div>
            </div>
            <p className="mt-4 text-[12.5px] text-tinta-3">
              {rtl ? 'Escribe empezando por las unidades, como en el papel.' : 'Escribe el cociente de izquierda a derecha.'}
            </p>
          </div>
        </section>

        {/* Teclado y acciones */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-5 in d3">
          <Keypad onDigito={digito} onBorrar={borrar} onOk={siguienteSinResponder} okDisabled={buffer === ''} />
          <div className="flex items-center justify-between gap-3">
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
        </aside>
      </div>
    </div>
  );
}

/** Una columna de la cuenta: los dígitos de arriba van sin caja; los de la respuesta, en caja de vidrio. */
function Celda({ children, respuesta, className = '' }: { children: React.ReactNode; respuesta?: boolean; className?: string }) {
  return <span className={`celda ${respuesta ? 'celda-respuesta' : ''} ${className}`}>{children}</span>;
}

function Cursor() {
  return <span className="celda celda-cursor" aria-hidden="true"><i /></span>;
}
