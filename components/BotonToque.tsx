"use client";

import { useTransition } from "react";
import { registrarToque } from "@/app/actions";

type Props = {
  prospectId: string;
  url: string | null;
  canal: "whatsapp" | "email" | "llamada";
  plantilla: string | null;
  etiqueta: string;
  clase?: string;
};

/** Abre WhatsApp / correo / llamada y registra el toque (seguimiento automático). */
export default function BotonToque({ prospectId, url, canal, plantilla, etiqueta, clase }: Props) {
  const [pendiente, start] = useTransition();
  return (
    <button
      type="button"
      className={clase ?? `btn ${canal === "whatsapp" ? "btn-wa" : ""}`}
      disabled={!url || pendiente}
      title={!url ? (canal === "whatsapp" ? "No es un celular" : "Sin dato de contacto") : undefined}
      onClick={() => {
        if (!url) return;
        if (canal === "llamada") window.location.href = url;
        else window.open(url, "_blank", "noopener");
        start(() => registrarToque(prospectId, canal, plantilla));
      }}
    >
      {pendiente ? "Registrando…" : etiqueta}
    </button>
  );
}
