import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "neo_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

function usuarios(): Map<string, string> {
  const map = new Map<string, string>();
  for (const par of (process.env.TEAM_USERS ?? "").split(";")) {
    const i = par.indexOf(":");
    if (i > 0) map.set(par.slice(0, i).trim(), par.slice(i + 1).trim());
  }
  return map;
}

/** Correo y teléfono de cada miembro (TEAM_EMAILS="Angel:a@x.com;José:j@x.com", TELEFONO_CONTACTO compartido). */
export function perfilDe(nombre: string): { email: string | null; telefono: string } {
  let email: string | null = null;
  for (const par of (process.env.TEAM_EMAILS ?? "").split(";")) {
    const i = par.indexOf(":");
    if (i > 0 && par.slice(0, i).trim() === nombre) email = par.slice(i + 1).trim();
  }
  return { email, telefono: process.env.TELEFONO_CONTACTO || "+51 940 009 717" };
}

export function correosEquipo(): string[] {
  return (process.env.TEAM_EMAILS ?? "")
    .split(";")
    .map((p) => p.slice(p.indexOf(":") + 1).trim())
    .filter((e) => e.includes("@"));
}

export function nombresEquipo(): string[] {
  return [...usuarios().keys()];
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firmar(texto: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 16) throw new Error("AUTH_SECRET debe tener al menos 16 caracteres.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(texto)));
}

export async function verificarClave(nombre: string, clave: string): Promise<boolean> {
  const real = usuarios().get(nombre);
  return !!real && real === clave;
}

export async function iniciarSesion(nombre: string) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ n: nombre, t: Date.now() })));
  const firma = await firmar(payload);
  (await cookies()).set(COOKIE, `${payload}.${firma}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

export async function usuarioActual(): Promise<string | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;
  const [payload, firma] = valor.split(".");
  if (!payload || !firma) return null;
  if ((await firmar(payload)) !== firma) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(json, (c) => c.charCodeAt(0));
    const { n } = JSON.parse(new TextDecoder().decode(bytes)) as { n: string };
    return usuarios().has(n) ? n : null;
  } catch {
    return null;
  }
}

/** Para páginas y acciones: devuelve el usuario o manda al login. */
export async function requerirUsuario(): Promise<string> {
  const u = await usuarioActual();
  if (!u) redirect("/login");
  return u;
}
