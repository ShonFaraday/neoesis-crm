import type { Prospect } from "./types";

/**
 * Número nacional peruano sin código de país (ej. "+51 987654321" → "987654321", "(01) 332-6249" → "13326249").
 * Si el número es de otro país (+58, +57…), devuelve "" para no armar enlaces peruanos erróneos.
 */
export function soloDigitos(tel: string | null | undefined): string {
  const raw = (tel ?? "").trim();
  let d = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) {
    if (!d.startsWith("51")) return "";
    return d.slice(2);
  }
  if (d.startsWith("51") && (d.length === 11 || d.length === 10)) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1); // fijo con 0 de larga distancia
  return d;
}

/** Formato guardado en el CRM: "+51 987654321". Respeta números que ya traen otro código de país. */
export function normalizarTelefono(tel: string | null | undefined, codigoPais = "51"): string | null {
  const raw = (tel ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("+") && !raw.replace(/\D/g, "").startsWith("51")) return raw;
  const d = soloDigitos(raw);
  return d ? `+${codigoPais} ${d}` : raw;
}

export function esCelular(tel: string | null | undefined): boolean {
  const d = soloDigitos(tel);
  return d.length === 9 && d.startsWith("9");
}

/** Motivo legible cuando no se puede usar WhatsApp. */
export function motivoSinWhatsApp(tel: string | null | undefined): string {
  if (!tel) return "Esta empresa no tiene teléfono registrado. Usa el email o búscalo en su ficha de Maps.";
  if (!soloDigitos(tel)) return "El número es de otro país; ábrelo manualmente en WhatsApp.";
  return `${tel} es un teléfono fijo: no tiene WhatsApp. Usa la llamada o el email.`;
}

export function enlaceWhatsApp(tel: string | null | undefined, texto?: string): string | null {
  if (!esCelular(tel)) return null;
  const base = `https://wa.me/51${soloDigitos(tel)}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

export function enlaceLlamada(tel: string | null | undefined): string | null {
  const d = soloDigitos(tel);
  if (!d) return null;
  return `tel:+51${d}`;
}

export function enlaceEmail(email: string | null | undefined, asunto: string, cuerpo: string): string | null {
  if (!email) return null;
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/** Reemplaza {negocio}, {rubro}, {distrito}, {resenas}, {estrellas}, {yo}, {mi_telefono}, {mi_correo}. */
export function rellenar(
  texto: string,
  p: Pick<Prospect, "name" | "category" | "district" | "reviews" | "rating">,
  yo: string,
  perfil?: { email?: string | null; telefono?: string | null },
): string {
  const rubro = (p.category ?? "su rubro").split(" / ")[0].toLowerCase();
  return texto
    .replaceAll("{negocio}", p.name)
    .replaceAll("{rubro}", rubro)
    .replaceAll("{distrito}", p.district ?? "su distrito")
    .replaceAll("{resenas}", String(p.reviews ?? 0))
    .replaceAll("{estrellas}", p.rating != null ? String(p.rating).replace(".", ",") : "buenas")
    .replaceAll("{yo}", yo)
    .replaceAll("{mi_telefono}", perfil?.telefono || process.env.TELEFONO_CONTACTO || "+51 940 009 717")
    .replaceAll("{mi_correo}", perfil?.email || "");
}

export function prioridad(p: Pick<Prospect, "reviews" | "rating">): "Alta" | "Media" | "Baja" {
  if ((p.reviews ?? 0) >= 20 && (p.rating ?? 0) >= 4) return "Alta";
  if ((p.reviews ?? 0) >= 5) return "Media";
  return "Baja";
}

export function dinero(n: number | null | undefined): string {
  return `US$ ${Math.round(Number(n ?? 0)).toLocaleString("es-PE")}`;
}

const REDES = [
  "facebook.com",
  "fb.com",
  "fb.me",
  "instagram.com",
  "tiktok.com",
  "linktr.ee",
  "wa.me",
  "whatsapp.com",
  "wa.link",
  "linkin.bio",
  "beacons.ai",
  "taplink.cc",
  "bio.link",
  "twitter.com",
  "x.com",
  "youtube.com",
  "linkedin.com",
  "m.me",
  "msha.ke",
];

export function clasificarWeb(url: string | null | undefined): "sin_web" | "solo_redes" | "con_web" {
  if (!url) return "sin_web";
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "con_web";
  }
  return REDES.some((r) => host === r || host.endsWith(`.${r}`)) ? "solo_redes" : "con_web";
}
