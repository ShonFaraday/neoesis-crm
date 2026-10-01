import Link from "next/link";
import { notFound } from "next/navigation";
import {
  actualizarProspecto,
  agregarNota,
  cambiarEtapa,
  crearEvento,
  eliminarProspecto,
  posponer,
  registrarLlamada,
} from "@/app/actions";
import { Estrellas, Etapa, Prioridad, Web } from "@/components/Badges";
import BotonToque from "@/components/BotonToque";
import CamposProspecto from "@/components/FormProspecto";
import DeshacerUltimoToque from "@/components/DeshacerUltimoToque";
import EstadoCanales from "@/components/EstadoCanales";
import Etiquetas from "@/components/Etiquetas";
import { nombresEquipo, perfilDe, requerirUsuario } from "@/lib/auth";
import { ETAPAS, TIPOS_EVENTO, TIPO_EVENTO_LABEL } from "@/lib/constants";
import { fechaCorta, fechaHora, hoy } from "@/lib/dates";
import { select } from "@/lib/db";
import { plantillas } from "@/lib/data";
import { plantillaSugerida } from "@/lib/followup";
import { enlaceEmail, enlaceLlamada, enlaceWhatsApp, esCelular, motivoSinWhatsApp, prioridad, rellenar } from "@/lib/format";
import type { Activity, EventRow, Prospect } from "@/lib/types";

const ICONO: Record<string, string> = { whatsapp: "WhatsApp", llamada: "Llamada", email: "Email", nota: "Nota", estado: "Etapa" };

