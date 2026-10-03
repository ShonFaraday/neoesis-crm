import { clasificarWeb } from "./format";
import type { PlaceResult } from "./types";

const FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.primaryTypeDisplayName",
  "nextPageToken",
].join(",");

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  primaryTypeDisplayName?: { text?: string };
};

/**
 * Busca en Google Places (Text Search New). Cada página = 1 consulta facturable, hasta 20 resultados.
 * Devuelve los lugares y cuántas consultas se usaron.
 */
export async function buscarLugares(texto: string, paginas: number, antesDeConsultar?: () => Promise<void>): Promise<{ lugares: Omit<PlaceResult, "ya_registrado" | "registro" | "rubro">[]; consultas: number }> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("Falta GOOGLE_PLACES_API_KEY en las variables de entorno.");

  const lugares: Omit<PlaceResult, "ya_registrado" | "registro" | "rubro">[] = [];
  let token: string | undefined;
  let consultas = 0;

  for (let i = 0; i < Math.min(Math.max(paginas, 1), 3); i++) {
    // Se registra ANTES de llamar a Google: así el contador nunca se queda corto.
    if (antesDeConsultar) await antesDeConsultar();
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELDS,
      },
      body: JSON.stringify({ textQuery: texto, languageCode: "es", regionCode: "PE", pageSize: 20, ...(token ? { pageToken: token } : {}) }),
      cache: "no-store",
    });
    consultas++;
    if (!res.ok) throw new Error(`Google Places respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { places?: RawPlace[]; nextPageToken?: string };
    for (const p of data.places ?? []) {
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      lugares.push({
        place_id: p.id,
        name: p.displayName?.text ?? "(sin nombre)",
        address: p.formattedAddress ?? "",
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        web_status: clasificarWeb(p.websiteUri),
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? 0,
        maps_url: p.googleMapsUri ?? null,
        tipo: p.primaryTypeDisplayName?.text ?? null,
      });
    }
    token = data.nextPageToken;
    if (!token) break;
  }
  return { lugares, consultas };
}
