"use client";

import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { registrarToque } from "@/app/actions";
import { useToqueConfirmado } from "@/components/ConfirmarToque";

/** Tarjeta de plantilla ya rellena. Se puede retocar el texto antes de enviar. */
export function MensajeWhatsApp({ prospectId, prospecto, code, nombre, texto, telefono, sugerida }: { prospectId: string; prospecto: string; code: string; nombre: string; texto: string; telefono: string | null; sugerida: boolean }) {
  const [cuerpo, setCuerpo] = useState(texto);
  const { pedir, pendiente, ui } = useToqueConfirmado();
  const [enviado, setEnviado] = useState(false);
  return (
    <div className={`rounded-lg border p-3 ${sugerida ? "border-[var(--accent)]/70 bg-[var(--accent)]/[0.05]" : "border-[var(--line)]"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          <span className="mono mr-2 text-[var(--accent)]">{code}</span>
          {nombre}
        </span>
        {sugerida && <span className="mono text-[10px] tracking-widest text-[var(--accent)]">TOCA AHORA</span>}
      </div>
      <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={4} className="input text-[13px] leading-relaxed" />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={!telefono || pendiente}
          title={!telefono ? "Esta empresa no tiene celular" : undefined}
          className="btn btn-wa"
          onClick={() => {
            if (!telefono) return;
            pedir({
              prospectId,
              titulo: `¿Enviar la plantilla ${code} por WhatsApp?`,
              detalle: `Se abrirá WhatsApp con el mensaje y se registrará un toque para ${prospecto}: avanza la secuencia y programa el siguiente seguimiento.`,
              accion: "Sí, abrir WhatsApp",
              aviso: `WhatsApp ${code} registrado para ${prospecto}.`,
              abrir: () => window.open(`https://wa.me/51${telefono}?text=${encodeURIComponent(cuerpo)}`, "_blank", "noopener"),
              registrar: () => registrarToque(prospectId, "whatsapp", code),
              alRegistrar: () => setEnviado(true),
              alDeshacer: () => setEnviado(false),
            });
          }}
        >
          <Send className="size-4" /> {pendiente ? "Registrando…" : enviado ? "Enviado ✓ — enviar otra vez" : "Enviar al WhatsApp"}
        </button>
      </div>
      {ui}
    </div>
  );
}

export function MensajeEmail({ prospectId, prospecto, code, nombre, asunto, texto, email, cuentaGmail }: { prospectId: string; prospecto: string; code: string; nombre: string; asunto: string; texto: string; email: string | null; cuentaGmail?: string }) {
  const [titulo, setTitulo] = useState(asunto);
  const [cuerpo, setCuerpo] = useState(texto);
  const { pedir, pendiente, ui } = useToqueConfirmado();
  const [enviado, setEnviado] = useState(false);
  const enviar = (url: string, donde: string) =>
    pedir({
      prospectId,
      titulo: `¿Enviar “${nombre}” por correo?`,
      detalle: `Se abrirá ${donde} con el correo listo y se registrará un toque para ${prospecto}: avanza la secuencia y programa el siguiente seguimiento.`,
      accion: `Sí, abrir ${donde}`,
      aviso: `Correo ${code} registrado para ${prospecto}.`,
      abrir: () => window.open(url, "_blank", "noopener"),
      registrar: () => registrarToque(prospectId, "email", code),
      alRegistrar: () => setEnviado(true),
      alDeshacer: () => setEnviado(false),
    });
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email ?? "")}&su=${encodeURIComponent(titulo)}&body=${encodeURIComponent(cuerpo)}${cuentaGmail ? `&authuser=${encodeURIComponent(cuentaGmail)}` : ""}`;
  const mailto = `mailto:${email ?? ""}?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(cuerpo)}`;
  return (
    <div className="rounded-lg border border-[var(--line)] p-3">
      <div className="mb-2 text-sm font-medium">
        <span className="mono mr-2 text-[var(--accent)]">{code}</span>
        {nombre}
      </div>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input mb-2 text-[13px]" />
      <textarea value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} rows={6} className="input text-[13px] leading-relaxed" />
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <button type="button" disabled={!email || pendiente} className="btn" onClick={() => enviar(mailto, "tu correo")}>
          <Mail className="size-4" /> Enviar con mi correo
        </button>
        <button type="button" disabled={!email || pendiente} className="btn btn-primary" onClick={() => enviar(gmail, "Gmail")}>
          <Send className="size-4" /> {pendiente ? "Registrando…" : enviado ? "Enviado ✓" : "Enviar por Gmail corporativo"}
        </button>
      </div>
      {ui}
    </div>
  );
}

export function BotonesLlamada({ prospectId, prospecto, telefono, celular }: { prospectId: string; prospecto: string; telefono: string | null; celular: boolean }) {
  const { pedir, pendiente, ui } = useToqueConfirmado();
  const llamar = (abrir: () => void, por: string) =>
    pedir({
      prospectId,
      titulo: `¿Llamar a ${prospecto} ${por}?`,
      detalle: `Se abrirá la llamada y se registrará como toque: avanza la secuencia y programa el siguiente seguimiento.`,
      accion: "Sí, llamar",
      aviso: `Llamada registrada para ${prospecto}.`,
      abrir,
      registrar: () => registrarToque(prospectId, "llamada", null),
    });
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-wa"
        disabled={!celular || pendiente}
        title={!celular ? "No es un celular" : "Abre el chat; pulsa el ícono de teléfono para llamar"}
        onClick={() => llamar(() => window.open(`https://wa.me/51${telefono}`, "_blank", "noopener"), "por WhatsApp")}
      >
        <MessageCircle className="size-4" /> Llamar por WhatsApp
      </button>
      <button
        type="button"
        className="btn"
        disabled={!telefono || pendiente}
        onClick={() => llamar(() => (window.location.href = `tel:+51${telefono}`), "por teléfono")}
      >
        <Phone className="size-4" /> Llamar por teléfono
      </button>
      {ui}
    </div>
  );
}
