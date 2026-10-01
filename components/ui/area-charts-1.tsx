"use client";

// "Area Charts 1" de ReUI (21st.dev) adaptado: tarjetas con mini-gráfico de área y tooltip,
// dibujadas en SVG propio (sin recharts) con la paleta del CRM.
import { MessageCircle, Sparkles, TrendingUp, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import { area, escalar, linea } from "@/lib/svgChart";

const ICONOS = { usuarios: UserPlus, mensajes: MessageCircle, interes: Sparkles, ingresos: TrendingUp };

export type SparkCard = {
  titulo: string;
  periodo: string;
  valor: string;
  datos: { etiqueta: string; valor: number }[];
  color: string;
  icono: keyof typeof ICONOS;
  sufijo?: string;
  cambio?: number | null;
};

function Sparkline({ datos, color, sufijo }: { datos: SparkCard["datos"]; color: string; sufijo?: string }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 240;
  const H = 88;
  const pts = escalar(
    datos.map((d) => d.valor),
    W,
    H,
  );
  return (
    <div className="relative h-24 w-full max-w-60">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.round(((e.clientX - r.left) / r.width) * (datos.length - 1));
          setHover(Math.max(0, Math.min(datos.length - 1, i)));
        }}
      >
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={area(pts, H)} fill={`url(#g${id})`} />
        <path d={linea(pts)} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {hover != null && pts[hover] && (
          <>
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={H} stroke={color} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {hover != null && datos[hover] && (
        <div className="pointer-events-none absolute -top-9 right-0 rounded-md border border-[var(--line)] bg-black/95 px-2 py-1 text-[11px] whitespace-nowrap">
          <span className="text-[var(--muted)]">{datos[hover].etiqueta}</span> <b className="mono">{datos[hover].valor}{sufijo ?? ""}</b>
        </div>
      )}
    </div>
  );
}

export default function AreaChart1({ tarjetas }: { tarjetas: SparkCard[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {tarjetas.map((card) => {
        const Icon = ICONOS[card.icono];
        return (
          <div key={card.titulo} className="card space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg border border-[var(--line)]">
                  <Icon className="size-4" style={{ color: card.color }} />
                </span>
                <span className="font-medium">{card.titulo}</span>
              </div>
              {card.cambio != null && (
                <span className={`mono rounded px-1.5 py-0.5 text-[11px] ${card.cambio >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                  {card.cambio >= 0 ? "+" : ""}
                  {card.cambio}%
                </span>
              )}
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="mono text-[10px] uppercase tracking-widest text-[var(--muted)] whitespace-nowrap">{card.periodo}</div>
                <div className="mono text-5xl font-medium tracking-tight">{card.valor}</div>
              </div>
              {card.datos.some((d) => d.valor > 0) ? (
                <Sparkline datos={card.datos} color={card.color} sufijo={card.sufijo} />
              ) : (
                <div className="grid h-24 w-full max-w-60 place-items-center rounded-lg border border-dashed border-white/[0.06]">
                  <span className="mono text-[10px] uppercase tracking-widest text-white/25">Sin actividad aún</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
