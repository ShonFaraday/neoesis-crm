"use client";

import { useActionState } from "react";
import { crearProspecto, type EstadoCargaRapida } from "@/app/actions";
import AvisoDuplicado, { enviarSinBorrar } from "@/components/AvisoDuplicado";
import CamposProspecto from "@/components/FormProspecto";

/** Formulario de nuevo prospecto: avisa si el teléfono ya lo tiene otro usuario antes de crearlo. */
export default function FormNuevo({ yo, equipo }: { yo: string; equipo: string[] }) {
  const [estado, accion, guardando] = useActionState<EstadoCargaRapida | undefined, FormData>(crearProspecto, undefined);
  return (
    <form onSubmit={(e) => enviarSinBorrar(e, accion)} className="card p-4 space-y-4">
      <CamposProspecto p={{ owner: yo }} equipo={equipo} />
      {estado?.duplicado && <input type="hidden" name="forzar" value="1" />}
      <AvisoDuplicado estado={estado} boton="Guardar" />
      <button className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
    </form>
  );
}
