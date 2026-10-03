import { enc, select } from "./db";
import type { UltimoToque } from "./format";
import type { Template } from "./types";

export async function plantillas(): Promise<Template[]> {
  return select<Template>("templates?select=*&order=sort.asc");
}

export function plantillaPorCodigo(lista: Template[], code: string | null): Template | undefined {
  return code ? lista.find((t) => t.code === code) : undefined;
}

/** El último toque de cada prospecto, hecho por cualquier usuario del equipo. */
export async function ultimosToques(ids: string[]): Promise<Map<string, UltimoToque>> {
  const m = new Map<string, UltimoToque>();
  for (let i = 0; i < ids.length; i += 80) {
    const lote = ids.slice(i, i + 80);
    const filas = await select<UltimoToque>(
      `activities?select=prospect_id,author,kind,template,day&prospect_id=in.(${lote.join(",")})&kind=in.(whatsapp,llamada,email)&order=created_at.desc`,
    );
    for (const a of filas) if (!m.has(a.prospect_id)) m.set(a.prospect_id, a);
  }
  return m;
}

export { enc };
