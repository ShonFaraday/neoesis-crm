"use client";

// Kanban de 21st.dev (Tom Is Loading), adaptado al CRM:
// columnas = etapas del embudo, tarjetas = prospectos, soltar = cambiar etapa en la base de datos.
// La papelera ("Descartar") pasa el prospecto a la etapa Descartado.
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, Flame, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition, type DragEvent } from "react";
import { cambiarEtapa } from "@/app/actions";
import { cn } from "@/lib/utils";

export type KanbanColumna = { id: string; titulo: string; color: string };
export type KanbanTarjeta = {
  id: string;
  name: string;
  stage: string;
  category: string | null;
  district: string | null;
  amount_usd: number | null;
  next_follow_up: string | null;
  owner: string | null;
};

export function Kanban({ columnas, tarjetas, tc }: { columnas: KanbanColumna[]; tarjetas: KanbanTarjeta[]; tc: number }) {
  const [cards, setCards] = useState(tarjetas);
  const [, start] = useTransition();
  useEffect(() => setCards(tarjetas), [tarjetas]);

  const mover = (id: string, etapa: string, antesDe?: string) => {
    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      if (!card) return prev;
      const resto = prev.filter((c) => c.id !== id);
      const nueva = { ...card, stage: etapa };
      if (etapa === "Descartado") return resto;
      const i = antesDe ? resto.findIndex((c) => c.id === antesDe) : -1;
      if (i < 0) return [...resto, nueva];
      resto.splice(i, 0, nueva);
      return resto;
    });
    start(() => cambiarEtapa(id, etapa));
  };

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-4">
      {columnas.map((c) => (
        <Columna key={c.id} columna={c} cards={cards.filter((x) => x.stage === c.id)} columnas={columnas} mover={mover} tc={tc} />
      ))}
      <Papelera mover={mover} />
    </div>
  );
}

