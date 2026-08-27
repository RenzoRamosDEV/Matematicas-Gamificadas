import { useEffect, useMemo, useState } from 'react';
import { FASE_INFO, type Acento } from '../config';
import type { Nota, Profile, Session } from '../types';
import { borrarNota, cargarEjercicios, cargarNotas, crearNota, reintentar } from '../lib/api';
import type { EjercicioDB } from '../types';
import { Correccion } from '../components/Correccion';
import { mesDe, mesVecino, nombreDia, type Mes } from '../lib/calendario';
import { hoyMadrid } from '../lib/semana';
import { Boton } from '../components/Boton';
import { Cabecera } from '../components/Cabecera';
import type { Destino } from '../components/MenuPerfil';
import { Calendario } from '../components/Calendario';
import { Icono, type NombreIcono } from '../components/Icono';

interface Props {
  perfil: Profile;
  sesiones: Session[];
  onVolver: () => void;
  onSalir?: () => void;
  onAviso: (texto: string) => void;
  onIr: (destino: Destino) => void;
}

const MAX_NOTA = 500;
const fmtHora = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });

/** Página de progreso: calendario con los retos completados y los apuntes del jugador (varios por día). */
export function Progreso({ perfil, sesiones, onVolver, onSalir, onAviso, onIr }: Props) {
  const hoy = hoyMadrid();
  const [mes, setMes] = useState<Mes>(mesDe(hoy));
  const [seleccion, setSeleccion] = useState(hoy);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [borradores, setBorradores] = useState<Record<string, string>>({});   // apunte en edición por fecha
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<Record<string, EjercicioDB[] | 'cargando'>>({});   // por id de sesión

  const porFecha = useMemo(() => new Map(sesiones.filter((s) => s.estado === 'completada').map((s) => [s.fecha, s])), [sesiones]);
  const completadas = porFecha.size;
  const delMes = [...porFecha.values()].filter((s) => s.fecha.startsWith(mes));

  useEffect(() => {
    reintentar(cargarNotas).then(setNotas).catch((e: Error) => onAviso(`Apuntes no disponibles: ${e.message}`));
  }, [onAviso]);

  const seleccionar = (fecha: string) => { setSeleccion(fecha); setMes(mesDe(fecha)); };

  const delDia = notas.filter((n) => n.fecha === seleccion);
  const conNota = useMemo(() => new Set(notas.map((n) => n.fecha)), [notas]);
  const borrador = borradores[seleccion] ?? '';
  const setBorrador = (t: string) => setBorradores((b) => ({ ...b, [seleccion]: t }));

  const anadir = async () => {
    const texto = borrador.trim();
    if (!texto) return;
    setGuardando(true);
    try {
      const n = await crearNota(seleccion, texto);
      setNotas((lista) => [...lista, n]);
      setBorrador('');
    } catch (e) {
      onAviso(`No se pudo guardar el apunte: ${(e as Error).message}`);
    } finally { setGuardando(false); }
  };

  const borrar = async (id: string) => {
    setBorrando(id);
    try {
      await borrarNota(id);
      setNotas((lista) => lista.filter((n) => n.id !== id));
    } catch (e) {
      onAviso(`No se pudo borrar el apunte: ${(e as Error).message}`);
    } finally { setBorrando(null); }
  };

  const sesion = porFecha.get(seleccion);
  const futuro = seleccion > hoy;
  const cuentasDelDia = sesion ? cuentas[sesion.id] : undefined;
  const verCuentas = async () => {
    if (!sesion || cuentasDelDia) return;
    setCuentas((c) => ({ ...c, [sesion.id]: 'cargando' }));
    try { const lista = await cargarEjercicios(sesion.id); setCuentas((c) => ({ ...c, [sesion.id]: lista })); }
    catch (e) { setCuentas((c) => { const n = { ...c }; delete n[sesion.id]; return n; }); onAviso(`No se pudieron cargar las cuentas: ${(e as Error).message}`); }
  };

  return (
    <div className="min-h-dvh max-w-[1200px] mx-auto px-4 sm:px-12 pb-12">
      <Cabecera perfil={perfil} onIr={onIr} onSalir={onSalir} />

      <section className="mt-6 sm:mt-10 flex flex-col gap-2 px-1 in d1">
        <button type="button" onClick={onVolver} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
          <Icono nombre="chevLeft" size={16} />Inicio
        </button>
        <h1 className="text-[36px] sm:text-5xl font-bold leading-[1.05] tracking-[-.03em]">Mi progreso</h1>
        <p className="text-tinta-2 text-[17px] text-pretty">Tus retos día a día. Toca un día para ver cómo fue y dejar tus apuntes.</p>
      </section>

      <section className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 in d2">
        <Stat icono="star" acento="amarillo" valor={perfil.puntos_total.toLocaleString('es-ES')} label="Puntos en total" />
        <Stat icono="flame" acento="rosa" valor={`${perfil.racha_actual} ${perfil.racha_actual === 1 ? 'día' : 'días'}`} label="Racha actual" />
        <Stat icono="trophy" acento="violeta" valor={`${perfil.racha_max} ${perfil.racha_max === 1 ? 'día' : 'días'}`} label="Mejor racha" />
        <Stat icono="target" acento="azul" valor={String(completadas)} label={completadas === 1 ? 'Reto completado' : 'Retos completados'} />
      </section>

      <section className="mt-6 grid lg:grid-cols-[1.15fr_.85fr] gap-4 sm:gap-6 items-start">
        <div className="flex flex-col gap-3 in d3">
          <Calendario
            mes={mes} hoy={hoy} seleccion={seleccion} sesiones={porFecha}
            conNota={conNota} onSeleccionar={seleccionar} onCambiarMes={(d) => setMes((m) => mesVecino(m, d))}
          />
          <p className="text-[13px] text-tinta-3 px-1">
            Este mes: <b className="text-tinta-2 font-semibold">{delMes.length}</b> {delMes.length === 1 ? 'reto' : 'retos'} y{' '}
            <b className="text-tinta-2 font-semibold">{delMes.reduce((n, s) => n + s.puntos, 0)}</b> puntos.
          </p>
        </div>

        <aside className="glass rounded-[30px] p-5 sm:p-6 flex flex-col gap-4 in d4 lg:sticky lg:top-24">
          <div>
            <div className="text-[12px] font-semibold text-tinta-3 uppercase tracking-wide">{seleccion === hoy ? 'Hoy' : futuro ? 'Próximamente' : 'Ese día'}</div>
            <h2 className="text-[20px] sm:text-[22px] font-bold tracking-tight">{nombreDia(seleccion)}</h2>
          </div>

          {sesion ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="tile tile-verde w-10 h-10 rounded-[13px]"><Icono nombre="check" size={20} /></span>
                <div><b className="block text-[17px] font-bold tabular-nums leading-none">+{sesion.puntos} puntos</b><small className="text-xs text-tinta-3">Reto completado</small></div>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {(sesion.detalle ?? []).map((f) => (
                  <li key={f.op} className="glass-fuerte border border-linea rounded-[14px] px-3 py-2 flex items-center gap-2">
                    <span className={`tile tile-${FASE_INFO[f.op].acento} w-7 h-7 rounded-[9px] text-sm font-bold`}>{FASE_INFO[f.op].simbolo}</span>
                    <span className="text-sm font-semibold tabular-nums">{f.aciertos}/{f.total}</span>
                    {f.bonus_perfecta > 0 && <Icono nombre="medal" size={14} className="text-amarillo-2 ml-auto" />}
                  </li>
                ))}
              </ul>
              <h3 className="text-sm font-semibold text-tinta-2 inline-flex items-center gap-1.5 mt-1"><Icono nombre="target" size={14} />Tus cuentas de ese día</h3>
              {cuentasDelDia === undefined && (
                <button type="button" onClick={verCuentas} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-tinta-2 hover:text-tinta transition">
                  Ver qué pusiste y la respuesta correcta<Icono nombre="chev" size={14} />
                </button>
              )}
              {cuentasDelDia === 'cargando' && <p className="text-sm text-tinta-3 animate-pulse">Cargando cuentas…</p>}
              {Array.isArray(cuentasDelDia) && <Correccion ejercicios={cuentasDelDia} />}
            </div>
          ) : (
            <p className="text-tinta-2 text-sm">
              {futuro ? 'Todavía no ha llegado. Puedes dejar apuntes para ese día.' : seleccion === hoy ? 'El reto de hoy todavía no está completado.' : 'Ese día no completaste el reto.'}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t border-linea pt-4">
            <h3 className="text-sm font-semibold text-tinta-2 inline-flex items-center gap-1.5">
              <Icono nombre="pencil" size={15} />Mis apuntes
              {delDia.length > 0 && <span className="chip ml-1 tabular-nums">{delDia.length}</span>}
            </h3>

            {delDia.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {delDia.map((n) => (
                  <li key={n.id} className="glass-fuerte border border-linea rounded-[16px] px-3.5 py-2.5 flex items-start gap-3 pop">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words">{n.texto}</p>
                      <time className="text-[11px] text-tinta-3 tabular-nums" dateTime={n.created_at}>{fmtHora.format(new Date(n.created_at))}</time>
                    </div>
                    <button
                      type="button" onClick={() => borrar(n.id)} disabled={borrando === n.id} aria-label="Borrar apunte" title="Borrar apunte"
                      className="w-8 h-8 rounded-[10px] grid place-items-center text-tinta-3 hover:text-rosa-2 hover:bg-tinta/5 active:scale-95 transition shrink-0 disabled:opacity-40"
                    >
                      <Icono nombre="x" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-tinta-3">Todavía no hay apuntes en este día.</p>
            )}

            <div className="flex flex-col gap-2">
              <textarea
                id="apunte" value={borrador} maxLength={MAX_NOTA} rows={2}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') void anadir(); }}
                placeholder="Escribe un apunte para este día…"
                className="campo h-auto py-3 resize-none leading-snug text-[15px]"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-tinta-3 tabular-nums">{borrador.length} / {MAX_NOTA}</span>
                <Boton className="h-11 px-5 text-sm" icono="plus" onClick={anadir} disabled={!borrador.trim() || guardando}>
                  {guardando ? 'Guardando…' : 'Añadir apunte'}
                </Boton>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Stat({ icono, acento, valor, label }: { icono: NombreIcono; acento: Acento; valor: string; label: string }) {
  return (
    <div className="glass rounded-[18px] flex items-center gap-2.5 p-3">
      <span className={`tile tile-${acento} w-[34px] h-[34px] rounded-[11px] shrink-0`}><Icono nombre={icono} size={18} /></span>
      <div className="min-w-0">
        <b className="block text-[16px] font-bold tracking-tight leading-none tabular-nums truncate">{valor}</b>
        <small className="text-xs text-tinta-3">{label}</small>
      </div>
    </div>
  );
}
