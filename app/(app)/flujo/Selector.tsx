"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Opcion = { id: string; name: string; district: string | null; category: string | null; stage: string };

/** Buscador de empresas: escribe y elige; carga sus datos en las plantillas. */
export default function Selector({ opciones, actual }: { opciones: Opcion[]; actual?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const elegido = opciones.find((o) => o.id === actual);
  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? opciones.filter((o) => `${o.name} ${o.district ?? ""} ${o.category ?? ""}`.toLowerCase().includes(t)) : opciones).slice(0, 40);
  }, [q, opciones]);

  return (
    <div className="relative">
      <label className="label">Empresa</label>
      <div className={`flex items-center gap-2 rounded-lg border bg-[#050506] px-3 ${abierto ? "border-[var(--accent)] shadow-[0_0_0_3px_rgba(157,116,255,.18)]" : "border-[var(--line)]"}`}>
        <Search className="size-4 text-[var(--muted)]" />
        <input
          className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-[#55555e]"
          placeholder={elegido ? `${elegido.name} — ${elegido.district ?? ""}` : "Busca por nombre, rubro o distrito…"}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
        />
      </div>
      {abierto && (
        <ul className="absolute z-30 mt-1 max-h-80 w-full overflow-auto rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1 shadow-2xl">
          {filtradas.length === 0 && <li className="px-3 py-2 text-sm text-[var(--muted)]">Sin resultados</li>}
          {filtradas.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onMouseDown={() => {
                  setQ("");
                  setAbierto(false);
                  router.push(`/flujo?p=${o.id}`);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-white/5 ${o.id === actual ? "bg-[var(--accent)]/10 text-white" : ""}`}
              >
                <span className="truncate">{o.name}</span>
                <span className="mono shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {o.district ?? "—"} · {o.stage}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
