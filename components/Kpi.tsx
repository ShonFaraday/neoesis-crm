"use client";

// Tarjeta de indicador: número animado (NumberFlow, usado en 21st.dev) + luz que sigue al cursor.
import NumberFlow from "@number-flow/react";
import { MessageCircle, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";

// Los íconos se eligen por nombre: un Server Component no puede pasar componentes a un Client Component.
const ICONOS = { usuarios: UserPlus, mensajes: MessageCircle, ingresos: TrendingUp } satisfies Record<string, LucideIcon>;
import type { MouseEvent, ReactNode } from "react";

export function Spot({ className = "", children }: { className?: string; children: ReactNode }) {
  const mover = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div onMouseMove={mover} className={`card spot ${className}`}>
      {children}
    </div>
  );
}

export default function Kpi({
  titulo,
  valor,
  sufijo,
  prefijo,
  icono,
  meta,
  className = "",
}: {
  titulo: string;
  valor: number;
  sufijo?: string;
  prefijo?: string;
  icono: keyof typeof ICONOS;
  meta?: number;
  className?: string;
}) {
  const Icono = ICONOS[icono];
  const avance = meta ? Math.min(100, Math.round((valor / meta) * 100)) : null;
  return (
    <Spot className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="label !mb-0">{titulo}</p>
        <span className="grid size-7 place-items-center rounded-md border border-[var(--line)] text-[var(--accent)]">
          <Icono className="size-3.5" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mono mt-3 text-3xl font-medium tracking-tight">
        {prefijo}
        <NumberFlow value={valor} locales="es-PE" />
        {sufijo && <span className="ml-1 text-base font-medium text-[var(--muted)]">{sufijo}</span>}
      </p>
      {avance != null && (
        <div className="mt-3">
          <div className="h-[3px] rounded-full bg-white/[0.06]">
            <div className="h-[3px] rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(157,116,255,.8)] transition-all" style={{ width: `${avance}%` }} />
          </div>
          <p className="mono mt-1.5 text-[11px] text-[var(--muted)]">{avance}% DE LA META</p>
        </div>
      )}
    </Spot>
  );
}

/** Indicador de dinero: dólares arriba y soles grandes debajo. */
export function KpiMoneda({ titulo, usd, tc, fuente }: { titulo: string; usd: number; tc: number; fuente: "api" | "fijo" }) {
  const Icono = ICONOS.ingresos;
  return (
    <Spot className="p-4">
      <div className="flex items-center justify-between">
        <p className="label !mb-0">{titulo}</p>
        <span className="grid size-7 place-items-center rounded-md border border-[var(--line)] text-[var(--accent)]">
          <Icono className="size-3.5" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mono mt-3 text-sm text-[var(--muted)]">
        US$ <NumberFlow value={Math.round(usd)} locales="es-PE" />
      </p>
      <p className="mono text-3xl font-medium tracking-tight">
        S/ <NumberFlow value={Math.round(usd * tc)} locales="es-PE" />
      </p>
      <p className="mono mt-1.5 text-[10px] tracking-wider text-[var(--muted)]">
        TC {tc.toFixed(3)} {fuente === "api" ? "· HOY" : "· FIJO"}
      </p>
    </Spot>
  );
}
