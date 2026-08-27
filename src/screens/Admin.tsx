import { useEffect, useMemo, useState } from 'react';
import { FASE_INFO, ORDEN_FASES, type Acento } from '../config';
import type { EjercicioDB, Profile, Session } from '../types';
import { cargarTodasLasCuentas, reintentar } from '../lib/api';
import { mesDe, mesVecino, nombreDia, type Mes } from '../lib/calendario';
import { hoyMadrid } from '../lib/semana';
import { esCorrecta } from '../lib/correccion';
import {
  cuentasDelDia, porOperacion, porPeriodo, puntosDebiles, resumenGeneral, tiempos, type Datos, type Granularidad, type Grupo,
} from '../lib/estadisticas';
import { paleta, usePrefiereOscuro } from '../lib/paletaGraficas';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import { Calendario } from '../components/Calendario';
import { Barras, Linea } from '../components/Grafica';
import { Icono, type NombreIcono } from '../components/Icono';
import type { Destino } from '../components/MenuPerfil';

interface Props {
  perfil: Profile;
  sesiones: Session[];
  onIr: (destino: Destino) => void;
  onBloquear: () => void;
  onSalir?: () => void;
  onAviso: (texto: string) => void;
}

const GRANULARIDADES: { g: Granularidad; texto: string }[] = [
  { g: 'dia', texto: 'Día' }, { g: 'semana', texto: 'Semana' }, { g: 'mes', texto: 'Mes' }, { g: 'anio', texto: 'Año' },
];
const num = (v: number | null, unidad = '') => (v === null ? '—' : `${Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')}${unidad}`);

