import Link from "next/link";
import Kpi, { KpiMoneda } from "@/components/Kpi";
import { tipoCambio } from "@/lib/tipoCambio";
import { Estrellas, Etapa, Web } from "@/components/Badges";
import BotonToque from "@/components/BotonToque";
import { perfilDe, requerirUsuario } from "@/lib/auth";
import { metaDiaria, TIPO_EVENTO_LABEL } from "@/lib/constants";
import { diasEntre, fechaCorta, hoy, sumarDias } from "@/lib/dates";
import { count, select } from "@/lib/db";
import { plantillaPorCodigo, plantillas } from "@/lib/data";
import { plantillaSugerida } from "@/lib/followup";
import { enlaceWhatsApp, esCelular, enlaceLlamada, rellenar } from "@/lib/format";
import type { EventRow, Prospect, Template } from "@/lib/types";

export default async function HoyPage() {
  const yo = await requerirUsuario();
  const d = hoy();
  const meta = metaDiaria();

  const [nuevosHoy, toquesHoy, seguimientos, porContactar, eventos, tpl, ganadosMes, tc] = await Promise.all([
    count(`prospects?select=id&first_contact=eq.${d}`),
    count(`activities?select=id&day=eq.${d}&kind=in.(whatsapp,llamada,email)`),
    select<Prospect>(`prospects?select=*&next_follow_up=lte.${d}&order=next_follow_up.asc,reviews.desc&limit=100`),
    select<Prospect>(`prospects?select=*&stage=eq.Nuevo&order=reviews.desc&limit=25`),
    select<EventRow>(`events?select=*&day=gte.${d}&day=lte.${sumarDias(d, 7)}&done=eq.false&order=day.asc,time.asc`),
    plantillas(),
    select<{ amount_usd: number | null }>(`prospects?select=amount_usd&stage=eq.Ganado&updated_at=gte.${d.slice(0, 7)}-01`),
    tipoCambio(),
  ]);

  const ingresosMes = ganadosMes.reduce((s, g) => s + Number(g.amount_usd ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Hola, <span className="accent-text">{yo}</span></h1>
        <p className="muted text-sm">{fechaCorta(d)} · meta de hoy: {meta} negocios nuevos contactados</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi titulo="Contactos nuevos hoy" valor={nuevosHoy} sufijo={`/ ${meta}`} meta={meta} icono="usuarios" className="col-span-2" />
        <Kpi titulo="Toques hoy" valor={toquesHoy} icono="mensajes" />
        <KpiMoneda titulo="Cerrado este mes" usd={ingresosMes} tc={tc.valor} fuente={tc.fuente} />
      </section>

      <section className="card">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-medium">Seguimientos de hoy {seguimientos.length > 0 && <span className="chip bg-red-500/15 text-red-300 ml-1">{seguimientos.length}</span>}</h2>
          <span className="text-xs muted">B día 3 · C día 6 · D día 10</span>
        </div>
        {seguimientos.length === 0 ? (
          <p className="px-4 pb-4 text-sm muted">No hay seguimientos pendientes. Sigue con los negocios nuevos.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {seguimientos.map((p) => (
              <FilaAccion key={p.id} p={p} tpl={tpl} yo={yo} atraso={diasEntre(p.next_follow_up!, d)} />
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-medium">Nuevos por contactar</h2>
          <Link href="/captura" className="text-sm font-semibold text-[var(--accent)]">+ Capturar más</Link>
        </div>
        {porContactar.length === 0 ? (
          <p className="px-4 pb-4 text-sm muted">No hay prospectos nuevos. Ve a Captura y trae negocios sin web.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {porContactar.map((p) => (
              <FilaAccion key={p.id} p={p} tpl={tpl} yo={yo} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Agenda de los próximos 7 días</h2>
          <Link href="/calendario" className="text-sm font-semibold text-[var(--accent)]">Ver calendario</Link>
        </div>
        {eventos.length === 0 ? (
          <p className="text-sm muted">Sin reuniones agendadas.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {eventos.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className="w-28 shrink-0 font-semibold">{fechaCorta(e.day)} {e.time ?? ""}</span>
                <span className="chip bg-[var(--accent)]/15 text-violet-300">{TIPO_EVENTO_LABEL[e.kind] ?? e.kind}</span>
                {e.prospect_id ? <Link href={`/prospectos/${e.prospect_id}`} className="hover:underline">{e.title}</Link> : <span>{e.title}</span>}
                {e.owner && <span className="muted">· {e.owner}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilaAccion({ p, tpl, yo, atraso }: { p: Prospect; tpl: Template[]; yo: string; atraso?: number }) {
  const code = plantillaSugerida(p.touches);
  const t = plantillaPorCodigo(tpl, code);
  const texto = t ? rellenar(t.body, p, yo, perfilDe(yo)) : undefined;
  return (
    <li className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <Link href={`/prospectos/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <Etapa etapa={p.stage} />
          <Web estado={p.web_status} />
          <span className="text-xs muted">{p.category ?? "—"} · {p.district ?? "—"}</span>
          <Estrellas rating={p.rating} reviews={p.reviews} />
          {atraso != null && atraso > 0 && <span className="chip bg-red-500/15 text-red-300">{atraso} d atrasado</span>}
          {p.touches > 0 && <span className="text-xs muted">· {p.touches} toque(s)</span>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {code && esCelular(p.phone) ? (
          <BotonToque prospectId={p.id} prospecto={p.name} url={enlaceWhatsApp(p.phone, texto)} canal="whatsapp" plantilla={code} etiqueta={`WhatsApp ${code}`} />
        ) : (
          enlaceLlamada(p.phone) && <a href={enlaceLlamada(p.phone)!} className="btn">Llamar</a>
        )}
        <Link href={`/prospectos/${p.id}`} className="btn">Abrir</Link>
      </div>
    </li>
  );
}
