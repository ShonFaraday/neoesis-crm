import Link from "next/link";
import { Estrellas, Etapa, Prioridad, Web } from "@/components/Badges";
import { nombresEquipo, requerirUsuario } from "@/lib/auth";
import { DISTRITOS, ETAPAS, RUBROS } from "@/lib/constants";
import { fechaCorta, hoy } from "@/lib/dates";
import { enc, select } from "@/lib/db";
import { prioridad } from "@/lib/format";
import FiltroSelect from "@/components/Filtro";
import EstadoCanales from "@/components/EstadoCanales";
import Etiquetas from "@/components/Etiquetas";
import { select as selectRaw } from "@/lib/db";
import type { Prospect } from "@/lib/types";

type SP = Promise<Record<string, string | undefined>>;
const POR_PAGINA = 100;

export default async function ProspectosPage({ searchParams }: { searchParams: SP }) {
  await requerirUsuario();
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p ?? 1) || 1);
  const filtros: string[] = [];
  const q = (sp.q ?? "").replace(/[,()*]/g, " ").trim();
  if (q) filtros.push(`or=(name.ilike.*${enc(q)}*,phone.ilike.*${enc(q)}*,notes.ilike.*${enc(q)}*)`);
  if (sp.etapa) filtros.push(`stage=eq.${enc(sp.etapa)}`);
  if (sp.rubro) filtros.push(`category=eq.${enc(sp.rubro)}`);
  if (sp.distrito) filtros.push(`district=eq.${enc(sp.distrito)}`);
  if (sp.resp) filtros.push(`owner=eq.${enc(sp.resp)}`);
  if (sp.web) filtros.push(`web_status=eq.${enc(sp.web)}`);
  if (sp.etiqueta) filtros.push(`tags=cs.${enc(`{"${sp.etiqueta}"}`)}`);
  if (sp.seguimiento) filtros.push(`next_follow_up=eq.${enc(sp.seguimiento)}`);
  if (sp.pendientes) filtros.push(`next_follow_up=lte.${hoy()}`);
  const orden = sp.orden === "resenas" ? "reviews.desc" : sp.orden === "seguimiento" ? "next_follow_up.asc.nullslast" : "updated_at.desc";
  const lista = await select<Prospect>(
    `prospects?select=*${filtros.map((f) => `&${f}`).join("")}&order=${orden}&limit=${POR_PAGINA + 1}&offset=${(pagina - 1) * POR_PAGINA}`,
  );
  const hayMas = lista.length > POR_PAGINA;
  const filas = lista.slice(0, POR_PAGINA);
  const todasEtiquetas = [...new Set((await selectRaw<{ tags: string[] }>("prospects?select=tags&tags=neq.{}")).flatMap((r) => r.tags))].sort();
  const hayFiltros = ["q", "etapa", "rubro", "distrito", "resp", "web", "seguimiento", "pendientes", "etiqueta"].some((k) => sp[k]);
  const qs = (extra: Record<string, string>) => {
    const u = new URLSearchParams(Object.entries({ ...sp, ...extra }).filter(([, v]) => v) as [string, string][]);
    return `?${u.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-medium tracking-tight">Prospectos</h1>
        <Link href="/prospectos/nuevo" className="btn btn-primary">+ Nuevo</Link>
      </div>

      <form className="card p-3 grid gap-2 grid-cols-2 md:grid-cols-8">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Buscar nombre, teléfono, nota"
          className={`input col-span-2 ${sp.q ? "!border-[var(--accent)] !bg-[var(--accent)]/10 shadow-[0_0_0_3px_rgba(157,116,255,.18)]" : ""}`}
        />
        <FiltroSelect name="etapa" valor={sp.etapa} todos="Toda etapa" opciones={[...ETAPAS]} />
        <FiltroSelect name="rubro" valor={sp.rubro} todos="Todo rubro" opciones={RUBROS.map((r) => r.nombre)} />
        <FiltroSelect name="distrito" valor={sp.distrito} todos="Todo distrito" opciones={DISTRITOS} />
        <FiltroSelect name="resp" valor={sp.resp} todos="Todo responsable" opciones={nombresEquipo()} />
        <FiltroSelect name="etiqueta" valor={sp.etiqueta} todos="Toda etiqueta" opciones={todasEtiquetas} />
        <div className="flex gap-2">
          <select name="orden" defaultValue={sp.orden ?? ""} className="input">
            <option value="">Recientes</option>
            <option value="resenas">Más reseñas</option>
            <option value="seguimiento">Próximo seguimiento</option>
          </select>
          <button className="btn">Filtrar</button>
        </div>
        {sp.pendientes && <input type="hidden" name="pendientes" value="1" />}
        {sp.web && <input type="hidden" name="web" value={sp.web} />}
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Rapido activo={!!sp.pendientes} href={sp.pendientes ? qs({ pendientes: "", p: "" }) : qs({ pendientes: "1", p: "" })}>Seguimientos vencidos</Rapido>
        <Rapido activo={sp.etapa === "Interesado"} href={sp.etapa === "Interesado" ? qs({ etapa: "", p: "" }) : qs({ etapa: "Interesado", p: "" })}>Interesados</Rapido>
        <Rapido activo={sp.web === "solo_redes"} href={sp.web === "solo_redes" ? qs({ web: "", p: "" }) : qs({ web: "solo_redes", p: "" })}>Solo redes</Rapido>
        {todasEtiquetas.map((t) => (
          <Rapido key={t} activo={sp.etiqueta === t} href={sp.etiqueta === t ? qs({ etiqueta: "", p: "" }) : qs({ etiqueta: t, p: "" })}>
            {t}
          </Rapido>
        ))}
        <Rapido activo={sp.web === "sin_web"} href={sp.web === "sin_web" ? qs({ web: "", p: "" }) : qs({ web: "sin_web", p: "" })}>Sin web</Rapido>
        {hayFiltros && (
          <Link href="/prospectos" className="chip border border-[var(--line)] px-3 py-1 text-[var(--muted)] hover:text-white">
            Quitar filtros ×
          </Link>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Etapa</th>
              <th>Rubro / distrito</th>
              <th>Teléfono</th>
              <th>Prioridad</th>
              <th>Contacto</th>
              <th>Toques</th>
              <th>Próximo</th>
              <th>Resp.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.03]">
                <td>
                  <Link href={`/prospectos/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                  <div className="flex flex-wrap gap-1.5 items-center mt-0.5"><Web estado={p.web_status} /><Estrellas rating={p.rating} reviews={p.reviews} /><Etiquetas tags={p.tags} /></div>
                </td>
                <td><Etapa etapa={p.stage} /></td>
                <td className="text-xs">{p.category ?? "—"}<br /><span className="muted">{p.district ?? "—"}</span></td>
                <td className="whitespace-nowrap">{p.phone ?? "—"}</td>
                <td><Prioridad p={prioridad(p)} /></td>
                <td><EstadoCanales p={p} /></td>
                <td className="mono text-xs">{p.touches}/4</td>
                <td className={`whitespace-nowrap ${p.next_follow_up && p.next_follow_up <= hoy() ? "font-bold text-red-400" : ""}`}>{fechaCorta(p.next_follow_up)}</td>
                <td>{p.owner ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 && <p className="p-4 text-sm muted">No hay prospectos con estos filtros.</p>}
      </div>
      <div className="flex justify-between">
        {pagina > 1 ? <Link className="btn" href={qs({ p: String(pagina - 1) })}>← Anterior</Link> : <span />}
        {hayMas && <Link className="btn" href={qs({ p: String(pagina + 1) })}>Siguiente →</Link>}
      </div>
    </div>
  );
}

function Rapido({ activo, href, children }: { activo: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`chip border px-3 py-1 transition ${
        activo
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white shadow-[0_0_16px_-4px_rgba(157,116,255,.8)]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-white/30 hover:text-white"
      }`}
    >
      {activo && <span className="mr-1.5 size-1.5 rounded-full bg-[var(--accent)]" />}
      {children}
    </Link>
  );
}
