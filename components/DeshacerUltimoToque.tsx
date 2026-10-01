"use client";

import { RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { deshacerUltimoToque } from "@/app/actions";
import { Dialogo } from "./ConfirmarToque";

/** Quita el último toque registrado (para clics por error detectados después). */
export default function DeshacerUltimoToque({ prospectId, ultimo }: { prospectId: string; ultimo: string | null }) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, start] = useTransition();
  if (!ultimo) return null;

  return (
    <>
      <button type="button" className="btn !py-1 !px-2.5 text-xs" disabled={pendiente} onClick={() => setAbierto(true)}>
        <RotateCcw className="size-3.5" /> {pendiente ? "Deshaciendo…" : "Deshacer último toque"}
      </button>
      {abierto && (
        <Dialogo
          pedido={{
            titulo: "¿Deshacer el último toque?",
            detalle: `Se quitará “${ultimo}” del historial, se restará un toque y se recalculará el próximo seguimiento. Si no queda ningún toque, el prospecto vuelve a “Nuevo”.`,
            accion: "Sí, deshacer",
          }}
          onCancelar={() => setAbierto(false)}
          onConfirmar={() => {
            setAbierto(false);
            start(() => deshacerUltimoToque(prospectId));
          }}
        />
      )}
    </>
  );
}
