import { selectAll } from "./db";
import { soloDigitos } from "./format";
import type { Registro } from "./types";

type Fila = Registro & { phone: string | null; place_id: string | null };

export type IndiceRegistros = { porPlace: Map<string, Registro>; porTelefono: Map<string, Registro> };

/** Prospectos de TODO el equipo, indexados por ficha de Maps y por teléfono, para detectar duplicados. */
export async function indiceRegistros(): Promise<IndiceRegistros> {
  const filas = await selectAll<Fila>("prospects?select=id,name,owner,stage,touches,last_contact,phone,place_id&order=created_at.asc");
  const porPlace = new Map<string, Registro>();
  const porTelefono = new Map<string, Registro>();
  for (const { phone, place_id, ...r } of filas) {
    if (place_id && !porPlace.has(place_id)) porPlace.set(place_id, r);
    const tel = soloDigitos(phone);
    if (tel.length >= 7 && !porTelefono.has(tel)) porTelefono.set(tel, r);
  }
  return { porPlace, porTelefono };
}

/** El prospecto existente que coincide por ficha de Maps o por teléfono, o null si es nuevo. */
export function buscarRegistro(indice: IndiceRegistros, d: { place_id?: string | null; phone?: string | null }): Registro | null {
  if (d.place_id) {
    const r = indice.porPlace.get(d.place_id);
    if (r) return r;
  }
  const tel = soloDigitos(d.phone);
  return tel.length >= 7 ? indice.porTelefono.get(tel) ?? null : null;
}
