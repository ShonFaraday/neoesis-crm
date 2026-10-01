"use client";

import { registrarToque } from "@/app/actions";
import { useToqueConfirmado } from "./ConfirmarToque";

type Props = {
  prospectId: string;
  prospecto: string;
  url: string | null;
  canal: "whatsapp" | "email" | "llamada";
  plantilla: string | null;
  etiqueta: string;
  clase?: string;
};

const NOMBRE_CANAL = { whatsapp: "WhatsApp", email: "correo", llamada: "llamada" } as const;

/** Abre WhatsApp / correo / llamada y registra el toque, previa confirmación (con opción de deshacer). */
export default function BotonToque({ prospectId, prospecto, url, canal, plantilla, etiqueta, clase }: Props) {
  const { pedir, pendiente, ui } = useToqueConfirmado();
  const canalTxt = NOMBRE_CANAL[canal];
  const que = plantilla ? `la plantilla ${plantilla} por ${canalTxt}` : `por ${canalTxt}`;

  return (
    <>
      <button
        type="button"
        className={clase ?? `btn ${canal === "whatsapp" ? "btn-wa" : ""}`}
        disabled={!url || pendiente}
        title={!url ? (canal === "whatsapp" ? "No es un celular" : "Sin dato de contacto") : undefined}
        onClick={() => {
          if (!url) return;
          pedir({
            prospectId,
            titulo: canal === "llamada" ? `¿Llamar a ${prospecto}?` : `¿Enviar ${que}?`,
            detalle: `Se abrirá ${canal === "llamada" ? "la llamada" : canal === "email" ? "tu correo" : "WhatsApp"} y se registrará un toque para ${prospecto}: avanza la secuencia y programa el siguiente seguimiento.`,
            accion: canal === "llamada" ? "Sí, llamar" : `Sí, abrir ${canalTxt}`,
            aviso:
              canal === "llamada"
                ? `Llamada registrada para ${prospecto}.`
                : `${canal === "email" ? "Correo" : "WhatsApp"}${plantilla ? ` ${plantilla}` : ""} registrado para ${prospecto}.`,
            abrir: () => {
              if (canal === "llamada") window.location.href = url;
              else window.open(url, "_blank", "noopener");
            },
            registrar: () => registrarToque(prospectId, canal, plantilla),
          });
        }}
      >
        {pendiente ? "Registrando…" : etiqueta}
      </button>
      {ui}
    </>
  );
}
