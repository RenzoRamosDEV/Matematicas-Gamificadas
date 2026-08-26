import type { ReactNode } from 'react';
import { CONFIG, FASE_INFO, ORDEN_FASES, type Acento } from '../config';
import type { Op, Profile, Session } from '../types';
import { evaluarLogros } from '../lib/logros';
import { hoyMadrid, puntosSemana, semanaActual } from '../lib/semana';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import { Icono, type NombreIcono } from '../components/Icono';
import { Mascota } from '../components/Mascota';

export type EstadoReto = 'nuevo' | 'en_curso' | 'completado';

interface Props {
  perfil: Profile;
  sesiones: Session[];
  fasesHechas: Op[];
  estadoReto: EstadoReto;
  puntosHoy: number;
  onEmpezar: () => void;
  onVerResultado: () => void;
  onVerLogros: () => void;
  onVerProgreso: () => void;
  cargando: boolean;
  onSalir?: () => void;
}

export function Inicio({ perfil, sesiones, fasesHechas, estadoReto, puntosHoy, onEmpezar, onVerResultado, onVerLogros, onVerProgreso, cargando, onSalir }: Props) {
  const nombre = perfil.nombre.charAt(0).toUpperCase() + perfil.nombre.slice(1);
  const completado = estadoReto === 'completado';

  // Mi progreso: puntos por día de esta semana (Europe/Madrid, como las RPCs)
  const dias = semanaActual(sesiones, hoyMadrid());
  const totalSemana = puntosSemana(dias);
  const maxPuntos = Math.max(1, ...dias.map((d) => d.puntos));

  // Mis logros: medallas derivadas del perfil y del historial
  const logros = evaluarLogros({ perfil, sesiones });
  const conseguidos = logros.filter((l) => l.conseguido).length;
  // En la tarjeta caben 7 + el contador: primero las conseguidas, luego las siguientes pendientes
  const muestra = [...logros.filter((l) => l.conseguido), ...logros.filter((l) => !l.conseguido)].slice(0, 7);

  // Mis retos: fases terminadas hoy (el jugador elige el orden)
  const fases = ORDEN_FASES.map((op) => ({ op, hecha: completado || fasesHechas.includes(op) }));
  const hechas = fases.filter((f) => f.hecha).length;
  const minRestantes = Math.round(fases.filter((f) => !f.hecha).reduce((n, f) => n + CONFIG.TIEMPOS[f.op], 0) / 60);

  const accionReto = completado ? onVerResultado : onEmpezar;

  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-12">
      <Cabecera perfil={perfil} onSalir={onSalir} />

      {/* ---- Hero ---- */}
      <section className="mt-6 sm:mt-10 grid lg:grid-cols-[1.1fr_.9fr] gap-5 sm:gap-8 items-center">
        <div className="flex flex-col gap-4 sm:gap-5 px-1 sm:py-6">
          <span className={`chip self-start in d2 ${completado ? 'chip-azul' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${completado ? 'bg-azul-2 shadow-[0_0_0_4px_oklch(0.74_0.13_255_/_.18)]' : 'bg-verde-2 shadow-[0_0_0_4px_oklch(0.76_0.13_160_/_.18)]'}`} />
            {completado ? 'Reto de hoy completado' : estadoReto === 'en_curso' ? 'Reto de hoy a medias' : 'Reto de hoy disponible'}
          </span>
          <h1 className="text-[40px] sm:text-6xl font-bold leading-[1.02] tracking-[-.035em] text-balance in d2">
            ¡Hola, {nombre}!{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-azul-2 via-violeta-2 to-rosa-2">¿Qué quieres descubrir</span> hoy?
          </h1>
          <p className="text-[17px] sm:text-[19px] text-tinta-2 leading-snug max-w-[46ch] text-pretty in d3">
            Aprende, organiza y descubre cosas nuevas mientras completas pequeños retos.
          </p>
          <div className="flex gap-3 flex-wrap in d4">
            {completado ? (
              <Boton icono="medal" onClick={onVerResultado}>Ver el resultado de hoy</Boton>
            ) : (
              <Boton icono="play" onClick={onEmpezar} disabled={cargando}>
                {cargando ? 'Preparando…' : estadoReto === 'en_curso' ? 'Continuar el reto' : 'Empezar el reto de hoy'}
              </Boton>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2.5 in d5">
            <Stat icono="flame" acento="rosa" valor={`${perfil.racha_actual} ${perfil.racha_actual === 1 ? 'día' : 'días'}`} label="Racha" />
            <Stat icono="star" acento="amarillo" valor={perfil.puntos_total.toLocaleString('es-ES')} label="Puntos" />
            <Stat icono="shield" acento="verde" valor={String(perfil.comodines_disponibles)} label={perfil.comodines_disponibles === 1 ? 'Comodín' : 'Comodines'} />
          </div>
        </div>

        <div className="glass rounded-[40px] relative h-[260px] sm:h-[420px] grid place-items-center overflow-hidden in d3">
          <div className="absolute inset-4 rounded-[24px] pointer-events-none bg-gradient-to-br from-white/35 to-transparent" aria-hidden="true" />
          {/* Órbita: una bolita por fase; se enciende con el color de la operación al completarla hoy */}
          <div className="orbita-fases w-[230px] h-[230px] sm:w-[340px] sm:h-[340px]" aria-label={`${hechas} de 4 fases completadas hoy`} role="img">
            {fases.map((f, i) => (
              <i key={f.op} className={`orbita-punto ${f.hecha ? `tile-${FASE_INFO[f.op].acento} orbita-punto-on` : ''}`} style={{ '--i': i } as React.CSSProperties} title={`${FASE_INFO[f.op].nombre}: ${f.hecha ? 'hecha' : 'pendiente'}`} />
            ))}
          </div>
          <Mascota size={200} className="scale-[.72] sm:scale-100" />
          <div className="glass flota absolute top-4 right-4 sm:top-10 sm:right-10 rounded-[14px] flex items-center gap-2 pl-2 pr-3 py-2 text-[12.5px] font-semibold tabular-nums" style={{ animationDelay: '-2s' }}>
            <span className={`tile ${completado ? 'tile-verde' : 'tile-amarillo'} w-6 h-6 rounded-[8px]`}><Icono nombre={completado ? 'check' : 'star'} size={14} /></span>
            {completado ? `+${puntosHoy} puntos hoy` : hechas > 0 ? `${hechas} de 4 fases hoy` : '+10 por acierto'}
          </div>
          {perfil.comodines_disponibles > 0 && (
            <div className="glass flota absolute bottom-4 left-4 sm:bottom-10 sm:left-10 rounded-[14px] flex items-center gap-2 pl-2 pr-3 py-2 text-[12.5px] font-semibold" style={{ animationDelay: '-4s' }}>
              <span className="tile tile-verde w-6 h-6 rounded-[8px]"><Icono nombre="shield" size={14} /></span>Comodín listo
            </div>
          )}
        </div>
      </section>

      {/* ---- Módulos ---- */}
      <div className="flex items-baseline justify-between mt-10 sm:mt-14 mb-4 px-1 in d4">
        <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight">¿Por dónde empezamos?</h2>
      </div>
      <section className="grid md:grid-cols-3 gap-3.5 sm:gap-5">
        <Tarjeta
          acento="azul" icono="target" titulo="Mis retos" delay="d5" onClick={accionReto}
          texto={completado
            ? `Sumas, restas, multiplicaciones y divisiones. ${CONFIG.EJERCICIOS_POR_FASE} cuentas por fase.`
            : `Cuatro fases de ${CONFIG.EJERCICIOS_POR_FASE} cuentas. Tú eliges el orden.`}
          chip={<span className="chip"><Icono nombre={completado ? 'check' : 'chev'} size={13} />{completado ? 'Hecho' : estadoReto === 'en_curso' ? 'Continuar' : 'Empezar'}</span>}
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[12.5px] text-tinta-3">
              <b className="text-tinta-2 font-semibold">
                {completado ? `+${puntosHoy} puntos hoy` : estadoReto === 'en_curso' ? `${hechas} de 4 fases hechas` : '¿Con cuál empiezas?'}
              </b>
              <span>{completado ? 'Completado' : `~${minRestantes} min`}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {fases.map((f) => <i key={f.op} className={`h-1.5 rounded-[3px] ${f.hecha ? 'fill-azul' : 'bg-tinta/7'}`} />)}
            </div>
          </div>
        </Tarjeta>

        <Tarjeta
          acento="verde" icono="chart" titulo="Mi progreso" delay="d6" onClick={onVerProgreso}
          texto="Tu calendario de retos y tus apuntes de cada día."
          chip={<span className={`chip ${totalSemana > 0 ? 'chip-verde' : ''}`}>{totalSemana > 0 ? `+${totalSemana} esta semana` : 'Empieza hoy'}<Icono nombre="chev" size={13} /></span>}
        >
          <div>
            <div className="flex items-end justify-between gap-2 h-11 px-0.5">
              {dias.map((d) => (
                <div key={d.fecha} className="flex-1 h-full flex items-end justify-center" title={`${d.fecha}: ${d.puntos} puntos`}>
                  <i
                    className={`w-full max-w-[14px] rounded-[7px] ${d.esHoy && d.puntos > 0 ? 'fill-azul shadow-[0_0_12px_-2px_var(--color-azul-2)]' : d.puntos > 0 ? 'fill-verde' : 'bg-tinta/7'}`}
                    style={{ height: `${d.puntos > 0 ? Math.max(22, (d.puntos / maxPuntos) * 100) : 18}%`, opacity: d.futuro ? 0.45 : 1 }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-tinta-3 font-semibold px-0.5 mt-1.5">
              {dias.map((d) => <span key={d.fecha} className={`flex-1 text-center ${d.esHoy ? 'text-azul-2' : ''}`}>{d.etiqueta}</span>)}
            </div>
          </div>
        </Tarjeta>

        <Tarjeta
          acento="violeta" icono="medal" titulo="Mis logros" delay="d7" onClick={onVerLogros}
          texto="Medallas por retos, rachas, aciertos y velocidad."
          chip={<span className="chip">{conseguidos} de {logros.length}<Icono nombre="chev" size={13} /></span>}
        >
          <div className="flex gap-1.5 flex-wrap">
            {muestra.map((l) => (
              <span key={l.id} title={`${l.nombre}: ${l.descripcion}`} className={`tile redondo ${l.conseguido ? `tile-${l.acento}` : 'tile-gris'} w-[30px] h-[30px]`}>
                <Icono nombre={l.icono} size={16} />
              </span>
            ))}
            {logros.length > muestra.length && (
              <span className="tile redondo tile-gris w-[30px] h-[30px] text-[11px] font-bold">+{logros.length - muestra.length}</span>
            )}
          </div>
        </Tarjeta>
      </section>
    </div>
  );
}

function Stat({ icono, acento, valor, label }: { icono: NombreIcono; acento: Acento; valor: string; label: string }) {
  return (
    <div className="glass rounded-[18px] flex items-center gap-2.5 p-2.5 sm:p-3.5">
      <span className={`tile tile-${acento} w-[34px] h-[34px] rounded-[11px] shrink-0`}><Icono nombre={icono} size={18} /></span>
      <div className="min-w-0">
        <b className="block text-[15px] sm:text-[17px] font-bold tracking-tight leading-none tabular-nums truncate">{valor}</b>
        <small className="text-xs text-tinta-3">{label}</small>
      </div>
    </div>
  );
}

function Tarjeta({ acento, icono, titulo, texto, chip, delay, onClick, children }: {
  acento: Acento; icono: NombreIcono; titulo: string; texto: string; chip?: ReactNode; delay: string; onClick?: () => void; children?: ReactNode;
}) {
  const interactiva = Boolean(onClick);
  return (
    <article
      className={`glass glass-raise rounded-[30px] p-5 sm:p-6 flex flex-col gap-3.5 in ${delay} ${interactiva ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={interactiva ? 'button' : undefined}
      tabIndex={interactiva ? 0 : undefined}
      onKeyDown={interactiva ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`tile tile-${acento} w-[52px] h-[52px] sm:w-[58px] sm:h-[58px]`}><Icono nombre={icono} size={26} /></div>
        {chip}
      </div>
      <div className="flex-1">
        <h3 className="text-[18px] sm:text-[19px] font-bold tracking-tight">{titulo}</h3>
        <p className="text-[14.5px] text-tinta-2 leading-snug mt-1 text-pretty">{texto}</p>
      </div>
      {children}
    </article>
  );
}
