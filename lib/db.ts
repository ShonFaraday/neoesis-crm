// Cliente mínimo para la API REST de Supabase (PostgREST), solo en el servidor.
const URL = process.env.SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export class DbError extends Error {}

function headers(extra: Record<string, string> = {}): HeadersInit {
  if (!URL || !KEY) throw new DbError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.");
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function call<T>(path: string, init: RequestInit & { headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    ...init,
    headers: headers(init.headers ?? {}),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new DbError(`Supabase ${res.status}: ${text}`);
  }
  if (res.status === 204) return [] as unknown as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : []) as T;
}

/** SELECT con query string de PostgREST, p. ej. "prospects?select=*&stage=eq.Nuevo" */
export function select<T>(query: string): Promise<T[]> {
  return call<T[]>(query);
}

/** SELECT que recorre todas las páginas (PostgREST corta en 1000 filas). */
export async function selectAll<T>(query: string, pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await call<T[]>(query, {
      headers: { Range: `${from}-${from + pageSize - 1}`, "Range-Unit": "items" },
    });
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

export function insert<T>(table: string, rows: object | object[], opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}): Promise<T[]> {
  const q = opts.onConflict ? `?on_conflict=${opts.onConflict}` : "";
  const prefer = ["return=representation"];
  if (opts.ignoreDuplicates) prefer.push("resolution=ignore-duplicates");
  return call<T[]>(`${table}${q}`, {
    method: "POST",
    body: JSON.stringify(rows),
    headers: { Prefer: prefer.join(",") },
  });
}

export function update<T>(table: string, filter: string, patch: object): Promise<T[]> {
  return call<T[]>(`${table}?${filter}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    headers: { Prefer: "return=representation" },
  });
}

export function remove(table: string, filter: string): Promise<unknown> {
  return call(`${table}?${filter}`, { method: "DELETE" });
}

/** Cuenta filas sin traerlas. */
export async function count(query: string): Promise<number> {
  const res = await fetch(`${URL}/rest/v1/${query}`, {
    method: "HEAD",
    headers: headers({ Prefer: "count=exact", Range: "0-0" }),
    cache: "no-store",
  });
  const range = res.headers.get("content-range") ?? "*/0";
  return Number(range.split("/")[1] ?? 0) || 0;
}

export const enc = encodeURIComponent;