export default async function FichaProspecto({ params }: { params: Promise<{ id: string }> }) {
  const yo = await requerirUsuario();
  const { id } = await params;
  const [p] = await select<Prospect>(`prospects?select=*&id=eq.${id}`);
  if (!p) notFound();
  const [historial, eventos, tpl] = await Promise.all([
    select<Activity>(`activities?select=*&prospect_id=eq.${id}&order=created_at.desc&limit=100`),
    select<EventRow>(`events?select=*&prospect_id=eq.${id}&order=day.desc`),
    plantillas(),
  ]);

  const sugerida = plantillaSugerida(p.touches);
  const whatsapp = tpl.filter((t) => t.channel === "whatsapp");
  const emails = tpl.filter((t) => t.channel === "email");
  const celular = esCelular(p.phone);
  const ultimoToque = historial.find((a) => a.kind === "whatsapp" || a.kind === "email" || a.kind === "llamada");

  async function etapaAccion(f: FormData) {
    "use server";
    await cambiarEtapa(id, String(f.get("etapa")));
  }
  async function posponerAccion(f: FormData) {
    "use server";
    await posponer(id, Number(f.get("dias")));
  }
  async function eliminarAccion() {
    "use server";
    await eliminarProspecto(id);
  }

  return (
    <div className="space-y-4">
      <Link href="/prospectos" className="text-sm muted hover:text-white">← Prospectos</Link>

      <section className="card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">{p.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <Etapa etapa={p.stage} />
              <Web estado={p.web_status} />
              <Prioridad p={prioridad(p)} />
              <Estrellas rating={p.rating} reviews={p.reviews} />
              <Etiquetas tags={p.tags} />
            </div>
            <p className="text-sm muted mt-1">
              {p.category ?? "—"} · {p.district ?? "—"} · {p.phone ?? "sin teléfono"} {p.email ? `· ${p.email}` : ""}
            </p>
            {p.address && <p className="text-xs muted">{p.address}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoCanales p={p} />
            <Link href={`/flujo?p=${p.id}`} className="btn btn-primary">Flujo de contacto</Link>
            {enlaceLlamada(p.phone) && <a href={enlaceLlamada(p.phone)!} className="btn">Llamar</a>}
            {celular && <a href={enlaceWhatsApp(p.phone)!} target="_blank" rel="noreferrer" className="btn">Chat</a>}
            {p.maps_url && <a href={p.maps_url} target="_blank" rel="noreferrer" className="btn">Maps</a>}
            {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="btn">Redes</a>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <Dato k="Toques" v={`${p.touches} de 4`} />
          <Dato k="Primer contacto" v={fechaCorta(p.first_contact)} />
          <Dato k="Último contacto" v={fechaCorta(p.last_contact)} />
          <Dato k="Próximo seguimiento" v={fechaCorta(p.next_follow_up)} rojo={!!p.next_follow_up && p.next_follow_up <= hoy()} />
        </div>
        {ultimoToque && (
          <div className="flex flex-wrap items-center justify-end gap-2 text-xs muted">
            <span>¿Registraste un toque por error?</span>
            <DeshacerUltimoToque
              prospectId={p.id}
              ultimo={`${ICONO[ultimoToque.kind] ?? ultimoToque.kind}${ultimoToque.template ? ` ${ultimoToque.template}` : ""} del ${fechaHora(ultimoToque.created_at)}`}
            />
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <section className="card p-4 space-y-3">
            <h2 className="font-medium">WhatsApp</h2>
            {!celular && <p className="text-sm text-amber-300">{motivoSinWhatsApp(p.phone)}</p>}
            <div className="flex flex-wrap gap-2">
              {whatsapp.map((t) => (
                <BotonToque
                  key={t.code}
                  prospectId={p.id}
                  prospecto={p.name}
                  canal="whatsapp"
                  plantilla={t.code}
                  url={enlaceWhatsApp(p.phone, rellenar(t.body, p, yo, perfilDe(yo)))}
                  etiqueta={`${t.code} · ${t.name}`}
                  clase={`btn ${t.code === sugerida ? "btn-wa" : ""}`}
                />
              ))}
            </div>
            <p className="text-xs muted">Al pulsar te pedimos confirmación; luego se abre WhatsApp con el mensaje listo y se registra el toque. Verde = el que toca ahora.</p>
            {emails.length > 0 && (
              <>
                <h2 className="font-medium pt-2">Email</h2>
                <div className="flex flex-wrap gap-2">
                  {emails.map((t) => (
                    <BotonToque
                      key={t.code}
                      prospectId={p.id}
                      prospecto={p.name}
                      canal="email"
                      plantilla={t.code}
                      url={enlaceEmail(p.email, rellenar(t.subject ?? "", p, yo, perfilDe(yo)), rellenar(t.body, p, yo, perfilDe(yo)))}
                      etiqueta={t.name}
                    />
                  ))}
                </div>
                {!p.email && <p className="text-xs muted">Agrega un email en “Editar datos” para usar estas plantillas.</p>}
              </>
            )}
          </section>

          <section className="card p-4">
            <h2 className="font-medium mb-2">Registrar llamada</h2>
            <form action={registrarLlamada.bind(null, p.id)} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
              <select name="resultado" className="input">
                <option>No contestó</option>
                <option>Llamar luego</option>
                <option>Pidió info por WhatsApp</option>
                <option>Interesado</option>
                <option>No le interesa</option>
              </select>
              <input name="nota" className="input" placeholder="Nota (opcional): con quién hablé, a qué hora volver…" />
              <button className="btn btn-primary">Guardar</button>
            </form>
          </section>

          <section className="card p-4">
            <h2 className="font-medium mb-2">Historial</h2>
            <form action={agregarNota.bind(null, p.id)} className="flex gap-2 mb-3">
              <input name="nota" className="input" placeholder="Escribir una nota…" />
              <button className="btn">Anotar</button>
            </form>
            {historial.length === 0 ? (
              <p className="text-sm muted">Sin actividad todavía.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {historial.map((a) => (
                  <li key={a.id} className="border-l-2 border-[var(--accent)]/40 pl-3">
                    <div className="text-xs muted">
                      {fechaHora(a.created_at)} · {a.author ?? "—"} · <b className="text-white/70">{ICONO[a.kind] ?? a.kind}</b>
                      {a.template ? ` ${a.template}` : ""}
                    </div>
                    {a.detail && <div>{a.detail}</div>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-4 space-y-3">
            <h2 className="font-medium">Etapa y seguimiento</h2>
            <form action={etapaAccion} className="flex gap-2">
              <select name="etapa" defaultValue={p.stage} className="input">
                {ETAPAS.map((e) => <option key={e}>{e}</option>)}
              </select>
              <button className="btn btn-primary">Cambiar</button>
            </form>
            <form action={posponerAccion} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="muted">Seguimiento en:</span>
              {[1, 3, 7, 30].map((d) => (
                <button key={d} name="dias" value={d} className="btn !py-1 !px-2.5">{d === 1 ? "mañana" : `${d} días`}</button>
              ))}
            </form>
          </section>

          <section className="card p-4">
            <h2 className="font-medium mb-2">Agendar</h2>
            <form action={crearEvento} className="grid gap-2">
              <input type="hidden" name="prospect_id" value={p.id} />
              <input name="title" className="input" defaultValue={`Reunión con ${p.name}`} required />
              <div className="grid grid-cols-3 gap-2">
                <input name="day" type="date" className="input" required defaultValue={hoy()} />
                <input name="time" type="time" className="input" />
                <select name="kind" className="input">
                  {TIPOS_EVENTO.map((k) => <option key={k} value={k}>{TIPO_EVENTO_LABEL[k]}</option>)}
                </select>
              </div>
              <button className="btn btn-primary">Agendar</button>
            </form>
            {eventos.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {eventos.map((e) => (
                  <li key={e.id} className={e.done ? "line-through muted" : ""}>
                    {fechaCorta(e.day)} {e.time ?? ""} · {e.title}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <details className="card p-4">
            <summary className="font-bold cursor-pointer">Editar datos</summary>
            <form action={actualizarProspecto.bind(null, p.id)} className="mt-3 space-y-3">
              <CamposProspecto p={p} equipo={nombresEquipo()} conSeguimiento />
              <button className="btn btn-primary">Guardar cambios</button>
            </form>
            <form action={eliminarAccion} className="mt-4 border-t pt-3">
              <button className="text-sm font-semibold text-red-400">Eliminar prospecto</button>
            </form>
          </details>
        </div>
      </div>
    </div>
  );
}

function Dato({ k, v, rojo }: { k: string; v: string; rojo?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
      <div className="text-[11px] font-semibold muted uppercase">{k}</div>
      <div className={`font-semibold ${rojo ? "text-red-400" : ""}`}>{v}</div>
    </div>
  );
}
