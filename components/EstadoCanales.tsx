import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Prospect } from "@/lib/types";

type P = Pick<Prospect, "wa_sent_at" | "wa_result" | "call_at" | "call_result" | "email_sent_at" | "email_result">;

const COLOR: Record<string, string> = {
  positivo: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  negativo: "text-red-400 border-red-500/50 bg-red-500/10",
  sin_respuesta: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  no_contesto: "text-amber-300 border-amber-500/40 bg-amber-500/10",
};
const TEXTO: Record<string, string> = { positivo: "positiva", negativo: "negativa", sin_respuesta: "sin respuesta", no_contesto: "no contestó" };

function Punto({ hecho, resultado, Icono, nombre, verbo }: { hecho: boolean; resultado: string | null; Icono: typeof Phone; nombre: string; verbo: string }) {
  const clase = resultado ? COLOR[resultado] : hecho ? "text-white border-white/40 bg-white/5" : "text-white/20 border-white/10";
  const titulo = `${nombre}: ${hecho ? verbo : "pendiente"}${resultado ? ` · ${TEXTO[resultado] ?? resultado}` : ""}`;
  return (
    <span title={titulo} className={`grid size-6 place-items-center rounded-md border ${clase}`}>
      <Icono className="size-3.5" strokeWidth={1.8} />
    </span>
  );
}

/** Tres indicadores: WhatsApp, llamada y email. Gris = pendiente · blanco = hecho · verde/rojo/ámbar = respuesta. */
export default function EstadoCanales({ p }: { p: P }) {
  return (
    <span className="inline-flex gap-1">
      <Punto hecho={!!p.wa_sent_at} resultado={p.wa_result} Icono={MessageCircle} nombre="WhatsApp" verbo="enviado" />
      <Punto hecho={!!p.call_at} resultado={p.call_result} Icono={Phone} nombre="Llamada" verbo="llamado" />
      <Punto hecho={!!p.email_sent_at} resultado={p.email_result} Icono={Mail} nombre="Email" verbo="enviado" />
    </span>
  );
}
