"use client";

// "Advanced Stats" de 21st.dev adaptado al CRM (oscuro, morado Neoesis y datos reales).
import { Users } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ClippedAreaChart, type SerieDia } from "@/components/ui/advanced-stats-utils/charts";
import { TimelineAnimation } from "@/components/ui/advanced-stats-utils/timeline-animation";

export type KpiStat = { label: string; value: string; change?: string; status?: "up" | "down" | "flat" };

export default function AdvancedStats({
  serie,
  totalSerie,
  detalleSerie,
  objetivo,
  destacado,
  kpis,
}: {
  serie: SerieDia[];
  totalSerie: string;
  detalleSerie: string;
  objetivo: { etiqueta: string; titulo: string; valor: number; meta: number };
  destacado: { titulo: string; texto: string; resaltado: string };
  kpis: KpiStat[];
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const pct = objetivo.meta ? Math.min(100, Math.round((objetivo.valor / objetivo.meta) * 100)) : 0;

  return (
    <section ref={timelineRef} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TimelineAnimation animationNum={1} timelineRef={timelineRef} className="card p-6 lg:col-span-2">
          <ClippedAreaChart datos={serie} titulo="Contactos nuevos · 30 días" total={totalSerie} detalle={detalleSerie} />
        </TimelineAnimation>

        <div className="flex flex-col gap-4">
          <TimelineAnimation
            animationNum={2}
            timelineRef={timelineRef}
            className="flex h-full flex-col justify-between rounded-xl border border-[var(--accent)]/40 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(157,116,255,.18),transparent_60%)] p-6"
          >
            <div>
              <p className="label">{objetivo.etiqueta}</p>
              <h4 className="text-xl font-medium tracking-tight">{objetivo.titulo}</h4>
            </div>
            <div className="mt-8">
              <div className="mb-2 flex items-end justify-between">
                <span className="mono text-3xl font-medium tracking-tighter">{pct}%</span>
                <span className="mono mb-1 text-[11px] text-[var(--muted)]">
                  {objetivo.valor.toLocaleString("es-PE")} / {objetivo.meta.toLocaleString("es-PE")}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </TimelineAnimation>

          <TimelineAnimation animationNum={3} timelineRef={timelineRef} className="card h-full p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid size-8 place-items-center rounded-lg border border-[var(--line)] text-[var(--accent)]">
                <Users className="size-4" strokeWidth={1.8} />
              </div>
              <h4 className="font-medium">{destacado.titulo}</h4>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {destacado.texto} <span className="font-medium text-white">{destacado.resaltado}</span>
            </p>
          </TimelineAnimation>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi, index) => (
          <TimelineAnimation
            animationNum={4 + index}
            timelineRef={timelineRef}
            key={kpi.label}
            className={cn(
              "card p-5 transition-colors",
              kpi.status === "up" && "hover:border-emerald-500/50 hover:bg-emerald-500/[0.04]",
              kpi.status === "down" && "hover:border-rose-500/50 hover:bg-rose-500/[0.04]",
              (!kpi.status || kpi.status === "flat") && "hover:border-[var(--accent)]/50",
            )}
          >
            <p className="label">{kpi.label}</p>
            <div className="flex items-baseline justify-between gap-2">
              <p className="mono text-2xl font-medium tracking-tight">{kpi.value}</p>
              {kpi.change && (
                <span
                  className={cn(
                    "mono rounded px-1.5 py-0.5 text-[11px]",
                    kpi.status === "up" && "bg-emerald-500/10 text-emerald-400",
                    kpi.status === "down" && "bg-rose-500/10 text-rose-400",
                    (!kpi.status || kpi.status === "flat") && "bg-white/5 text-[var(--muted)]",
                  )}
                >
                  {kpi.change}
                </span>
              )}
            </div>
          </TimelineAnimation>
        ))}
      </div>
    </section>
  );
}
