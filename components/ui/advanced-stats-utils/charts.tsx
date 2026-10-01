"use client";

// Gráfico de área "recortado": a la izquierda del cursor se ve a color y a la derecha atenuado.
import { useId, useState } from "react";
import { area, escalar, linea } from "@/lib/svgChart";

export type SerieDia = { etiqueta: string; nuevos: number; toques: number };

export function ClippedAreaChart({ datos, titulo, total, detalle }: { datos: SerieDia[]; titulo: string; total: string; detalle: string }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 300;
  const max = Math.max(1, ...datos.map((d) => Math.max(d.nuevos, d.toques)));
  const pToques = escalar(datos.map((d) => d.toques), W, H, 8, max);
  const pNuevos = escalar(datos.map((d) => d.nuevos), W, H, 8, max);
  const corte = hover != null && pNuevos[hover] ? pNuevos[hover][0] : W;
  const d = hover != null ? datos[hover] : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{titulo}</p>
          <p className="mono text-5xl font-medium tracking-tight">{d ? d.nuevos : total}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{d ? `${d.etiqueta} · ${d.toques} toques` : detalle}</p>
        </div>
        <div className="flex gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-[var(--accent)]" /> Contactos nuevos</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-white/70" /> Toques</span>
        </div>
      </div>
      <div className="relative flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-80 w-full"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left) / r.width) * (datos.length - 1));
            setHover(Math.max(0, Math.min(datos.length - 1, i)));
          }}
        >
          <defs>
            <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
            <clipPath id={`c${id}`}>
              <rect x={0} y={0} width={corte} height={H} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--line)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
          ))}
          {/* Capa atenuada (fondo) */}
          <g opacity={0.25}>
            <path d={area(pToques, H)} fill={`url(#b${id})`} />
            <path d={linea(pToques)} fill="none" stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <path d={area(pNuevos, H)} fill={`url(#a${id})`} />
            <path d={linea(pNuevos)} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
          {/* Capa viva, recortada hasta el cursor */}
          <g clipPath={`url(#c${id})`}>
            <path d={area(pToques, H)} fill={`url(#b${id})`} />
            <path d={linea(pToques)} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <path d={area(pNuevos, H)} fill={`url(#a${id})`} />
            <path d={linea(pNuevos)} fill="none" stroke="var(--accent)" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </g>
          {hover != null && pNuevos[hover] && (
            <line x1={corte} x2={corte} y1={0} y2={H} stroke="var(--accent)" strokeOpacity={0.6} vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {!datos.some((x) => x.nuevos > 0 || x.toques > 0) && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="rounded-lg border border-[var(--line)] bg-black/80 px-4 py-3 text-center">
              <p className="text-sm">Aún no hay contactos registrados</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">Envía mensajes desde Hoy o Flujo de contacto y el gráfico se irá llenando.</p>
            </div>
          </div>
        )}
        <div className="mono mt-2 flex justify-between text-[10px] uppercase tracking-wider text-[var(--muted)]">
          <span>{datos[0]?.etiqueta}</span>
          <span>{datos[Math.floor(datos.length / 2)]?.etiqueta}</span>
          <span>{datos[datos.length - 1]?.etiqueta}</span>
        </div>
      </div>
    </div>
  );
}
