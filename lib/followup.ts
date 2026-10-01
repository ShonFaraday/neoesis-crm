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

/**
 * Cambios al quitar el último toque. `restantes` son los toques que quedan en el historial,
 * del más reciente al más antiguo. Si ya no queda ninguno, el prospecto vuelve a "Nuevo".
 */
export function deshacerUltimo(
  p: Pick<Prospect, "touches" | "stage">,
  restantes: { day: string }[],
  contaba: boolean,
): Partial<Prospect> {
  const touches = contaba ? Math.max(0, p.touches - 1) : p.touches;

  if (restantes.length === 0) {
    // Toques sin historial (por ejemplo, importados): solo se corrige el contador.
    if (touches > 0) return { touches };
    return {
      touches,
      first_contact: null,
      last_contact: null,
      // En etapas más avanzadas (p. ej. Interesado) se respeta el seguimiento que ya tenían.
      ...(p.stage === "Contactado" ? { stage: "Nuevo", next_follow_up: null } : {}),
    };
  }

  const ultimo = restantes[0].day;
  const primero = restantes[restantes.length - 1].day;
  const cerrado = ETAPAS_CERRADAS.includes(p.stage);
  const dias = DIAS_SIGUIENTE_TOQUE[touches];
  return {
    touches,
    first_contact: primero,
    last_contact: ultimo,
    next_follow_up: !cerrado && dias ? sumarDias(ultimo, dias) : null,
  };
}
