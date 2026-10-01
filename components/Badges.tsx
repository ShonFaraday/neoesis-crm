import { WEB_LABEL } from "@/lib/constants";

const COLOR_ETAPA: Record<string, string> = {
  Nuevo: "bg-white/10 text-white/70",
  Contactado: "bg-blue-500/15 text-blue-300",
  Respondió: "bg-cyan-500/15 text-cyan-300",
  Interesado: "bg-amber-500/15 text-amber-300",
  "Boceto enviado": "bg-violet-500/15 text-violet-300",
  "Cotización enviada": "bg-fuchsia-500/15 text-fuchsia-300",
  Ganado: "bg-emerald-500/15 text-green-300",
  Perdido: "bg-red-500/15 text-red-300",
  Descartado: "bg-white/5 text-white/40",
};

export function Etapa({ etapa }: { etapa: string }) {
  return <span className={`chip ${COLOR_ETAPA[etapa] ?? "bg-white/5"}`}>{etapa}</span>;
}

export function Web({ estado }: { estado: string }) {
  const c = estado === "sin_web" ? "bg-emerald-500/15 text-emerald-300" : estado === "solo_redes" ? "bg-sky-500/15 text-sky-300" : "bg-white/5 text-white/45";
  return <span className={`chip ${c}`}>{WEB_LABEL[estado] ?? estado}</span>;
}

export function Prioridad({ p }: { p: "Alta" | "Media" | "Baja" }) {
  const c = p === "Alta" ? "text-orange-400" : p === "Media" ? "text-white/70" : "text-white/45";
  return <span className={`text-xs font-bold ${c}`}>{p}</span>;
}

export function Estrellas({ rating, reviews }: { rating: number | null; reviews: number }) {
  return (
    <span className="text-xs muted whitespace-nowrap">
      {rating != null ? `★ ${String(rating).replace(".", ",")}` : "★ —"} · {reviews} reseñas
    </span>
  );
}
