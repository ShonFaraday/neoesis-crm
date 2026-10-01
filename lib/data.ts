import { enc, select } from "./db";
import type { Template } from "./types";

export async function plantillas(): Promise<Template[]> {
  return select<Template>("templates?select=*&order=sort.asc");
}

export function plantillaPorCodigo(lista: Template[], code: string | null): Template | undefined {
  return code ? lista.find((t) => t.code === code) : undefined;
}

export { enc };