export function Admin({ perfil, sesiones, onIr, onBloquear, onSalir, onAviso }: Props) {
  const hoy = hoyMadrid();
  const oscuro = usePrefiereOscuro();
  const p = paleta(oscuro);
  const [cuentas, setCuentas] = useState<EjercicioDB[] | null>(null);
  const [granularidad, setGranularidad] = useState<Granularidad>('semana');
  const [mes, setMes] = useState<Mes>(mesDe(hoy));
  const [dia, setDia] = useState<string>(hoy);

  useEffect(() => {
    reintentar(cargarTodasLasCuentas).then(setCuentas).catch((e: Error) => { setCuentas([]); onAviso(`No se pudieron cargar las cuentas: ${e.message}`); });
  }, [onAviso]);

  const datos: Datos = useMemo(() => ({ sesiones, cuentas: cuentas ?? [] }), [sesiones, cuentas]);
  const resumen = useMemo(() => resumenGeneral(datos), [datos]);
  const periodos = useMemo(() => porPeriodo(datos, granularidad), [datos, granularidad]);
  const ops = useMemo(() => porOperacion(datos), [datos]);
  const debiles = useMemo(() => puntosDebiles(datos), [datos]);
  const t = useMemo(() => tiempos(datos), [datos]);
  const delDia = useMemo(() => cuentasDelDia(datos, dia), [datos, dia]);
  const porFecha = useMemo(() => new Map(sesiones.filter((s) => s.estado === 'completada').map((s) => [s.fecha, s])), [sesiones]);

  const cargando = cuentas === null;
  const vacio = !cargando && resumen.retos === 0;
  const colorOp = (op: keyof typeof p.serie) => p.serie[op];
  const corto = (e: string) => e.replace(/^(Tabla del |Entre )/, '').replace('llevadas', 'llev.').replace('préstamos', 'prést.');
  const barrasGrupo = (gs: Grupo[]) => gs.map((g) => ({ etiqueta: g.etiqueta, corto: corto(g.etiqueta), valor: g.porcentaje, detalle: `${g.aciertos} de ${g.cuentas} cuentas` }));

  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-16">
      <Cabecera perfil={perfil} onIr={onIr} onSalir={onSalir} />

      <section className="mt-6 sm:mt-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1 in d1">
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => onIr('inicio')} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
            <Icono nombre="chevLeft" size={16} />Inicio
          </button>
          <h1 className="text-[36px] sm:text-5xl font-bold leading-[1.05] tracking-[-.03em] inline-flex items-center gap-3">
            <span className="tile tile-violeta w-11 h-11 rounded-[14px]"><Icono nombre="lock" size={22} /></span>Modo admin
          </h1>
          <p className="text-tinta-2 text-[17px] text-pretty">Rendimiento de <b className="font-semibold capitalize">{perfil.nombre}</b> en todos sus retos completados. Solo lectura.</p>
        </div>
        <Boton variante="glass" icono="lock" onClick={onBloquear}>Bloquear</Boton>
      </section>

      {cargando && <p className="mt-8 text-tinta-3 font-semibold animate-pulse">Cargando todas las cuentas…</p>}
      {vacio && (
        <div className="glass rounded-[26px] p-6 mt-8 text-tinta-2 in d2">Todavía no hay retos completados. Las estadísticas aparecerán en cuanto termine el primero.</div>
      )}

      {!cargando && !vacio && (
        <>
          <section className="mt-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 in d2">
            <Tarjeta icono="target" acento="azul" valor={String(resumen.retos)} label="Retos completados" />
            <Tarjeta icono="check" acento="verde" valor={num(resumen.porcentaje, ' %')} label={`Aciertos (${resumen.aciertos} de ${resumen.cuentas})`} />
            <Tarjeta icono="x" acento="rojo" valor={String(resumen.fallos)} label="Fallos en total" />
            <Tarjeta icono="medal" acento="amarillo" valor={num(resumen.promedioPorReto)} label="Aciertos por reto (de 20)" />
            <Tarjeta icono="clock" acento="violeta" valor={num(resumen.tiempoMedio, ' s')} label="Tiempo medio por cuenta" />
            <Tarjeta icono="flame" acento="rosa" valor={`${perfil.racha_max} ${perfil.racha_max === 1 ? 'día' : 'días'}`} label={`Mejor racha · ${resumen.puntos.toLocaleString('es-ES')} pts`} />
          </section>

          <Seccion titulo="Por periodo" delay="d3" derecha={
            <div className="flex gap-1 glass-fuerte border border-linea rounded-[14px] p-1" role="tablist" aria-label="Agrupar por">
              {GRANULARIDADES.map((x) => (
                <button key={x.g} type="button" role="tab" aria-selected={granularidad === x.g} onClick={() => setGranularidad(x.g)}
                  className={`px-3 h-9 rounded-[10px] text-sm font-semibold transition ${granularidad === x.g ? 'bg-tinta text-fondo' : 'text-tinta-2 hover:text-tinta'}`}>
                  {x.texto}
                </button>
              ))}
            </div>
          }>
            <Barras titulo={`Porcentaje de aciertos por ${granularidad}`} unidad=" %" max={100}
              datos={[...periodos].reverse().slice(-14).map((x) => ({ etiqueta: x.etiqueta, corto: cortoPeriodo(x.clave, granularidad), valor: x.porcentaje, detalle: `${x.aciertos} de ${x.cuentas} · ${x.retos} ${x.retos === 1 ? 'reto' : 'retos'}` }))} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm mt-2">
                <thead><tr className="text-left text-tinta-3 text-[12px] uppercase tracking-wide">
                  <th className="py-2 pr-3 font-semibold">Periodo</th><th className="py-2 pr-3 font-semibold text-right">Retos</th><th className="py-2 pr-3 font-semibold text-right">Aciertos</th>
                  <th className="py-2 pr-3 font-semibold text-right">Fallos</th><th className="py-2 pr-3 font-semibold text-right">%</th><th className="py-2 pr-3 font-semibold text-right">Tiempo/cuenta</th><th className="py-2 font-semibold text-right">Puntos</th>
                </tr></thead>
                <tbody>
                  {periodos.slice(0, 24).map((x) => (
                    <tr key={x.clave} className="border-t border-linea">
                      <td className="py-2 pr-3 font-semibold">{x.etiqueta}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{x.retos}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{x.aciertos} / {x.cuentas}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{x.fallos}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-semibold">{num(x.porcentaje, ' %')}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{num(x.tiempoMedio, ' s')}</td>
                      <td className="py-2 text-right tabular-nums">{x.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {periodos.length > 24 && <p className="text-xs text-tinta-3 mt-2">Se muestran los 24 periodos más recientes de {periodos.length}.</p>}
            </div>
          </Seccion>

          <Seccion titulo="Puntos débiles" delay="d4">
            <div className="grid md:grid-cols-2 gap-5">
              <Panel titulo="Acierto por operación">
                <Barras titulo="Porcentaje de aciertos por operación" unidad=" %" max={100}
                  datos={ops.map((o) => ({ etiqueta: FASE_INFO[o.op].nombre, corto: FASE_INFO[o.op].simbolo, valor: o.porcentaje, color: colorOp(o.op), detalle: `${o.aciertos} de ${o.cuentas}` }))} />
                <Leyenda items={ORDEN_FASES.map((op) => ({ texto: FASE_INFO[op].nombre, color: colorOp(op) }))} />
              </Panel>
              <Panel titulo="Sumas y restas">
                <Barras titulo="Aciertos en sumas con y sin llevadas y restas con y sin préstamos" unidad=" %" max={100}
                  datos={[...barrasGrupo(debiles.sumas).map((d) => ({ ...d, color: colorOp('suma') })), ...barrasGrupo(debiles.restas).map((d) => ({ ...d, color: colorOp('resta') }))]} />
                <Leyenda items={[{ texto: 'Sumas', color: colorOp('suma') }, { texto: 'Restas', color: colorOp('resta') }]} />
              </Panel>
              <Panel titulo="Multiplicaciones por tabla">
                <Barras titulo="Aciertos por tabla de multiplicar" unidad=" %" max={100} datos={barrasGrupo(debiles.tablas).map((d) => ({ ...d, color: colorOp('mult') }))} />
              </Panel>
              <Panel titulo="Divisiones por divisor">
                <Barras titulo="Aciertos por divisor" unidad=" %" max={100} datos={barrasGrupo(debiles.divisores).map((d) => ({ ...d, color: colorOp('div') }))} />
              </Panel>
            </div>
          </Seccion>

          <Seccion titulo="Tiempo por cuenta" delay="d5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Tarjeta icono="clock" acento="violeta" valor={num(t.general, ' s')} label="Media general" />
              {t.porOperacion.map((x) => <Tarjeta key={x.op} icono="clock" acento={FASE_INFO[x.op].acento} valor={num(x.tiempoMedio, ' s')} label={FASE_INFO[x.op].nombre} />)}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <Panel titulo="Evolución por semana"><Linea titulo="Tiempo medio por cuenta, por semana" unidad=" s" datos={t.porSemana.slice(-12).map((x) => ({ etiqueta: x.etiqueta, corto: cortoPeriodo(x.clave, 'semana'), valor: x.tiempoMedio, detalle: `${x.cuentas} cuentas` }))} /></Panel>
              <Panel titulo="Evolución por mes"><Linea titulo="Tiempo medio por cuenta, por mes" unidad=" s" datos={t.porMes.slice(-12).map((x) => ({ etiqueta: x.etiqueta, corto: cortoPeriodo(x.clave, 'mes'), valor: x.tiempoMedio, detalle: `${x.cuentas} cuentas` }))} /></Panel>
            </div>
          </Seccion>

          <Seccion titulo="Día a día" delay="d6">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
              <Calendario mes={mes} hoy={hoy} seleccion={dia} sesiones={porFecha} conNota={new Set()} onSeleccionar={(f) => { setDia(f); setMes(mesDe(f)); }} onCambiarMes={(d) => setMes((m) => mesVecino(m, d))} />
              <Panel titulo={nombreDia(dia)}>
                {delDia.length === 0 ? <p className="text-sm text-tinta-3">Ese día no hay un reto completado.</p> : (
                  <>
                    <p className="text-sm text-tinta-2 -mt-1">
                      <b className="font-semibold">{delDia.filter(esCorrecta).length}</b> de {delDia.length} bien · {porFecha.get(dia)?.puntos ?? 0} puntos
                    </p>
                    <div className="flex flex-col gap-2">
                      {ORDEN_FASES.map((op) => {
                        const cs = delDia.filter((c) => c.op === op);
                        if (cs.length === 0) return null;
                        const info = FASE_INFO[op];
                        const ok = cs.filter(esCorrecta).length;
                        const todo = ok === cs.length;
                        return (
                          <details key={op} className="glass-fuerte border border-linea rounded-[16px] overflow-hidden group" open={dia === hoy}>
                            <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer list-none select-none">
                              <span className={`tile tile-${info.acento} w-8 h-8 rounded-[10px] text-base font-bold shrink-0`}>{info.simbolo}</span>
                              <span className="font-semibold">{info.nombre}</span>
                              <span className={`chip ml-auto tabular-nums ${todo ? 'chip-verde' : ''}`}>{ok}/{cs.length}</span>
                              <Icono nombre="chev" size={16} className="text-tinta-3 transition-transform group-open:rotate-90" />
                            </summary>
                            <ol className="flex flex-col gap-1.5 px-3 pb-3">
                              {cs.map((c) => {
                                const bien = esCorrecta(c);
                                return (
                                  <li key={c.id} className="rounded-[12px] bg-tinta/[.03] px-3 py-2 flex items-center gap-3 text-[15px]">
                                    <span className={`tile ${bien ? 'tile-verde' : 'tile-rojo'} w-6 h-6 rounded-[8px] shrink-0`}><Icono nombre={bien ? 'check' : 'x'} size={13} /></span>
                                    <span className="font-mono tabular-nums font-semibold whitespace-nowrap">{c.a} {info.simbolo} {c.b} <span className="text-tinta-3">=</span></span>
                                    {bien ? <span className="font-mono tabular-nums font-bold text-verde-2">{c.sol}</span> : (
                                      <span className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono tabular-nums font-bold text-rojo-2 line-through decoration-2">{c.respuesta ?? '—'}</span>
                                        <Icono nombre="arrow" size={14} className="text-tinta-3" />
                                        <span className="font-mono tabular-nums font-bold text-verde-2">{c.sol}</span>
                                      </span>
                                    )}
                                    <span className="ml-auto chip tabular-nums"><Icono nombre="clock" size={12} />{c.segundos === null ? '—' : `${c.segundos.toFixed(1).replace('.', ',')} s`}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          </details>
                        );
                      })}
                    </div>
                  </>
                )}
              </Panel>
            </div>
          </Seccion>
        </>
      )}
    </div>
  );
}

const fmtCortoDia = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtCortoMes = new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' });
function cortoPeriodo(clave: string, g: Granularidad): string {
  const [y, m, d] = clave.split('-').map(Number);
  if (g === 'anio') return clave;
  if (g === 'mes') return fmtCortoMes.format(new Date(Date.UTC(y, m - 1, 1))).replace('.', '');
  return fmtCortoDia.format(new Date(Date.UTC(y, m - 1, d))).replace('.', '');
}

function Seccion({ titulo, delay, derecha, children }: { titulo: string; delay: string; derecha?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={`mt-8 in ${delay}`}>
      <div className="flex items-center justify-between gap-3 px-1 mb-3 flex-wrap">
        <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight">{titulo}</h2>
        {derecha}
      </div>
      <div className="glass rounded-[30px] p-4 sm:p-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[15px] font-semibold text-tinta-2">{titulo}</h3>
      {children}
    </div>
  );
}

function Leyenda({ items }: { items: { texto: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-tinta-3 font-medium">
      {items.map((i) => <li key={i.texto} className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-[3px]" style={{ background: i.color }} />{i.texto}</li>)}
    </ul>
  );
}

function Tarjeta({ icono, acento, valor, label }: { icono: NombreIcono; acento: Acento; valor: string; label: string }) {
  return (
    <div className="glass rounded-[18px] flex items-center gap-2.5 p-3">
      <span className={`tile tile-${acento} w-[34px] h-[34px] rounded-[11px] shrink-0`}><Icono nombre={icono} size={18} /></span>
      <div className="min-w-0">
        <b className="block text-[16px] font-bold tracking-tight leading-none tabular-nums truncate">{valor}</b>
        <small className="text-xs text-tinta-3 leading-tight block">{label}</small>
      </div>
    </div>
  );
}
