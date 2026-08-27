import { useEffect, useRef, useState } from 'react';
import { paleta, usePrefiereOscuro } from '../lib/paletaGraficas';

function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const medir = () => setAncho(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ancho };
}

export interface DatoBarra { etiqueta: string; corto?: string; valor: number | null; color?: string; detalle?: string }

interface PropsBarras {
  datos: DatoBarra[];
  max?: number;
  unidad?: string;
  titulo: string;
  alto?: number;
}

const fmt = (v: number | null, unidad: string) => (v === null ? '—' : `${Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')}${unidad}`);

export function Barras({ datos, max, unidad = '', titulo, alto = 170 }: PropsBarras) {
  const p = paleta(usePrefiereOscuro());
  const { ref, ancho: disponible } = useAncho<HTMLElement>();
  const n = Math.max(datos.length, 1);
  const maxChars = Math.max(1, ...datos.map((d) => (d.corto ?? d.etiqueta).length));
  const slotMin = Math.max(44, Math.round(maxChars * 7.2) + 12);
  const slot = Math.max(slotMin, Math.floor((disponible || 600) / n)), ancho = n * slot, margen = { arriba: 22, abajo: 34, izq: 4 };
  const techo = max ?? Math.max(1, ...datos.map((d) => d.valor ?? 0)) * 1.15;
  const hPlot = alto - margen.arriba - margen.abajo;
  const y = (v: number) => margen.arriba + hPlot - (Math.min(v, techo) / techo) * hPlot;
  const barW = Math.min(64, Math.round(slot * 0.56));
  const etiquetasDirectas = n <= 8;
  const pasos = [0.25, 0.5, 0.75, 1];

  if (datos.length === 0) return <p className="text-sm text-tinta-3">Sin datos todavía.</p>;

  return (
    <figure ref={ref} className="m-0 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} role="img" aria-label={titulo} style={{ display: 'block', fontFamily: 'inherit' }}>
        <title>{titulo}</title>
        {pasos.map((f) => (
          <line key={f} x1={margen.izq} x2={ancho} y1={y(techo * f)} y2={y(techo * f)} stroke={p.rejilla} strokeWidth={1} />
        ))}
        <line x1={margen.izq} x2={ancho} y1={y(0)} y2={y(0)} stroke={p.eje} strokeWidth={1} />
        {datos.map((d, i) => {
          const cx = i * slot + slot / 2;
          const v = d.valor ?? 0;
          const top = y(v), base = y(0), h = Math.max(0, base - top);
          const r = Math.min(4, h);
          const x0 = cx - barW / 2;
          const color = d.color ?? p.base;
          const path = h > 0
            ? `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`
            : '';
          return (
            <g key={d.etiqueta + i}>
              <title>{`${d.etiqueta}: ${fmt(d.valor, unidad)}${d.detalle ? ` · ${d.detalle}` : ''}`}</title>
              <rect x={i * slot} y={margen.arriba} width={slot} height={hPlot} fill="transparent" />
              {path && <path d={path} fill={color} />}
              {d.valor === null && <line x1={x0} x2={x0 + barW} y1={base} y2={base} stroke={p.suave} strokeWidth={2} strokeDasharray="3 3" />}
              {etiquetasDirectas && (
                <text x={cx} y={top - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={p.texto}>{fmt(d.valor, unidad)}</text>
              )}
              <text x={cx} y={alto - 12} textAnchor="middle" fontSize={11} fill={p.suave}>{d.corto ?? d.etiqueta}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export interface PuntoLinea { etiqueta: string; corto?: string; valor: number | null; detalle?: string }

interface PropsLinea { datos: PuntoLinea[]; unidad?: string; titulo: string; alto?: number }

export function Linea({ datos, unidad = '', titulo, alto = 170 }: PropsLinea) {
  const p = paleta(usePrefiereOscuro());
  const { ref, ancho: disponible } = useAncho<HTMLElement>();
  const puntos = datos.filter((d) => d.valor !== null) as (PuntoLinea & { valor: number })[];
  const n = Math.max(datos.length, 1);
  const slot = Math.max(44, Math.floor((disponible || 600) / n)), ancho = n * slot, margen = { arriba: 22, abajo: 34 };
  if (puntos.length === 0) return <p className="text-sm text-tinta-3">Sin datos todavía.</p>;
  const techo = Math.max(1, ...puntos.map((d) => d.valor)) * 1.2;
  const hPlot = alto - margen.arriba - margen.abajo;
  const x = (i: number) => i * slot + slot / 2;
  const y = (v: number) => margen.arriba + hPlot - (v / techo) * hPlot;
  const d = datos.map((pt, i) => (pt.valor === null ? null : `${x(i)},${y(pt.valor)}`)).filter(Boolean).join(' L');
  return (
    <figure ref={ref} className="m-0 w-full overflow-x-auto">
      <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} role="img" aria-label={titulo} style={{ display: 'block', fontFamily: 'inherit' }}>
        <title>{titulo}</title>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={0} x2={ancho} y1={y(techo * f)} y2={y(techo * f)} stroke={p.rejilla} strokeWidth={1} />)}
        <line x1={0} x2={ancho} y1={y(0)} y2={y(0)} stroke={p.eje} strokeWidth={1} />
        <path d={`M${d}`} fill="none" stroke={p.base} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {datos.map((pt, i) => (
          <g key={pt.etiqueta + i}>
            <title>{`${pt.etiqueta}: ${fmt(pt.valor, unidad)}${pt.detalle ? ` · ${pt.detalle}` : ''}`}</title>
            <rect x={i * slot} y={margen.arriba} width={slot} height={hPlot} fill="transparent" />
            {pt.valor !== null && <circle cx={x(i)} cy={y(pt.valor)} r={4} fill={p.base} stroke="var(--color-fondo)" strokeWidth={2} />}
            {(i === n - 1 || n <= 6) && pt.valor !== null && (
              <text x={x(i)} y={y(pt.valor) - 10} textAnchor="middle" fontSize={11} fontWeight={600} fill={p.texto}>{fmt(pt.valor, unidad)}</text>
            )}
            <text x={x(i)} y={alto - 12} textAnchor="middle" fontSize={11} fill={p.suave}>{pt.corto ?? pt.etiqueta}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
