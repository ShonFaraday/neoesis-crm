// Tipo de cambio USD → PEN. Usa una API gratuita sin clave (open.er-api.com), guardada en caché 12 h.
// Si falla, usa TIPO_CAMBIO del .env (o 3.55 por defecto).
export async function tipoCambio(): Promise<{ valor: number; fuente: "api" | "fijo" }> {
  const fijo = Number(process.env.TIPO_CAMBIO ?? 3.55) || 3.55;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 43200 } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { rates?: Record<string, number> };
    const pen = data.rates?.PEN;
    if (pen && pen > 2 && pen < 6) return { valor: pen, fuente: "api" };
  } catch {
    /* sin conexión: valor fijo */
  }
  return { valor: fijo, fuente: "fijo" };
}
