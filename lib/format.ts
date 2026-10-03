import type { Activity, Prospect } from "./types";

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

/** Cómo hablarle a cada rubro: qué controlaría su sistema, qué tendría su web y cómo llamar a sus clientes. */
type PerfilRubro = { taller: boolean; sistema: string; web: string; clientes: string };

export function perfilRubro(categoria: string | null | undefined): PerfilRubro {
  const c = (categoria ?? "").toLowerCase();
  if (/taller|mecánic|mecanic/.test(c))
    return { taller: true, clientes: "clientes", sistema: "stock de almacén y repuestos, clientes y sus vehículos, órdenes de trabajo, servicios pendientes, citas agendadas y cobros", web: "sus servicios, botón de WhatsApp para pedir cita, ubicación y sus reseñas" };
  if (/lavado|llanter|repuesto/.test(c))
    return { taller: false, clientes: "clientes", sistema: "stock de productos y repuestos, clientes y sus vehículos, servicios pendientes, turnos agendados y caja", web: "sus servicios y precios, botón de WhatsApp, ubicación y sus reseñas" };
  if (/carpinter|vidrier|aluminio|imprenta|gráfica|grafica/.test(c))
    return { taller: false, clientes: "clientes", sistema: "cotizaciones, pedidos y fechas de entrega, stock de materiales, clientes, trabajos pendientes y cobros", web: "galería de trabajos, botón de WhatsApp para cotizar, ubicación y sus reseñas" };
  if (/dental|médic|medic|fisio|psic|nutri|óptica|optica|laboratorio|podolog/.test(c))
    return { taller: false, clientes: "pacientes", sistema: "pacientes e historial clínico, citas agendadas, recordatorios, tratamientos pendientes, inventario de insumos y cobros", web: "sus especialidades, reserva de citas por WhatsApp, ubicación y sus reseñas" };
  if (/veterin/.test(c))
    return { taller: false, clientes: "clientes", sistema: "mascotas y su historial, dueños, citas y vacunas agendadas, recordatorios, inventario de medicinas y cobros", web: "sus servicios, reserva de citas por WhatsApp, ubicación y sus reseñas" };
  if (/belleza|barber|spa|estétic|estetic|uñas|manicure|tatuaje/.test(c))
    return { taller: false, clientes: "clientes", sistema: "clientes, citas agendadas, servicios por estilista, paquetes, inventario de productos y caja", web: "catálogo de servicios y precios, reserva por WhatsApp, fotos de trabajos y sus reseñas" };
  if (/gimnasio|yoga/.test(c))
    return { taller: false, clientes: "alumnos", sistema: "socios, membresías y vencimientos, horarios y clases, asistencia, pagos pendientes y caja", web: "planes y horarios, inscripción por WhatsApp, ubicación y sus reseñas" };
  if (/restaurante|cafeter|pasteler|panader|poller|cevicher/.test(c))
    return { taller: false, clientes: "comensales", sistema: "pedidos, reservas, inventario de insumos, delivery, pedidos pendientes y caja", web: "carta digital, pedidos y reservas por WhatsApp, ubicación y sus reseñas" };
  if (/academia|nido|inicial|colegio|idiomas|música|musica/.test(c))
    return { taller: false, clientes: "alumnos", sistema: "alumnos, matrículas, pagos y pensiones, horarios, asistencia y comunicados a padres", web: "programas y horarios, matrícula por WhatsApp, fotos del local y sus reseñas" };
  if (/hostal|hotel|eventos|fotógraf|fotograf|viajes/.test(c))
    return { taller: false, clientes: "clientes", sistema: "reservas, calendario de fechas, clientes, pagos y adelantos, y servicios pendientes", web: "galería, paquetes y precios, reservas por WhatsApp y sus reseñas" };
  if (/abogad|contador|notar|trámite|tramite|inmobiliar|arquitect|construc/.test(c))
    return { taller: false, clientes: "clientes", sistema: "clientes y expedientes, casos o proyectos pendientes, citas agendadas, documentos, vencimientos y cobros", web: "sus servicios, consultas por WhatsApp, casos o proyectos realizados y sus reseñas" };
  return { taller: false, clientes: "clientes", sistema: "clientes, inventario o stock, servicios pendientes, citas agendadas y cobros", web: "sus servicios, botón de WhatsApp, ubicación y sus reseñas" };
}

/** Ejemplos del sistema administrativo según el rubro del negocio. */
export function ejemplosSistema(categoria: string | null | undefined): string {
  return perfilRubro(categoria).sistema;
}

/**
 * Frase sobre las reseñas de Google Maps según cuántas tenga el negocio (0, menos de 15, o 15 o más).
 */
