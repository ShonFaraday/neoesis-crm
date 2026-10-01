"use client";

import { useTransition } from "react";
import { registrarResultado, type Canal } from "@/app/actions";

const OPCIONES: Record<Canal, { valor: string; texto: string; clase: string }[]> = {
  whatsapp: [
    { valor: "positivo", texto: "Positiva", clase: "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" },
    { valor: "negativo", texto: "Negativa", clase: "border-red-500/60 bg-red-500/15 text-red-300" },
    { valor: "sin_respuesta", texto: "Sin respuesta", clase: "border-amber-500/50 bg-amber-500/10 text-amber-300" },
  ],
  email: [
    { valor: "positivo", texto: "Positiva", clase: "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" },
    { valor: "negativo", texto: "Negativa", clase: "border-red-500/60 bg-red-500/15 text-red-300" },
    { valor: "sin_respuesta", texto: "Sin respuesta", clase: "border-amber-500/50 bg-amber-500/10 text-amber-300" },
  ],
  llamada: [
    { valor: "positivo", texto: "Positiva", clase: "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" },
    { valor: "negativo", texto: "Negativa", clase: "border-red-500/60 bg-red-500/15 text-red-300" },
    { valor: "no_contesto", texto: "No contestó", clase: "border-amber-500/50 bg-amber-500/10 text-amber-300" },
  ],
};

/** Botones para anotar la respuesta del negocio en un canal. El activo queda iluminado. */
export default function ResultadoCanal({ prospectId, canal, actual, habilitado }: { prospectId: string; canal: Canal; actual: string | null; habilitado: boolean }) {
  const [pendiente, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="label !mb-0 mr-1">Respuesta</span>
      {OPCIONES[canal].map((o) => {
        const activo = actual === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            disabled={!habilitado || pendiente}
            title={!habilitado ? "Primero envía o llama" : undefined}
            onClick={() => start(() => registrarResultado(prospectId, canal, activo ? null : o.valor))}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition disabled:opacity-30 ${
              activo ? `${o.clase} shadow-[0_0_14px_-4px_currentColor]` : "border-[var(--line)] text-[var(--muted)] hover:border-white/30 hover:text-white"
            }`}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
