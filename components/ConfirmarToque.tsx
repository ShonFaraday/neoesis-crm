"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deshacerToque, type FotoToque } from "@/app/actions";

export type PedidoToque = {
  prospectId: string;
  titulo: string; // "¿Enviar la plantilla B por WhatsApp?"
  detalle: string; // Qué se va a registrar
  accion: string; // Texto del botón de confirmar
  aviso: string; // Texto del aviso tras registrar ("WhatsApp B registrado")
  abrir: () => void; // Abre WhatsApp / correo / llamada (debe ir dentro del clic)
  registrar: () => Promise<FotoToque>;
  alRegistrar?: () => void;
  alDeshacer?: () => void;
};

type Aviso = { pedido: PedidoToque; foto: FotoToque } | { error: string };

const SEGUNDOS_DESHACER = 12;

/**
 * Pide confirmación antes de abrir WhatsApp/correo/llamada y registrar el toque.
 * Después muestra un aviso con "Deshacer" durante unos segundos.
 */
export function useToqueConfirmado() {
  const [pedido, setPedido] = useState<PedidoToque | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [pendiente, start] = useTransition();

  // El aviso se cierra solo pasado un tiempo
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), SEGUNDOS_DESHACER * 1000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const confirmar = useCallback(() => {
    if (!pedido) return;
    const p = pedido;
    setPedido(null);
    p.abrir();
    start(async () => {
      try {
        const foto = await p.registrar();
        p.alRegistrar?.();
        setAviso({ pedido: p, foto });
      } catch {
        setAviso({ error: "No se pudo registrar el toque. Revisa tu conexión e inténtalo de nuevo." });
      }
    });
  }, [pedido]);

  const deshacer = useCallback(() => {
    if (!aviso || "error" in aviso) return;
    const { pedido: p, foto } = aviso;
    start(async () => {
      try {
        await deshacerToque(p.prospectId, foto);
        p.alDeshacer?.();
        setAviso(null);
      } catch {
        setAviso({ error: "No se pudo deshacer. Usa “Deshacer último toque” en la ficha del prospecto." });
      }
    });
  }, [aviso]);

  const ui = (
    <>
      {pedido && <Dialogo pedido={pedido} onConfirmar={confirmar} onCancelar={() => setPedido(null)} />}
      {aviso && <AvisoDeshacer aviso={aviso} pendiente={pendiente} onDeshacer={deshacer} onCerrar={() => setAviso(null)} />}
    </>
  );

  return { pedir: setPedido, pendiente, ui };
}

/** Ventana de confirmación (también la usa "Deshacer último toque"). */
export function Dialogo({ pedido, onConfirmar, onCancelar }: { pedido: Pick<PedidoToque, "titulo" | "detalle" | "accion">; onConfirmar: () => void; onCancelar: () => void }) {
  const confirmarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancelar]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onCancelar}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="toque-titulo"
        aria-describedby="toque-detalle"
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg bg-amber-400/10 p-2 text-amber-300">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <h2 id="toque-titulo" className="text-lg font-medium">{pedido.titulo}</h2>
            <p id="toque-detalle" className="mt-1 text-sm muted">{pedido.detalle}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn" onClick={onCancelar}>
            Cancelar
          </button>
          <button ref={confirmarRef} type="button" className="btn btn-primary" onClick={onConfirmar}>
            {pedido.accion}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AvisoDeshacer({ aviso, pendiente, onDeshacer, onCerrar }: { aviso: Aviso; pendiente: boolean; onDeshacer: () => void; onCerrar: () => void }) {
  return createPortal(
    <div role="status" className="fixed bottom-4 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="card flex items-center gap-3 px-4 py-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]" style={{ borderColor: "rgba(157, 116, 255, 0.5)" }}>
        <p className="min-w-0 flex-1 text-sm">{"error" in aviso ? <span className="text-red-300">{aviso.error}</span> : aviso.pedido.aviso}</p>
        {!("error" in aviso) && (
          <button type="button" className="btn !py-1.5" disabled={pendiente} onClick={onDeshacer}>
            <RotateCcw className="size-4" /> {pendiente ? "Deshaciendo…" : "Deshacer"}
          </button>
        )}
        <button type="button" className="muted hover:text-white" aria-label="Cerrar aviso" onClick={onCerrar}>
          <X className="size-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
