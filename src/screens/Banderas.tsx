import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../types';
import { Barra } from '../components/Barra';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import { Icono } from '../components/Icono';
import type { Destino } from '../components/MenuPerfil';
import { hoyMadrid } from '../lib/semana';
import type { AciertoBandera } from '../lib/api';
import {
  emojiDe, evaluar, hitosConseguidos, HITOS_BANDERAS, llevaTilde,
  PAISES, puntosDe, ronda, TIEMPO_POR_BANDERA, type Pais, type Veredicto,
} from '../lib/banderas';

const POR_RONDA = 20;
type Resultado = Veredicto | 'tiempo';

interface Props {
  perfil: Profile;
  adivinadas: string[]; // códigos de países ya adivinados alguna vez (de la cuenta)
  onEmpezarRonda: () => Promise<boolean>;
  onAcierto: (codigo: string, conTilde: boolean) => Promise<AciertoBandera | null>;
  onVolver: () => void;
  onSalir?: () => void;
  onIr: (destino: Destino) => void;
}

export function Banderas({ perfil, adivinadas, onEmpezarRonda, onAcierto, onVolver, onSalir, onIr }: Props) {
  const hoy = hoyMadrid();
  // Una entrada al día, guardada en la cuenta: si ya entró hoy, no hay ronda hasta mañana.
  const [bloqueado, setBloqueado] = useState(() => perfil.banderas_dia === hoy);
  const [paises] = useState<Pais[]>(() => ronda(POR_RONDA));
  const [idx, setIdx] = useState(0);
  const [respuesta, setRespuesta] = useState('');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [restante, setRestante] = useState(TIEMPO_POR_BANDERA);
  const [puntosRonda, setPuntosRonda] = useState(0);
  const [aciertos, setAciertos] = useState(0);
  const [tildes, setTildes] = useState(0);
  const [nueva, setNueva] = useState(false);
  const [rindiendo, setRindiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fin = idx >= paises.length;
  const enRonda = !bloqueado && !fin;
  const pais = enRonda ? paises[idx] : null;
  const parado = !enRonda || resultado !== null;
  const totalAdivinadas = adivinadas.length;
  const { siguiente: hitoSiguiente } = hitosConseguidos(totalAdivinadas);

  useEffect(() => { if (enRonda) inputRef.current?.focus(); }, [idx, enRonda]);
  // Abre la ronda del día en la cuenta; si el servidor dice que hoy ya jugó, se bloquea.
  const abierta = useRef(false);
  useEffect(() => {
    if (bloqueado || abierta.current) return;
    abierta.current = true;
    void onEmpezarRonda().then((ok) => { if (!ok) setBloqueado(true); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1 minuto por bandera; el reloj se para al responder y arranca de cero con la siguiente.
  useEffect(() => {
    if (parado) return;
    const tick = setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000);
    const limite = setTimeout(() => setResultado('tiempo'), TIEMPO_POR_BANDERA * 1000);
    return () => { clearInterval(tick); clearTimeout(limite); };
  }, [idx, parado]);

  const comprobar = () => {
    if (!pais || respuesta.trim() === '') return;
    setRindiendo(false);
    const v = evaluar(pais.nombre, respuesta);
    setResultado(v);
    const pts = puntosDe(v);
    if (pts > 0) {
      // los puntos van a la cuenta al momento, sin esperar a acabar la ronda
      setPuntosRonda((p) => p + pts);
      setAciertos((a) => a + 1);
      if (v === 'con-tilde') setTildes((t) => t + 1);
      void onAcierto(pais.codigo, v === 'con-tilde').then((r) => { if (r) setNueva(r.nueva); });
    }
  };

  const pasar = () => { setIdx((i) => i + 1); setRespuesta(''); setResultado(null); setNueva(false); setRestante(TIEMPO_POR_BANDERA); setRindiendo(false); };
  const noLoSe = () => setResultado('mal');
  // Rendirse es la única salida a media ronda: corta la ronda (los puntos ya ganados se quedan).
  const rendirse = () => { setRindiendo(false); setResultado(null); setIdx(paises.length); };

  const reloj = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-dvh max-w-[900px] mx-auto w-full px-4 sm:px-8 pb-8 flex flex-col">
      {/* La cabecera se ve siempre (logo, nivel, avatar) pero a media ronda queda inerte: mirar sí, salir no. */}
      <div inert={enRonda || undefined}>
        <Cabecera perfil={perfil} onIr={onIr} onSalir={onSalir} />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-5 sm:mt-7 px-1 in d1">
        <div>
          {!enRonda && (
            <button type="button" onClick={onVolver} className="inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
              <Icono nombre="chevLeft" size={16} />Inicio
            </button>
          )}
        </div>
        <h1 className="text-[28px] sm:text-4xl font-bold leading-[1.05] tracking-[-.03em] text-center">Adivina la bandera</h1>
        <div className="justify-self-end">
          {enRonda && (rindiendo ? (
            <Boton variante="peligro" onClick={rendirse}>¿Seguro? Se acaba la ronda</Boton>
          ) : (
            <button type="button" onClick={() => setRindiendo(true)} className="text-tinta-3 font-semibold text-sm underline shrink-0">
              Rendirse
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 flex flex-col justify-center gap-4 py-4">

      <section className="glass luz-amarillo rounded-[32px] p-5 sm:p-8 flex flex-col items-center gap-4 in d2">
        {bloqueado ? (
          <>
            <span className="text-[64px] leading-none" aria-hidden="true">🌍</span>
            <h2 className="text-2xl font-bold tracking-tight">Hoy ya has jugado</h2>
            <p className="text-tinta-2 text-[15px] text-center text-pretty">Una ronda al día: mañana te esperan banderas nuevas.</p>
            <Boton className="mt-1" onClick={onVolver}>Volver al inicio</Boton>
          </>
        ) : fin ? (
          <>
            <span className="text-[64px] leading-none" aria-hidden="true">🏁</span>
            <h2 className="text-2xl font-bold tracking-tight">¡Ronda terminada!</h2>
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="chip chip-verde tabular-nums"><Icono nombre="check" size={13} />{aciertos} de {POR_RONDA} banderas</span>
              <span className="chip chip-azul tabular-nums"><Icono nombre="star" size={13} />+{puntosRonda} puntos extra</span>
              {tildes > 0 && <span className="chip tabular-nums"><Icono nombre="pencil" size={13} />{tildes} con su tilde</span>}
            </div>
            <p className="text-tinta-3 text-[13px]">Una ronda al día: mañana hay más.</p>
            <Boton className="mt-1" onClick={onVolver}>Volver al inicio</Boton>
          </>
        ) : (
          <>
            <div className="w-full flex items-center justify-between gap-2 flex-wrap">
              <span className="chip tabular-nums">Bandera {idx + 1} de {POR_RONDA}</span>
              <div className="flex gap-2">
                <span className="chip chip-azul tabular-nums"><Icono nombre="star" size={13} />+{puntosRonda} esta ronda</span>
                <span className={`chip tabular-nums font-mono ${restante <= 10 && !parado ? 'chip-rosa animate-pulse' : ''}`}>
                  <Icono nombre="clock" size={12} />{reloj}
                </span>
              </div>
            </div>
            <div key={pais!.codigo} className="text-[110px] sm:text-[140px] leading-none pop" role="img" aria-label="Bandera misteriosa">
              {emojiDe(pais!.codigo)}
            </div>

            {resultado === null ? (
              <form className="w-full max-w-[440px] flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); comprobar(); }}>
                <input
                  ref={inputRef} value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
                  className="campo w-full text-center" placeholder="¿Qué país es?"
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-label="Nombre del país"
                />
                <div className="flex gap-2">
                  <Boton type="submit" icono="check" className="flex-1" disabled={respuesta.trim() === ''}>Comprobar</Boton>
                  <Boton variante="glass" onClick={noLoSe}>No lo sé</Boton>
                </div>
              </form>
            ) : (
              <div className="w-full max-w-[440px] flex flex-col items-center gap-3 pop">
                {resultado === 'tiempo' ? (
                  <span className="chip chip-rosa text-[14px]"><Icono nombre="clock" size={14} />¡Tiempo! Era <b className="font-bold">&nbsp;{pais!.nombre}</b></span>
                ) : resultado === 'mal' ? (
                  <span className="chip chip-rosa text-[14px]"><Icono nombre="x" size={14} />Era <b className="font-bold">&nbsp;{pais!.nombre}</b></span>
                ) : (
                  <>
                    <span className="chip chip-verde text-[14px]">
                      <Icono nombre="check" size={14} />
                      {resultado === 'con-tilde' ? '¡+3! Con su tilde y todo' : llevaTilde(pais!.nombre) ? `¡+2! Es ${pais!.nombre}: te llevas 2, con la tilde habrían sido 3` : '¡+2! Muy bien'}
                    </span>
                    {nueva && <span className="chip chip-azul text-[13px] tabular-nums"><Icono nombre="spark" size={13} />¡País nuevo! Ya llevas {totalAdivinadas}</span>}
                  </>
                )}
                <Boton icono="chev" onClick={pasar}>{idx + 1 === POR_RONDA ? 'Ver resumen' : 'Siguiente'}</Boton>
              </div>
            )}
          </>
        )}
      </section>

      <section className="glass rounded-[26px] p-4 sm:p-5 flex flex-col gap-3 in d3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-[16px] font-bold tracking-tight">Logros de banderas</h2>
          <span className="chip tabular-nums"><Icono nombre="medal" size={13} />{totalAdivinadas} de {PAISES.length} países</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {HITOS_BANDERAS.map((h) => {
            const ok = totalAdivinadas >= h;
            return (
              <span key={h} title={`Adivina ${h} banderas distintas`} className={`chip tabular-nums ${ok ? 'chip-verde' : ''}`}>
                <Icono nombre={ok ? 'medal' : 'lock'} size={13} />{h === PAISES.length ? '¡Todas!' : h}
              </span>
            );
          })}
        </div>
        {hitoSiguiente !== null && (
          <div className="flex flex-col gap-1.5">
            <Barra valor={totalAdivinadas / hitoSiguiente} acento="amarillo" />
            <span className="text-[12.5px] text-tinta-3 tabular-nums">Te faltan {hitoSiguiente - totalAdivinadas} banderas nuevas para la medalla de {hitoSiguiente}.</span>
          </div>
        )}
        <p className="text-[12px] text-tinta-3">Solo cuentan los países adivinados por primera vez: repetir uno da puntos, pero no avanza los logros.</p>
      </section>

      <p className="text-[12.5px] text-tinta-3 text-center tabular-nums">
        Los puntos van a tu cuenta en el momento de acertar (llevas <b className="font-semibold text-tinta-2">{perfil.puntos_total.toLocaleString('es-ES')}</b>).
        Este juego es aparte: la racha del reto diario no depende de él.
      </p>
      </main>
    </div>
  );
}
