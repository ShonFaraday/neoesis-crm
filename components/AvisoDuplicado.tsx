"use client";

import Link from "next/link";
import { startTransition, type FormEvent } from "react";
import type { EstadoCargaRapida } from "@/app/actions";

/**
 * Envía el formulario sin que React lo vacíe al terminar: si aparece el aviso de duplicado,
 * los datos siguen ahí para confirmar con un segundo clic.
 */
export function enviarSinBorrar(e: FormEvent<HTMLFormElement>, accion: (f: FormData) => void) {
  e.preventDefault();
  const datos = new FormData(e.currentTarget);
  startTransition(() => accion(datos));
}

/** Mensaje de error o de teléfono ya registrado (por cualquier usuario), con enlace a la ficha. */
export default function AvisoDuplicado({ estado, boton }: { estado: EstadoCargaRapida | undefined; boton: string }) {
  if (!estado?.error) return null;
  return (
    <p className="text-sm text-red-400">
      {estado.error}{" "}
      {estado.duplicado && (
        <>
          <Link href={`/prospectos/${estado.duplicado.id}`} className="underline">Ver ficha</Link> · pulsa {boton} otra vez si es otro negocio.
        </>
      )}
    </p>
  );
}
