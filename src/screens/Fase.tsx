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
  numFase: number;
  ejercicios: EjercicioDB[];
  inicio: number;
  onRespuesta: (id: string, respuesta: number, ms: number) => void;
  onTerminar: (segundosRestantes: number) => void;
  onInicio: () => void;
}

export function Fase({ op, numFase, ejercicios, inicio, onRespuesta, onTerminar, onInicio }: Props) {
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
  const [restante, setRestante] = useState<number>(() => Math.max(0, total - Math.floor((Date.now() - inicio) / 1000)));
  const [confirmando, setConfirmando] = useState(false);
  const [borrador, setBorrador] = useState(false);
  const desdeRef = useRef(Date.now());
  const terminadoRef = useRef(false);

  const actual = ejercicios[idx];
  const respondidas = Object.values(respuestas).filter((v) => v !== null).length;
  const todasHechas = respondidas === ejercicios.length;

  useEffect(() => {
    const prev = respuestas[actual.id];
    setBuffer(prev === null || prev === undefined ? '' : String(prev));
    desdeRef.current = Date.now();
    setConfirmando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

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

  useEffect(() => {
    const t = setInterval(() => setRestante(Math.max(0, total - Math.floor((Date.now() - inicio) / 1000))), 1000);
    return () => clearInterval(t);
  }, [total, inicio]);
  useEffect(() => { if (restante === 0) terminar(0); }, [restante, terminar]);

  const volverAlInicio = () => { commit(); onInicio(); };

  const irA = (i: number) => {
    commit();
    setIdx(((i % ejercicios.length) + ejercicios.length) % ejercicios.length);
  };

  const siguienteSinResponder = () => {
    const guardadoAhora = commit();
    for (let k = 1; k <= ejercicios.length; k++) {
      const j = (idx + k) % ejercicios.length;
      const e = ejercicios[j];
      if (respuestas[e.id] === null && !(j === idx && guardadoAhora)) { setIdx(j); return; }
    }
    if (idx < ejercicios.length - 1) setIdx(idx + 1);
  };

  const digito = (d: string) => setBuffer((b) => teclear(b, d, op));
  const borrar = () => setBuffer((b) => borrarDigito(b, op));

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
    <div className="min-h-dvh max-w-5xl mx-auto w-full px-4 sm:px-8 py-3 sm:py-5 flex flex-col justify-center gap-3 sm:gap-4">
      <header className="glass rounded-[22px] px-3 sm:px-4 h-[60px] flex items-center justify-between gap-3 in d1">
        <div className="flex items-center gap-2.5 min-w-0">
          <button type="button" onClick={volverAlInicio} title="Volver al inicio (se guarda lo que llevas)" aria-label="Volver al inicio"
            className="w-9 h-9 rounded-[12px] grid place-items-center glass-fuerte border border-linea text-tinta-2 hover:text-tinta active:scale-95 transition shrink-0">
            <Icono nombre="chevLeft" size={18} />
          </button>
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

      <div className="glass rounded-[18px] px-3.5 py-2.5 flex items-center gap-2.5 text-[13.5px] font-semibold text-tinta-2 in d2" role="note">
        <span className="tile tile-amarillo w-8 h-8 rounded-[10px] shrink-0"><Icono nombre="pencil" size={16} /></span>
        <span className="flex-1">Te recomendamos usar papel y lápiz: haz ahí la cuenta y escribe aquí {op === 'div' ? 'el cociente' : 'el resultado'}.</span>
        <button type="button" onClick={() => setBorrador((v) => !v)} aria-pressed={borrador}
          className="chip shrink-0 hover:text-tinta transition">
          <Icono nombre="pencil" size={13} />{borrador ? 'Cerrar borrador' : 'O escribe aquí'}
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-3 sm:gap-5 items-center">
        <section className={`glass luz-${info.acento} rounded-[32px] sm:rounded-[36px] p-4 sm:p-8 flex flex-col gap-4 min-h-[380px] lg:min-h-[480px] in d2`}>
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
            {op === 'div' ? (
              <CajaDivision a={actual.a} b={actual.b} buffer={buffer} />
            ) : (
            <div className="flex flex-col items-end gap-1.5 sm:gap-2 font-mono tabular-nums">
              <div className="flex gap-1 sm:gap-1.5">{digitosA.map((d, i) => <Celda key={i} className="caja caja-rosa">{d}</Celda>)}</div>
              <div className="flex gap-1 sm:gap-1.5">
                <Celda className="text-tinta-2">{info.simbolo}</Celda>
                {digitosB.map((d, i) => <Celda key={i} className="caja caja-amarillo">{d}</Celda>)}
              </div>
              <div className="h-[3px] w-full rounded-full bg-tinta/70 my-1" />
              <div className="flex gap-1 sm:gap-1.5" aria-live="polite" aria-label={buffer ? `Respuesta ${buffer}` : 'Sin respuesta'}>
                {rtl && <Cursor />}
                {digitosR.map((d, i) => <Celda key={i} className="caja caja-azul pop">{d}</Celda>)}
                {!rtl && <Cursor />}
              </div>
            </div>
            )}
            <p className="mt-4 text-[12.5px] text-tinta-3">
              {rtl ? 'Escribe empezando por las unidades, como en el papel.' : 'Haz la cuenta en tu papel y escribe aquí el cociente, de izquierda a derecha.'}
            </p>
          </div>
          {borrador && <Borrador />}
        </section>

        <aside className="flex flex-col gap-3 in d3">
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

function Celda({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`celda ${className}`}>{children}</span>;
}

/* La caja de toda la vida: dividendo | divisor, y debajo de la galera se escribe el cociente.
   La cuenta se hace en papel (hay un aviso en la fase); aquí no hay huecos de resta ni resto. */
function CajaDivision({ a, b, buffer }: { a: number; b: number; buffer: string }) {
  const digitosA = String(a).split('');
  const digitosB = String(b).split('');
  const digitosR = buffer.split('');

  return (
    <div className="pizarra-div max-w-full overflow-x-auto flex items-stretch font-mono tabular-nums px-1" aria-label={`${a} dividido entre ${b}`}>
      <div className="flex gap-1 sm:gap-1.5 self-start">
        {digitosA.map((d, i) => <span key={i} className="celda caja caja-rosa">{d}</span>)}
      </div>

      <div className="w-[3px] rounded-full bg-tinta/70 mx-2 sm:mx-3 shrink-0" />

      <div className="flex flex-col gap-1.5 sm:gap-2 items-start self-start">
        <div className="flex gap-1 sm:gap-1.5">{digitosB.map((d, i) => <span key={i} className="celda caja caja-amarillo">{d}</span>)}</div>
        <div className="h-[3px] w-full min-w-[90px] sm:min-w-[130px] rounded-full bg-tinta/70" />
        <div className="flex gap-1 sm:gap-1.5" aria-live="polite" aria-label={buffer ? `Cociente ${buffer}` : 'Sin cociente'}>
          {digitosR.map((d, i) => <span key={i} className="celda caja caja-azul pop">{d}</span>)}
          <Cursor />
        </div>
      </div>
    </div>
  );
}

function Cursor() {
  return <span className="celda celda-cursor" aria-hidden="true"><i /></span>;
}

/* Hoja de sucio para escribir a mano (dedo o ratón). No se corrige: es como el papel.
   Vive fuera del div con key de la cuenta, así que lo escrito aguanta al cambiar de cuenta. */
function Borrador() {
  const ref = useRef<HTMLCanvasElement>(null);
  const trazando = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const punto = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const empezar = (e: React.PointerEvent) => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    trazando.current = true;
    ref.current!.setPointerCapture(e.pointerId);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-tinta').trim() || '#101323';
    const [x, y] = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const trazar = (e: React.PointerEvent) => {
    if (!trazando.current) return;
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const [x, y] = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const soltar = () => { trazando.current = false; };
  const limpiar = () => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="flex flex-col gap-2 mt-2 in">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-tinta-3 uppercase tracking-wide">Tu borrador</span>
        <button type="button" onClick={limpiar} className="chip hover:text-tinta transition"><Icono nombre="backspace" size={13} />Limpiar</button>
      </div>
      <canvas
        ref={ref} onPointerDown={empezar} onPointerMove={trazar} onPointerUp={soltar} onPointerCancel={soltar}
        className="w-full h-[200px] sm:h-[240px] touch-none rounded-[16px] glass-fuerte border border-dashed border-linea cursor-crosshair"
        aria-label="Borrador para escribir a mano"
      />
    </div>
  );
}
