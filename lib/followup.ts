import { DIAS_SIGUIENTE_TOQUE, ETAPAS_CERRADAS, MAX_TOQUES } from "./constants";
import { sumarDias } from "./dates";
import type { Prospect } from "./types";

/**
 * Calcula los cambios de un prospecto al registrar un toque (WhatsApp, llamada o email de la secuencia).
 * Toque 1 → seguimiento en 2 días (día 3), toque 2 → +3 (día 6), toque 3 → +4 (día 10), toque 4 → fin de secuencia.
 */
export function cambiosPorToque(
  p: Pick<Prospect, "touches" | "stage" | "first_contact">,
  hoy: string,
  cuentaToque: boolean,
): Partial<Prospect> {
  const cambios: Partial<Prospect> = { last_contact: hoy };
  if (!p.first_contact) cambios.first_contact = hoy;
  if (p.stage === "Nuevo") cambios.stage = "Contactado";
  if (!cuentaToque) return cambios;

  const toques = Math.min(p.touches + 1, MAX_TOQUES);
  cambios.touches = toques;
  const cerrado = ETAPAS_CERRADAS.includes(cambios.stage ?? p.stage);
  const dias = DIAS_SIGUIENTE_TOQUE[toques];
  cambios.next_follow_up = !cerrado && dias ? sumarDias(hoy, dias) : null;
  return cambios;
}

/** Cambios al mover de etapa: las etapas cerradas limpian el seguimiento pendiente. */
export function cambiosPorEtapa(etapa: string): Partial<Prospect> {
  return ETAPAS_CERRADAS.includes(etapa) ? { stage: etapa, next_follow_up: null } : { stage: etapa };
}

/** Siguiente plantilla de WhatsApp según los toques hechos. */
export function plantillaSugerida(touches: number): string | null {
  return ["A", "B", "C", "D"][touches] ?? null;
}
