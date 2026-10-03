"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cerrarSesion, iniciarSesion, requerirUsuario, verificarClave } from "@/lib/auth";
import { ETAPAS, RUBROS } from "@/lib/constants";
import { hoy, sumarDias } from "@/lib/dates";
import { count, enc, insert, remove, select, update } from "@/lib/db";
import { cambiosPorEtapa, cambiosPorToque, deshacerUltimo } from "@/lib/followup";
import { buscarLugares } from "@/lib/places";
import { indiceRegistros, buscarRegistro } from "@/lib/duplicados";
import { describirRegistro, normalizarTelefono, textoToque, type UltimoToque } from "@/lib/format";
import { PLANTILLAS_WHATSAPP } from "@/lib/plantillas-recomendadas";
import type { Activity, PlaceResult, Prospect, Registro, Template } from "@/lib/types";

const txt = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = txt(f, k);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

function refrescar(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/prospectos/${id}`);
}

// ---------------- Sesión ----------------

export async function login(_prev: { error?: string } | undefined, f: FormData) {
  const nombre = txt(f, "nombre") ?? "";
  const clave = txt(f, "clave") ?? "";
  if (!(await verificarClave(nombre, clave))) return { error: "Nombre o clave incorrectos." };
  await iniciarSesion(nombre);
  redirect("/");
}

export async function logout() {
  await cerrarSesion();
  redirect("/login");
}

// ---------------- Captura (Google Places) ----------------

export type EstadoBusqueda = {
  error?: string;
  resultados?: PlaceResult[];
  consultas?: number;
  cupo?: Cupo;
};

export type Cupo = { usadasMes: number; limiteMes: number; usadasDia: number; limiteDia: number; restantes: number };

/** Google regala 1.000 consultas al mes de este tipo. Nunca permitimos pasar de 950. */
const TOPE_GRATIS_MES = 950;

export async function cupoGoogle(): Promise<Cupo> {
  const d = hoy();
  const inicioMes = `${d.slice(0, 7)}-01T05:00:00Z`;
  const inicioDia = `${d}T05:00:00Z`;
  const limiteMes = Math.min(Number(process.env.PLACES_MAX_BUSQUEDAS_MES ?? TOPE_GRATIS_MES) || TOPE_GRATIS_MES, TOPE_GRATIS_MES);
  const limiteDia = Math.min(Number(process.env.PLACES_MAX_BUSQUEDAS_DIA ?? 30) || 30, limiteMes);
  const [usadasMes, usadasDia] = await Promise.all([
    count(`searches?select=id&created_at=gte.${enc(inicioMes)}`),
    count(`searches?select=id&created_at=gte.${enc(inicioDia)}`),
  ]);
  const restantes = Math.max(0, Math.min(limiteMes - usadasMes, limiteDia - usadasDia));
  return { usadasMes, limiteMes, usadasDia, limiteDia, restantes };
}

/**
 * Busca UN rubro en UN distrito. La pantalla de Captura la llama una vez por rubro
 * (búsqueda simple) o varias veces seguidas (barrido del distrito).
 */
export async function buscarRubro(entrada: { rubro: string; distrito: string; libre?: string; paginas?: number }): Promise<EstadoBusqueda> {
  const yo = await requerirUsuario();
  const paginas = Math.min(Math.max(Number(entrada.paginas ?? 1), 1), 3);
  const libre = entrada.libre?.trim();
  const termino = libre || RUBROS.find((r) => r.nombre === entrada.rubro)?.busqueda || entrada.rubro;
  const rubro = libre ? "Otro" : entrada.rubro;
  if (!termino || !entrada.distrito) return { error: "Elige un rubro (o escribe una búsqueda) y un distrito." };

  const cupo = await cupoGoogle();
  if (paginas > cupo.restantes) {
    const motivo = cupo.usadasDia >= cupo.limiteDia ? `el tope diario de ${cupo.limiteDia} consultas. Mañana se renueva` : `el tope gratuito de ${cupo.limiteMes} consultas este mes. El 1.º se renueva`;
    return { error: `Se alcanzó ${motivo}. Así Google nunca le cobra.`, cupo };
  }

  const consulta = `${termino} en ${entrada.distrito}, Lima, Perú`;
  try {
    const { lugares, consultas } = await buscarLugares(consulta, paginas, async () => {
      await insert("searches", { query: consulta, results: 0, author: yo });
    });
    // Se compara contra los prospectos de todo el equipo, por ficha de Maps y por teléfono.
    const indice = await indiceRegistros();
    const resultados: PlaceResult[] = lugares.map((l) => {
      const registro = buscarRegistro(indice, l);
      return { ...l, rubro, ya_registrado: !!registro, registro };
    });
    return { resultados, consultas, cupo: await cupoGoogle() };
  } catch (e) {
    return { error: (e as Error).message, cupo: await cupoGoogle() };
  }
}

export async function agregarDesdeMaps(entrada: { distrito: string; lugares: PlaceResult[] }): Promise<{ agregados: number }> {
  const yo = await requerirUsuario();
  // Por si otro usuario lo agregó mientras tanto (o ya existe con el mismo teléfono).
  const indice = await indiceRegistros();
  const nuevos = entrada.lugares.filter((l) => !buscarRegistro(indice, l));
  if (!nuevos.length) return { agregados: 0 };
  const filas = nuevos.map((l) => ({
    place_id: l.place_id,
    name: l.name,
    category: l.rubro,
    district: entrada.distrito,
    address: l.address,
    phone: normalizarTelefono(l.phone),
    website: l.website,
    web_status: l.web_status,
    rating: l.rating,
    reviews: l.reviews,
    maps_url: l.maps_url,
    owner: yo,
    stage: "Nuevo",
    notes: l.tipo ? `Tipo en Google: ${l.tipo}` : null,
  }));
  const res = await insert<Prospect>("prospects", filas, { onConflict: "place_id", ignoreDuplicates: true });
  refrescar();
  return { agregados: res.length };
}

// ---------------- Carga rápida (sin Google) ----------------

export type EstadoCargaRapida = { ok?: string; error?: string; duplicado?: Registro };

/** Si el teléfono ya está en el CRM (de cualquier usuario), el aviso con quién lo tiene y cómo va. */
async function avisoDuplicado(phone: string | null): Promise<{ error: string; duplicado: Registro } | null> {
  const dup = buscarRegistro(await indiceRegistros(), { phone });
  return dup ? { error: `Ese teléfono ya está registrado en “${dup.name}”. ${describirRegistro(dup)}.`, duplicado: dup } : null;
}

/** Agrega un negocio copiado a mano desde Google Maps. Avisa si el teléfono ya existe. */
export async function cargaRapida(_prev: EstadoCargaRapida | undefined, f: FormData): Promise<EstadoCargaRapida> {
  const yo = await requerirUsuario();
  const name = txt(f, "name");
  if (!name) return { error: "Escribe el nombre del negocio." };
  const phone = txt(f, "phone");
  if (f.get("forzar") !== "1") {
    const aviso = await avisoDuplicado(phone);
    if (aviso) return aviso;
  }
  await insert("prospects", {
    name,
    category: txt(f, "category"),
    district: txt(f, "district"),
    phone: normalizarTelefono(phone),
    reviews: num(f, "reviews") ?? 0,
    rating: num(f, "rating"),
    web_status: txt(f, "web_status") ?? "sin_web",
    maps_url: txt(f, "maps_url"),
    owner: yo,
    stage: "Nuevo",
  });
  refrescar();
  return { ok: `“${name}” agregado.` };
}

// ---------------- Prospectos ----------------

function datosProspecto(f: FormData) {
  return {
    name: txt(f, "name") ?? "(sin nombre)",
    category: txt(f, "category"),
    district: txt(f, "district"),
    address: txt(f, "address"),
    phone: normalizarTelefono(txt(f, "phone")),
    email: txt(f, "email"),
    reviews: num(f, "reviews") ?? 0,
    rating: num(f, "rating"),
    web_status: txt(f, "web_status") ?? "sin_web",
    website: txt(f, "website"),
    maps_url: txt(f, "maps_url"),
    owner: txt(f, "owner"),
    amount_usd: num(f, "amount_usd"),
    notes: txt(f, "notes"),
    tags: (txt(f, "tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };
}

/** Crea un prospecto a mano. Si el teléfono ya existe, avisa primero; se crea igual al confirmar (`forzar`). */
export async function crearProspecto(_prev: EstadoCargaRapida | undefined, f: FormData): Promise<EstadoCargaRapida> {
  const yo = await requerirUsuario();
  const datos = datosProspecto(f);
  if (f.get("forzar") !== "1") {
    const aviso = await avisoDuplicado(datos.phone);
    if (aviso) return aviso;
  }
  const [p] = await insert<Prospect>("prospects", { ...datos, owner: datos.owner ?? yo, stage: "Nuevo" });
  refrescar();
  redirect(`/prospectos/${p.id}`);
}

export async function actualizarProspecto(id: string, f: FormData) {
  await requerirUsuario();
  const datos = datosProspecto(f);
  const seguimiento = txt(f, "next_follow_up");
  await update("prospects", `id=eq.${id}`, { ...datos, next_follow_up: seguimiento, updated_at: new Date().toISOString() });
  refrescar(id);
}

export async function eliminarProspecto(id: string) {
  await requerirUsuario();
  await remove("prospects", `id=eq.${id}`);
  refrescar();
  redirect("/prospectos");
}

async function traer(id: string): Promise<Prospect> {
  const [p] = await select<Prospect>(`prospects?select=*&id=eq.${id}`);
  if (!p) throw new Error("Prospecto no encontrado");
  return p;
}

/** Registra un toque con plantilla (se llama después de abrir WhatsApp o el correo). */
const COLUMNA_ENVIO = { whatsapp: "wa_sent_at", email: "email_sent_at", llamada: "call_at" } as const;
const CANALES_TOQUE = ["whatsapp", "email", "llamada"] as const;

/** Campos que cambia un toque. Se guardan antes de registrarlo para poder deshacerlo. */
const CAMPOS_TOQUE = ["owner", "touches", "stage", "first_contact", "last_contact", "next_follow_up", "wa_sent_at", "email_sent_at", "call_at"] as const;
export type FotoToque = { actividad: string; antes: Pick<Prospect, (typeof CAMPOS_TOQUE)[number]> };

/** Registra un toque y devuelve cómo estaba el prospecto antes, para el botón "Deshacer". */
export async function registrarToque(id: string, canal: "whatsapp" | "email" | "llamada", plantilla: string | null, detalle?: string): Promise<FotoToque> {
  const yo = await requerirUsuario();
  const p = await traer(id);
  let cuenta = true;
  if (plantilla) {
    const [t] = await select<Template>(`templates?select=counts_touch&code=eq.${enc(plantilla)}`);
    cuenta = t?.counts_touch ?? true;
  }
  const antes = Object.fromEntries(CAMPOS_TOQUE.map((k) => [k, p[k]])) as FotoToque["antes"];
  const cambios: Partial<Prospect> = cambiosPorToque(p, hoy(), cuenta);
  // Quien hace el primer contacto queda como encargado para todo el equipo.
  if (!p.first_contact && p.stage === "Nuevo") cambios.owner = yo;
  const ahora = new Date().toISOString();
  await update("prospects", `id=eq.${id}`, { ...cambios, [COLUMNA_ENVIO[canal]]: ahora, updated_at: ahora });
  const [actividad] = await insert<Activity>("activities", { prospect_id: id, kind: canal, template: plantilla, detail: detalle ?? null, author: yo });
  refrescar(id);
  revalidatePath("/flujo");
  return { actividad: actividad.id, antes };
}

/**
 * Si el último toque de este prospecto lo hizo OTRO usuario, devuelve el aviso para la ventana
 * de confirmación (así nadie repite un contacto sin saberlo). Se consulta en el momento del clic.
 */
export async function avisoToqueAjeno(prospectId: string): Promise<string | null> {
  const yo = await requerirUsuario();
  const [a] = await select<UltimoToque>(
    `activities?select=prospect_id,author,kind,template,day&prospect_id=eq.${enc(prospectId)}&kind=in.(${CANALES_TOQUE.join(",")})&order=created_at.desc&limit=1`,
  );
  if (!a?.author || a.author === yo) return null;
  return `Ojo: este negocio ya lo contactó ${textoToque(a)}. Revisa su historial antes de repetir el contacto.`;
}

/** Deshace un toque recién registrado: devuelve el prospecto a como estaba y borra la actividad. */
export async function deshacerToque(id: string, foto: FotoToque) {
  const yo = await requerirUsuario();
  const p = await traer(id);
  const antes = Object.fromEntries(CAMPOS_TOQUE.map((k) => [k, foto.antes[k] ?? null])) as Record<string, unknown>;
  if (!(ETAPAS as readonly string[]).includes(String(antes.stage))) antes.stage = p.stage;
  antes.touches = Math.max(0, Number(antes.touches) || 0);
  await remove("activities", `id=eq.${enc(foto.actividad)}&prospect_id=eq.${id}`);
  await update("prospects", `id=eq.${id}`, { ...antes, updated_at: new Date().toISOString() });
  await insert("activities", { prospect_id: id, kind: "estado", detail: "Toque deshecho (clic por error)", author: yo });
  refrescar(id);
  revalidatePath("/flujo");
}

/**
 * Quita el último toque registrado (WhatsApp, email o llamada) y recalcula el seguimiento
 * con los toques que quedan. Sirve para corregir clics por error detectados después.
 */
export async function deshacerUltimoToque(id: string) {
  const yo = await requerirUsuario();
  const p = await traer(id);
  const toques = await select<Activity>(
    `activities?select=*&prospect_id=eq.${id}&kind=in.(${CANALES_TOQUE.join(",")})&order=created_at.desc`,
  );
  const [ultimo, ...resto] = toques;
  if (!ultimo) return;

  let contaba = true;
  if (ultimo.template) {
    const [t] = await select<Template>(`templates?select=counts_touch&code=eq.${enc(ultimo.template)}`);
    contaba = t?.counts_touch ?? true;
  }
  const cambios = deshacerUltimo(p, resto, contaba);
  const canal = ultimo.kind as (typeof CANALES_TOQUE)[number];
  const mismoCanal = resto.find((a) => a.kind === canal);

  await remove("activities", `id=eq.${ultimo.id}`);
  await update("prospects", `id=eq.${id}`, {
    ...cambios,
    [COLUMNA_ENVIO[canal]]: mismoCanal?.created_at ?? null,
    updated_at: new Date().toISOString(),
  });
  const nombre = canal === "whatsapp" ? "WhatsApp" : canal === "email" ? "Email" : "Llamada";
  await insert("activities", {
    prospect_id: id,
    kind: "estado",
    detail: `Toque deshecho: ${nombre}${ultimo.template ? ` ${ultimo.template}` : ""} del ${ultimo.day}`,
    author: yo,
  });
  refrescar(id);
  revalidatePath("/flujo");
}

export async function registrarLlamada(id: string, f: FormData) {
  const resultado = txt(f, "resultado") ?? "Llamada";
  const nota = txt(f, "nota");
  await registrarToque(id, "llamada", null, nota ? `${resultado} — ${nota}` : resultado);
  if (resultado === "Interesado") await cambiarEtapa(id, "Interesado");
  if (resultado === "No le interesa") await cambiarEtapa(id, "Perdido");
}

export async function agregarNota(id: string, f: FormData) {
  const yo = await requerirUsuario();
  const nota = txt(f, "nota");
  if (!nota) return;
  await insert("activities", { prospect_id: id, kind: "nota", detail: nota, author: yo });
  refrescar(id);
}

export async function cambiarEtapa(id: string, etapa: string) {
  const yo = await requerirUsuario();
  if (!(ETAPAS as readonly string[]).includes(etapa)) return;
  const p = await traer(id);
  if (p.stage === etapa) return;
  const extra: Partial<Prospect> = {};
  if (etapa === "Respondió" || etapa === "Interesado") extra.next_follow_up = sumarDias(hoy(), 1);
  await update("prospects", `id=eq.${id}`, { ...extra, ...cambiosPorEtapa(etapa), updated_at: new Date().toISOString() });
  await insert("activities", { prospect_id: id, kind: "estado", detail: `${p.stage} → ${etapa}`, author: yo });
  refrescar(id);
}

export async function posponer(id: string, dias: number) {
  await requerirUsuario();
  await update("prospects", `id=eq.${id}`, { next_follow_up: sumarDias(hoy(), dias) });
  refrescar(id);
}

export async function guardarEmail(id: string, f: FormData) {
  await requerirUsuario();
  const email = txt(f, "email");
  if (!email) return;
  await update("prospects", `id=eq.${id}`, { email, updated_at: new Date().toISOString() });
  refrescar(id);
  revalidatePath("/flujo");
}

export type Canal = "whatsapp" | "llamada" | "email";
const COLUMNA_RESULTADO: Record<Canal, string> = { whatsapp: "wa_result", llamada: "call_result", email: "email_result" };
const TEXTO_RESULTADO: Record<string, string> = { positivo: "Respuesta positiva", negativo: "Respuesta negativa", sin_respuesta: "Sin respuesta", no_contesto: "No contestó" };

/** Anota cómo respondió el negocio en un canal. Positiva → etapa Interesado. */
export async function registrarResultado(id: string, canal: Canal, resultado: string | null) {
  const yo = await requerirUsuario();
  const p = await traer(id);
  const patch: Record<string, unknown> = { [COLUMNA_RESULTADO[canal]]: resultado, updated_at: new Date().toISOString() };
  if (resultado === "positivo" && ["Nuevo", "Contactado", "Respondió"].includes(p.stage)) {
    patch.stage = "Interesado";
    patch.next_follow_up = sumarDias(hoy(), 1);
  }
  await update("prospects", `id=eq.${id}`, patch);
  const nombreCanal = canal === "whatsapp" ? "WhatsApp" : canal === "llamada" ? "Llamada" : "Email";
  await insert("activities", {
    prospect_id: id,
    kind: "estado",
    detail: resultado ? `${nombreCanal}: ${TEXTO_RESULTADO[resultado] ?? resultado}${patch.stage ? " → Interesado" : ""}` : `${nombreCanal}: respuesta borrada`,
    author: yo,
  });
  refrescar(id);
  revalidatePath("/flujo");
}

// ---------------- Calendario ----------------

export async function crearEvento(f: FormData) {
  const yo = await requerirUsuario();
  const title = txt(f, "title");
  const day = txt(f, "day");
  if (!title || !day) return;
  const prospect_id = txt(f, "prospect_id");
  await insert("events", { title, day, time: txt(f, "time"), kind: txt(f, "kind") ?? "reunion", owner: txt(f, "owner") ?? yo, prospect_id });
  if (prospect_id) await insert("activities", { prospect_id, kind: "nota", detail: `Agendado: ${title} el ${day}${txt(f, "time") ? ` ${txt(f, "time")}` : ""}`, author: yo });
  refrescar(prospect_id ?? undefined);
}

export async function alternarEvento(id: string, done: boolean) {
  await requerirUsuario();
  await update("events", `id=eq.${id}`, { done });
  refrescar();
}

export async function eliminarEvento(id: string) {
  await requerirUsuario();
  await remove("events", `id=eq.${id}`);
  refrescar();
}

// ---------------- Plantillas ----------------

export async function guardarPlantilla(code: string, f: FormData) {
  await requerirUsuario();
  await update("templates", `code=eq.${enc(code)}`, {
    name: txt(f, "name") ?? code,
    subject: txt(f, "subject"),
    body: txt(f, "body") ?? "",
    counts_touch: f.get("counts_touch") === "on",
  });
  refrescar();
}

/** Copia a la base los textos recomendados de las plantillas de WhatsApp (A–E). */
export async function aplicarPlantillasRecomendadas() {
  await requerirUsuario();
  for (const t of PLANTILLAS_WHATSAPP) await update("templates", `code=eq.${enc(t.code)}`, { body: t.body });
  refrescar();
}