export function ganchoResenas(p: Pick<Prospect, "reviews" | "rating" | "category">): string {
  const n = p.reviews ?? 0;
  const estrellas = p.rating != null ? String(p.rating).replace(".", ",") : null;
  const clientes = perfilRubro(p.category).clientes;
  if (n === 0)
    return `Vi su ficha en Google Maps y todavía no tiene ninguna reseña. ¿Sabía que la mayoría de personas elige el negocio que ve con más opiniones? Ahí hay una gran oportunidad: podemos ayudarle a que esos números suban y a que más ${clientes} lleguen a usted.`;
  if (n < 15)
    return `Vi su ficha en Google Maps (${n} ${n === 1 ? "reseña" : "reseñas"}${estrellas ? `, ${estrellas} estrellas` : ""}) y veo que no tienen muchas interacciones en su perfil público del mapa cada vez que alguien busca un negocio como el suyo. Podemos ayudarle a ganar visibilidad y a encontrar más ${clientes} potenciales.`;
  return `Vi su ficha en Google Maps: ${n} reseñas${estrellas ? ` con ${estrellas} estrellas` : ""}, se nota que sus ${clientes} están contentos.`;
}

/** Línea que presenta la demo de Mi Mecánico, adaptada a si el prospecto es un taller o no. */
export function demoSistema(categoria: string | null | undefined): string {
  return perfilRubro(categoria).taller
    ? "Así se ve el sistema que hicimos para un taller como el suyo"
    : "Así se ve un sistema que hicimos para un taller mecánico; el de {negocio} lo adaptamos a su {rubro}";
}

/**
 * Reemplaza {negocio}, {rubro}, {distrito}, {resenas}, {estrellas}, {yo}, {mi_telefono}, {mi_correo},
 * {gancho_resenas}, {sistema_ejemplos}, {web_ejemplos}, {demo_sistema}, {link_sistema} y {link_neoesis}.
 */
export function rellenar(
  texto: string,
  p: Pick<Prospect, "name" | "category" | "district" | "reviews" | "rating">,
  yo: string,
  perfil?: { email?: string | null; telefono?: string | null },
): string {
  const rubro = (p.category ?? "su rubro").split(" / ")[0].toLowerCase();
  // Primero las frases armadas: pueden traer {rubro}, {distrito} o {negocio} adentro.
  return texto
    .replaceAll("{gancho_resenas}", ganchoResenas(p))
    .replaceAll("{demo_sistema}", demoSistema(p.category))
    .replaceAll("{sistema_ejemplos}", perfilRubro(p.category).sistema)
    .replaceAll("{web_ejemplos}", perfilRubro(p.category).web)
    .replaceAll("{link_sistema}", process.env.LINK_DEMO_SISTEMA || "https://mimecanicoo.vercel.app")
    .replaceAll("{link_neoesis}", process.env.LINK_COTIZADOR || "https://neoesis-devs.vercel.app/cotizar")
    .replaceAll("{negocio}", p.name)
    .replaceAll("{rubro}", rubro)
    .replaceAll("{distrito}", p.district ?? "su distrito")
    .replaceAll("{resenas}", String(p.reviews ?? 0))
    .replaceAll("{estrellas}", p.rating != null ? String(p.rating).replace(".", ",") : "buenas")
    .replaceAll("{yo}", yo)
    .replaceAll("{mi_telefono}", perfil?.telefono || process.env.TELEFONO_CONTACTO || "+51 940 009 717")
    .replaceAll("{mi_correo}", perfil?.email || "");
}

/** "Sin contactar aún" o "Contactado · 2 toques · último 28/09". */
export function estadoContacto(r: Pick<Prospect, "touches" | "last_contact">): string {
  const fecha = r.last_contact ? r.last_contact.slice(0, 10).split("-").reverse().slice(0, 2).join("/") : null;
  if (!r.touches && !fecha) return "Sin contactar aún";
  return `Contactado · ${r.touches} ${r.touches === 1 ? "toque" : "toques"}${fecha ? ` · último ${fecha}` : ""}`;
}

/** Resumen de un prospecto ya registrado: quién lo tiene, si se contactó y en qué etapa está. */
export function describirRegistro(r: Pick<Prospect, "owner" | "stage" | "touches" | "last_contact">): string {
  return `Registrado por ${r.owner ?? "nadie asignado"} · ${estadoContacto(r)} · Etapa: ${r.stage}`;
}

/** Datos del último toque (WhatsApp, llamada o correo) de un prospecto. */
export type UltimoToque = Pick<Activity, "prospect_id" | "author" | "kind" | "template" | "day">;

const CANAL_TXT: Record<string, string> = { whatsapp: "WhatsApp", llamada: "llamada", email: "correo" };

/** "José el 28/09 (WhatsApp A)" */
export function textoToque(a: Omit<UltimoToque, "prospect_id">): string {
  const fecha = a.day.slice(0, 10).split("-").reverse().slice(0, 2).join("/");
  return `${a.author ?? "alguien"} el ${fecha} (${CANAL_TXT[a.kind] ?? a.kind}${a.template ? ` ${a.template}` : ""})`;
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
