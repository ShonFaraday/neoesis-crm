import Link from "next/link";
import { alternarEvento, crearEvento, eliminarEvento } from "@/app/actions";
import { nombresEquipo, requerirUsuario } from "@/lib/auth";
import { TIPOS_EVENTO, TIPO_EVENTO_LABEL } from "@/lib/constants";
import { hoy, nombreMes } from "@/lib/dates";
import { select, selectAll } from "@/lib/db";
import type { EventRow } from "@/lib/types";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const yo = await requerirUsuario();
  const { m } = await searchParams;
  const d = hoy();
  const [y, mo] = (m && /^\d{4}-\d{2}$/.test(m) ? m : d.slice(0, 7)).split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const desde = `${y}-${pad(mo)}-01`;
  const hasta = `${y}-${pad(mo)}-${pad(ultimo)}`;
  const prev = mo === 1 ? `${y - 1}-12` : `${y}-${pad(mo - 1)}`;
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${pad(mo + 1)}`;

  const [eventos, seguimientos, actividad, nuevos] = await Promise.all([
    select<EventRow>(`events?select=*&day=gte.${desde}&day=lte.${hasta}&order=time.asc.nullsfirst`),
    selectAll<{ next_follow_up: string }>(`prospects?select=next_follow_up&next_follow_up=gte.${desde}&next_follow_up=lte.${hasta}`),
    selectAll<{ day: string }>(`activities?select=day&day=gte.${desde}&day=lte.${hasta}&kind=in.(whatsapp,llamada,email)`),
    selectAll<{ first_contact: string }>(`prospects?select=first_contact&first_contact=gte.${desde}&first_contact=lte.${hasta}`),
  ]);
  const contar = (arr: string[]) => arr.reduce<Record<string, number>>((acc, k) => ((acc[k] = (acc[k] ?? 0) + 1), acc), {});
  const segPorDia = contar(seguimientos.map((s) => s.next_follow_up));
  const toquesPorDia = contar(actividad.map((a) => a.day));
  const nuevosPorDia = contar(nuevos.map((n) => n.first_contact));

  const inicioSemana = (new Date(Date.UTC(y, mo - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const celdas: (string | null)[] = [...Array(inicioSemana).fill(null), ...Array.from({ length: ultimo }, (_, i) => `${y}-${pad(mo)}-${pad(i + 1)}`)];
  while (celdas.length % 7) celdas.push(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium tracking-tight">{nombreMes(y, mo)}</h1>
        <div className="flex gap-2">
          <Link href={`/calendario?m=${prev}`} className="btn">←</Link>
          <Link href="/calendario" className="btn">Hoy</Link>
          <Link href={`/calendario?m=${next}`} className="btn">→</Link>
        </div>
      </div>
      <p className="text-xs muted">
        <span className="chip bg-red-500/15 text-red-300">seguimientos</span> programados ·{" "}
        <span className="chip bg-[var(--accent)]/15 text-violet-300">nuevos / toques</span> registrados ese día · eventos agendados debajo
      </p>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-white/[0.04] text-center text-xs font-bold muted">
          {DIAS.map((x) => <div key={x} className="py-2">{x}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((dia, i) => {
            if (!dia) return <div key={i} className="min-h-24 border-b border-r bg-white/[0.015]" />;
            const evs = eventos.filter((e) => e.day === dia);
            const esHoy = dia === d;
            return (
              <div key={dia} className={`min-h-24 border-b border-r p-1.5 text-xs ${esHoy ? "bg-[var(--accent)]/10" : ""}`}>
                <div className={`font-bold ${esHoy ? "text-[var(--accent)]" : ""}`}>{Number(dia.slice(8))}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {segPorDia[dia] && (
                    <Link href={`/prospectos?seguimiento=${dia}`} className="chip bg-red-500/15 text-red-300">{segPorDia[dia]} seg.</Link>
                  )}
                  {(nuevosPorDia[dia] || toquesPorDia[dia]) && (
                    <span className="chip bg-[var(--accent)]/15 text-violet-300">{nuevosPorDia[dia] ?? 0}/{toquesPorDia[dia] ?? 0}</span>
                  )}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {evs.map((e) => (
                    <li key={e.id} className={`truncate ${e.done ? "line-through muted" : ""}`} title={e.title}>
                      {e.time ? `${e.time} ` : ""}
                      {e.prospect_id ? <Link href={`/prospectos/${e.prospect_id}`} className="hover:underline">{e.title}</Link> : e.title}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="font-medium mb-2">Nuevo evento</h2>
          <form action={crearEvento} className="grid gap-2">
            <input name="title" className="input" placeholder="Ej. Enviar boceto a Veterinaria San Roque" required />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <input name="day" type="date" className="input" defaultValue={d} required />
              <input name="time" type="time" className="input" />
              <select name="kind" className="input">
                {TIPOS_EVENTO.map((k) => <option key={k} value={k}>{TIPO_EVENTO_LABEL[k]}</option>)}
              </select>
              <select name="owner" className="input" defaultValue={yo}>
                {nombresEquipo().map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <button className="btn btn-primary">Agendar</button>
          </form>
        </section>
        <section className="card p-4">
          <h2 className="font-medium mb-2">Eventos del mes</h2>
          {eventos.length === 0 ? (
            <p className="text-sm muted">Sin eventos este mes.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...eventos].sort((a, b) => (a.day + (a.time ?? "")).localeCompare(b.day + (b.time ?? ""))).map((e) => (
                <li key={e.id} className="flex items-center gap-2">
                  <form action={alternarEvento.bind(null, e.id, !e.done)}>
                    <button className="text-base leading-none" title={e.done ? "Marcar pendiente" : "Marcar hecho"}>{e.done ? "☑" : "☐"}</button>
                  </form>
                  <span className={`flex-1 ${e.done ? "line-through muted" : ""}`}>
                    <b>{e.day.slice(8)}/{e.day.slice(5, 7)}</b> {e.time ?? ""} · {e.title} <span className="muted">· {e.owner ?? ""}</span>
                  </span>
                  <form action={eliminarEvento.bind(null, e.id)}>
                    <button className="text-xs text-red-400">quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
