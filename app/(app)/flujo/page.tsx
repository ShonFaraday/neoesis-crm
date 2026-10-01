import Link from "next/link";
import { Mail, MessageCircle, Pencil, Phone } from "lucide-react";
import { guardarEmail } from "@/app/actions";
import { Estrellas, Etapa, Web } from "@/components/Badges";
import EstadoCanales from "@/components/EstadoCanales";
import ResultadoCanal from "@/components/ResultadoCanal";
import { perfilDe, requerirUsuario } from "@/lib/auth";
import { fechaHora } from "@/lib/dates";
import { plantillas } from "@/lib/data";
import { select, selectAll } from "@/lib/db";
import { plantillaSugerida } from "@/lib/followup";
import { esCelular, motivoSinWhatsApp, rellenar, soloDigitos } from "@/lib/format";
import type { Prospect } from "@/lib/types";
import { BotonesLlamada, MensajeEmail, MensajeWhatsApp } from "./Mensaje";
import Selector from "./Selector";

type Opcion = Pick<Prospect, "id" | "name" | "district" | "category" | "stage">;

export default async function FlujoPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const yo = await requerirUsuario();
  const { p: id } = await searchParams;
  const [opciones, tpl] = await Promise.all([
    selectAll<Opcion>("prospects?select=id,name,district,category,stage&stage=not.in.(Perdido,Descartado)&order=updated_at.desc"),
    plantillas(),
  ]);
  const [p] = id ? await select<Prospect>(`prospects?select=*&id=eq.${id}`) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Flujo de contacto</h1>
          <p className="text-sm muted">Elige una empresa: los mensajes salen rellenos con sus datos. Solo pulsa enviar y anota la respuesta.</p>
        </div>
        <Link href="/flujo/plantillas" className="btn">
          <Pencil className="size-4" /> Editar plantillas
        </Link>
      </div>

      <section className="card p-4">
        <Selector opciones={opciones} actual={p?.id} />
      </section>

      {!p ? (
        <p className="card p-6 text-sm muted">Busca y elige una empresa para empezar.</p>
      ) : (
        <Contenido p={p} tpl={tpl} yo={yo} />
      )}
    </div>
  );
}

async function Contenido({ p, tpl, yo }: { p: Prospect; tpl: Awaited<ReturnType<typeof plantillas>>; yo: string }) {
  const sugerida = plantillaSugerida(p.touches);
  const celular = esCelular(p.phone);
  const tel = soloDigitos(p.phone);
  const wa = tpl.filter((t) => t.channel === "whatsapp");
  const mails = tpl.filter((t) => t.channel === "email");
  const perfil = perfilDe(yo);
  const cuentaGmail = perfil.email ?? process.env.EMAIL_CORPORATIVO;

  return (
    <>
      <section className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href={`/prospectos/${p.id}`} className="text-xl font-medium hover:underline">{p.name}</Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Etapa etapa={p.stage} />
              <Web estado={p.web_status} />
              <Estrellas rating={p.rating} reviews={p.reviews} />
            </div>
            <p className="mono mt-1.5 text-xs text-[var(--muted)]">
              {p.category ?? "—"} · {p.district ?? "—"} · {p.phone ?? "sin teléfono"} · {p.email ?? "sin email"}
            </p>
          </div>
          <div className="text-right">
            <p className="label">Registro</p>
            <EstadoCanales p={p} />
            <p className="mono mt-1 text-[10px] text-[var(--muted)]">{p.touches}/4 TOQUES</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 space-y-3">
          <Cabecera icono={<MessageCircle className="size-4" />} titulo="WhatsApp" estado={p.wa_sent_at ? `Enviado ${fechaHora(p.wa_sent_at)}` : "Sin enviar"} />
          {!celular && <p className="text-sm text-amber-300">{motivoSinWhatsApp(p.phone)}</p>}
          {wa.map((t) => (
            <MensajeWhatsApp
              key={t.code}
              prospectId={p.id}
              code={t.code}
              nombre={t.name}
              texto={rellenar(t.body, p, yo, perfil)}
              telefono={celular ? tel : null}
              sugerida={t.code === sugerida}
            />
          ))}
          <ResultadoCanal prospectId={p.id} canal="whatsapp" actual={p.wa_result} habilitado={!!p.wa_sent_at} />
        </section>

        <div className="space-y-4">
          <section className="card p-4 space-y-3">
            <Cabecera icono={<Phone className="size-4" />} titulo="Llamada" estado={p.call_at ? `Llamado ${fechaHora(p.call_at)}` : "Sin llamar"} />
            <p className="text-sm muted">
              Guion: preséntate, menciona sus {p.reviews} reseñas en Maps, que no tiene web y ofrece el boceto gratis por WhatsApp.
            </p>
            <BotonesLlamada prospectId={p.id} telefono={tel || null} celular={celular} />
            <ResultadoCanal prospectId={p.id} canal="llamada" actual={p.call_result} habilitado={!!p.call_at} />
          </section>

          <section className="card p-4 space-y-3">
            <Cabecera icono={<Mail className="size-4" />} titulo="Email" estado={p.email_sent_at ? `Enviado ${fechaHora(p.email_sent_at)}` : "Sin enviar"} />
            {!p.email && (
              <form action={guardarEmail.bind(null, p.id)} className="flex gap-2">
                <input name="email" type="email" required className="input" placeholder="Agrega el email de la empresa" />
                <button className="btn btn-primary">Guardar</button>
              </form>
            )}
            {mails.map((t) => (
              <MensajeEmail
                key={t.code}
                prospectId={p.id}
                code={t.code}
                nombre={t.name}
                asunto={rellenar(t.subject ?? "", p, yo, perfil)}
                texto={rellenar(t.body, p, yo, perfil)}
                email={p.email}
                cuentaGmail={cuentaGmail}
              />
            ))}
            <ResultadoCanal prospectId={p.id} canal="email" actual={p.email_result} habilitado={!!p.email_sent_at} />
          </section>
        </div>
      </div>
    </>
  );
}

function Cabecera({ icono, titulo, estado }: { icono: React.ReactNode; titulo: string; estado: string }) {
  const hecho = !estado.startsWith("Sin");
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-medium">
        <span className="text-[var(--accent)]">{icono}</span>
        {titulo}
      </h2>
      <span className={`mono text-[10px] uppercase tracking-wider ${hecho ? "text-white" : "text-[var(--muted)]"}`}>{estado}</span>
    </div>
  );
}
