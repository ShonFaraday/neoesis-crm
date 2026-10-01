import { Kanban, type KanbanColumna } from "@/components/ui/kanban";
import { requerirUsuario } from "@/lib/auth";
import { count, selectAll } from "@/lib/db";
import { tipoCambio } from "@/lib/tipoCambio";
import type { Prospect } from "@/lib/types";

const COLUMNAS: KanbanColumna[] = [
  { id: "Contactado", titulo: "Contactado", color: "text-white/60" },
  { id: "Respondió", titulo: "Respondió", color: "text-sky-300" },
  { id: "Interesado", titulo: "Interesado", color: "text-amber-300" },
  { id: "Boceto enviado", titulo: "Boceto enviado", color: "text-violet-300" },
  { id: "Cotización enviada", titulo: "Cotización", color: "text-fuchsia-300" },
  { id: "Ganado", titulo: "Ganado", color: "text-emerald-300" },
  { id: "Perdido", titulo: "Perdido", color: "text-red-300" },
];

export default async function EmbudoPage() {
  await requerirUsuario();
  const [filas, tc] = await Promise.all([
    selectAll<Pick<Prospect, "id" | "name" | "stage" | "category" | "district" | "amount_usd" | "next_follow_up" | "owner">>(
      `prospects?select=id,name,stage,category,district,amount_usd,next_follow_up,owner&stage=in.(${COLUMNAS.map((c) => `"${c.id}"`).join(",")})&order=updated_at.desc`,
    ),
    tipoCambio(),
  ]);
  const nuevos = await count("prospects?select=id&stage=eq.Nuevo");
  const BARRA: Record<string, string> = {
    Contactado: "bg-white/40",
    "Respondió": "bg-sky-400",
    Interesado: "bg-amber-400",
    "Boceto enviado": "bg-violet-400",
    "Cotización enviada": "bg-fuchsia-400",
    Ganado: "bg-emerald-400",
    Perdido: "bg-red-400",
  };
  const conteo = COLUMNAS.map((c) => ({ ...c, n: filas.filter((f) => f.stage === c.id).length }));
  const totalEmbudo = filas.length;
  const ganados = conteo.find((c) => c.id === "Ganado")?.n ?? 0;
  const cerrados = ganados + (conteo.find((c) => c.id === "Perdido")?.n ?? 0);
  const abierto = filas.filter((f) => !["Ganado", "Perdido"].includes(f.stage)).reduce((s, f) => s + Number(f.amount_usd ?? 0), 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Embudo</h1>
          <p className="text-sm muted">Arrastra cada empresa a su etapa. Suéltala en la papelera para descartarla.</p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="label !mb-0">Distribución del embudo</p>
            <p className="mono text-[11px] text-[var(--muted)]">{totalEmbudo} en proceso · {nuevos} nuevos sin contactar</p>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.04]">
            {totalEmbudo > 0 &&
              conteo.filter((c) => c.n > 0).map((c) => (
                <div key={c.id} className={`${BARRA[c.id]} h-full`} style={{ width: `${(c.n / totalEmbudo) * 100}%` }} title={`${c.titulo}: ${c.n}`} />
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {conteo.map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <span className={`size-2 rounded-full ${BARRA[c.id]}`} />
                {c.titulo} <b className="mono font-medium text-white">{c.n}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:w-[420px]">
          <div className="card p-5">
            <p className="label">En negociación</p>
            <p className="mono text-2xl">S/ {Math.round(abierto * tc.valor).toLocaleString("es-PE")}</p>
            <p className="mono mt-1 text-[11px] text-[var(--muted)]">US$ {Math.round(abierto).toLocaleString("es-PE")}</p>
          </div>
          <div className="card p-5">
            <p className="label">Tasa de cierre</p>
            <p className="mono text-2xl">{cerrados ? `${Math.round((ganados / cerrados) * 100)}%` : "—"}</p>
            <p className="mono mt-1 text-[11px] text-[var(--muted)]">{ganados} ganados de {cerrados} cerrados</p>
          </div>
        </div>
      </section>
      <Kanban columnas={COLUMNAS} tarjetas={filas} tc={tc.valor} />
    </div>
  );
}