function Columna({
  columna,
  cards,
  columnas,
  mover,
  tc,
}: {
  columna: KanbanColumna;
  cards: KanbanTarjeta[];
  columnas: KanbanColumna[];
  mover: (id: string, etapa: string, antesDe?: string) => void;
  tc: number;
}) {
  const [activa, setActiva] = useState(false);
  const total = cards.reduce((s, c) => s + Number(c.amount_usd ?? 0), 0);

  const indicadores = () => Array.from(document.querySelectorAll<HTMLElement>(`[data-column="${columna.id}"]`));
  const limpiar = (els?: HTMLElement[]) => (els ?? indicadores()).forEach((i) => (i.style.opacity = "0"));
  const masCercano = (e: DragEvent, els: HTMLElement[]) =>
    els.reduce(
      (cerca, el) => {
        const box = el.getBoundingClientRect();
        const offset = e.clientY - (box.top + 40);
        return offset < 0 && offset > cerca.offset ? { offset, element: el } : cerca;
      },
      { offset: Number.NEGATIVE_INFINITY, element: els[els.length - 1] },
    );

  const alSoltar = (e: DragEvent) => {
    const id = e.dataTransfer.getData("cardId");
    setActiva(false);
    const els = indicadores();
    limpiar(els);
    if (!id || !els.length) return;
    const antes = masCercano(e, els).element.dataset.before;
    mover(id, columna.id, antes && antes !== "-1" && antes !== id ? antes : undefined);
  };

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className={cn("flex items-center gap-2 text-sm font-medium", columna.color)}>
            <span className="size-2 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
            {columna.titulo}
          </h3>
          <span className="mono grid min-w-7 place-items-center rounded-md border border-[var(--line)] px-1.5 py-0.5 text-xs text-white">{cards.length}</span>
        </div>
        <p className="mono mt-1.5 text-[11px] text-[var(--muted)]">{total > 0 ? `S/ ${Math.round(total * tc).toLocaleString("es-PE")}` : "S/ —"}</p>
      </div>
      <div
        onDrop={alSoltar}
        onDragOver={(e) => {
          e.preventDefault();
          const els = indicadores();
          limpiar(els);
          if (els.length) masCercano(e, els).element.style.opacity = "1";
          setActiva(true);
        }}
        onDragLeave={() => {
          limpiar();
          setActiva(false);
        }}
        className={cn(
          "min-h-[calc(100vh-330px)] flex-1 rounded-xl border p-2 transition-colors",
          activa ? "border-[var(--accent)]/50 bg-[var(--accent)]/[0.06]" : "border-[var(--line)] bg-white/[0.015]",
        )}
      >
        {cards.map((c) => (
          <Tarjeta key={c.id} card={c} columnas={columnas} mover={mover} />
        ))}
        <Indicador antesDe={null} columna={columna.id} />
        {cards.length === 0 && (
          <div className="grid h-40 place-items-center rounded-lg border border-dashed border-white/[0.06]">
            <p className="mono text-[10px] uppercase tracking-widest text-white/20">Suelta aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Tarjeta({ card, columnas, mover }: { card: KanbanTarjeta; columnas: KanbanColumna[]; mover: (id: string, etapa: string) => void }) {
  const fecha = card.next_follow_up ? card.next_follow_up.slice(5).split("-").reverse().join("/") : null;
  return (
    <>
      <Indicador antesDe={card.id} columna={card.stage} />
      <motion.div layout layoutId={card.id}>
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData("cardId", card.id)}
        className="group cursor-grab rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3.5 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-[0_8px_24px_-12px_rgba(157,116,255,.5)] active:cursor-grabbing"
      >
        <Link href={`/prospectos/${card.id}`} className="block text-sm font-medium leading-snug text-white hover:text-[var(--accent)]">
          {card.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
          {card.category ?? "—"} · {card.district ?? "—"}
        </p>
        <div className="mono mt-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--muted)]">
          <span className="flex items-center gap-1">
            {fecha && (
              <>
                <CalendarClock className="size-3" /> {fecha}
              </>
            )}
          </span>
          <span className="flex items-center gap-2">
            {card.amount_usd ? <span className="text-white">US$ {Math.round(card.amount_usd)}</span> : null}
            {card.owner && (
              <span className="grid size-5 place-items-center rounded-full border border-[var(--accent)]/50 text-[9px] text-white">{card.owner.slice(0, 1)}</span>
            )}
          </span>
        </div>
        <select
          aria-label="Mover a"
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-black px-1.5 py-1 text-xs md:hidden"
          value={card.stage}
          onChange={(e) => mover(card.id, e.target.value)}
        >
          {columnas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titulo}
            </option>
          ))}
          <option value="Descartado">Descartar</option>
        </select>
      </div>
      </motion.div>
    </>
  );
}

function Indicador({ antesDe, columna }: { antesDe: string | null; columna: string }) {
  return <div data-before={antesDe ?? "-1"} data-column={columna} className="my-0.5 h-0.5 w-full rounded bg-[var(--accent)] opacity-0 shadow-[0_0_8px_var(--accent)]" />;
}

function Papelera({ mover }: { mover: (id: string, etapa: string) => void }) {
  const [activa, setActiva] = useState(false);
  return (
    <div
      onDrop={(e) => {
        const id = e.dataTransfer.getData("cardId");
        setActiva(false);
        if (id) mover(id, "Descartado");
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setActiva(true);
      }}
      onDragLeave={() => setActiva(false)}
      className={cn(
        "hidden min-h-[calc(100vh-250px)] w-36 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-2xl md:flex",
        activa ? "border-red-500/70 bg-red-500/10 text-red-400" : "border-[var(--line)] text-white/25",
      )}
    >
      {activa ? <Flame className="size-7 animate-bounce" /> : <Trash2 className="size-6" />}
      <span className="mono text-[10px] uppercase tracking-widest">Descartar</span>
    </div>
  );
}
