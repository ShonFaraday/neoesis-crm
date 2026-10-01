"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { cambiarEtapa } from "@/app/actions";
import type { Prospect } from "@/lib/types";

type Fila = Pick<Prospect, "id" | "name" | "stage" | "category" | "district" | "amount_usd" | "next_follow_up" | "owner">;

export default function Tablero({ columnas, filas }: { columnas: string[]; filas: Fila[] }) {
  const [, start] = useTransition();
  const [optimista, mover] = useOptimistic(filas, (estado: Fila[], m: { id: string; stage: string }) =>
    estado.map((f) => (f.id === m.id ? { ...f, stage: m.stage } : f)),
  );

  const soltar = (etapa: string, id: string) => {
    start(async () => {
      mover({ id, stage: etapa });
      await cambiarEtapa(id, etapa);
    });
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columnas.map((col) => {
        const items = optimista.filter((f) => f.stage === col);
        const total = items.reduce((s, f) => s + Number(f.amount_usd ?? 0), 0);
        return (
          <div
            key={col}
            className="w-64 shrink-0 rounded-xl border border-[var(--line)] bg-white/[0.02] p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) soltar(col, id);
            }}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-bold">{col}</span>
              <span className="text-xs muted">{items.length}{total > 0 ? ` · US$ ${Math.round(total)}` : ""}</span>
            </div>
            <div className="space-y-2 min-h-16">
              {items.map((f) => (
                <div
                  key={f.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", f.id)}
                  className="card p-2.5 cursor-grab active:cursor-grabbing"
                >
                  <Link href={`/prospectos/${f.id}`} className="text-sm font-semibold hover:underline">{f.name}</Link>
                  <div className="text-xs muted">{f.category ?? "—"} · {f.district ?? "—"}</div>
                  <div className="text-xs muted">{f.owner ?? ""}{f.next_follow_up ? ` · seg. ${f.next_follow_up.slice(5).split("-").reverse().join("/")}` : ""}</div>
                  <select
                    className="mt-1.5 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-1.5 py-1 text-xs md:hidden"
                    value={f.stage}
                    onChange={(e) => soltar(e.target.value, f.id)}
                  >
                    {columnas.map((c) => <option key={c}>{c}</option>)}
                    <option>Descartado</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
