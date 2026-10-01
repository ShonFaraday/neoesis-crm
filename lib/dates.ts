// Lima no usa horario de verano: UTC-5 todo el año.
const OFFSET_MS = 5 * 60 * 60 * 1000;

/** Fecha de hoy en Lima como "YYYY-MM-DD". */
export function hoy(): string {
  return new Date(Date.now() - OFFSET_MS).toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DIAS[dow]} ${d} ${MESES[m - 1]}`;
}

export function nombreMes(y: number, m: number): string {
  return `${MESES_LARGO[m - 1]} ${y}`;
}

export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

export function fechaHora(ts: string): string {
  const d = new Date(Date.parse(ts) - OFFSET_MS);
  const iso = d.toISOString();
  return `${fechaCorta(iso.slice(0, 10))} ${iso.slice(11, 16)}`;
}
