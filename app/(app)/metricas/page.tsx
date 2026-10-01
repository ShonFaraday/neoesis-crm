import { requerirUsuario } from "@/lib/auth";
import { ETAPAS, ETAPAS_INTERES, metaDiaria } from "@/lib/constants";
import { fechaCorta, hoy, sumarDias } from "@/lib/dates";
import AreaChart1, { type SparkCard } from "@/components/ui/area-charts-1";
import AdvancedStats from "@/components/ui/advanced-stats";
import { tipoCambio } from "@/lib/tipoCambio";
import { selectAll } from "@/lib/db";
import type { Prospect } from "@/lib/types";

type Fila = Pick<Prospect, "category" | "district" | "owner" | "stage" | "first_contact" | "amount_usd">;

function agrupar(filas: Fila[], clave: (f: Fila) => string | null) {
  const m = new Map<string, { total: number; contactados: number; interes: number; ganados: number; monto: number }>();
  for (const f of filas) {
    const k = clave(f) ?? "Sin dato";
    const g = m.get(k) ?? { total: 0, contactados: 0, interes: 0, ganados: 0, monto: 0 };
    g.total++;
    if (f.first_contact) g.contactados++;
    if (ETAPAS_INTERES.includes(f.stage)) g.interes++;
    if (f.stage === "Ganado") {
      g.ganados++;
      g.monto += Number(f.amount_usd ?? 0);
    }
    m.set(k, g);
  }
  return [...m.entries()].sort((a, b) => b[1].contactados - a[1].contactados);
}

export default async function MetricasPage() {
  await requerirUsuario();
  const d = hoy();
  const desde30 = sumarDias(d, -29);
  const meta = metaDiaria();
  const [filas, toques, cambiosInteres, tc] = await Promise.all([
    selectAll<Fila>("prospects?select=category,district,owner,stage,first_contact,amount_usd"),
    selectAll<{ day: string }>(`activities?select=day&day=gte.${desde30}&kind=in.(whatsapp,llamada,email)`),
    selectAll<{ day: string }>(`activities?select=day&day=gte.${desde30}&kind=eq.estado&detail=ilike.*${encodeURIComponent("→ Interesado")}*`),
    tipoCambio(),
  ]);

  const contar = (arr: (string | null)[]) => arr.reduce<Record<string, number>>((acc, k) => (k ? ((acc[k] = (acc[k] ?? 0) + 1), acc) : acc), {});
  const nuevosPorDia = contar(filas.map((f) => f.first_contact));
  const toquesPorDia = contar(toques.map((t) => t.day));
  const interesPorDia = contar(cambiosInteres.map((t) => t.day));
  const dias30 = Array.from({ length: 30 }, (_, i) => sumarDias(desde30, i));
  const dias14 = dias30.slice(-14);
  const prev14 = dias30.slice(2, 16); // los 14 días anteriores a dias14
  const etiqueta = (x: string) => fechaCorta(x);
  const suma = (dias: string[], m: Record<string, number>) => dias.reduce((s, x) => s + (m[x] ?? 0), 0);
  const variacion = (m: Record<string, number>) => {
    const a = suma(dias14, m);
    const b = suma(prev14, m);
    return b ? Math.round(((a - b) / b) * 100) : null;
  };

  const serie = dias30.map((x) => ({ etiqueta: etiqueta(x), nuevos: nuevosPorDia[x] ?? 0, toques: toquesPorDia[x] ?? 0 }));
  const spark: SparkCard[] = [
    { titulo: "Contactos nuevos", periodo: "Últimos 14 días", valor: String(suma(dias14, nuevosPorDia)), datos: dias14.map((x) => ({ etiqueta: etiqueta(x), valor: nuevosPorDia[x] ?? 0 })), color: "#9d74ff", icono: "usuarios", cambio: variacion(nuevosPorDia) },
    { titulo: "Toques", periodo: "Últimos 14 días", valor: String(suma(dias14, toquesPorDia)), datos: dias14.map((x) => ({ etiqueta: etiqueta(x), valor: toquesPorDia[x] ?? 0 })), color: "#f5f5f7", icono: "mensajes", cambio: variacion(toquesPorDia) },
    { titulo: "Nuevos interesados", periodo: "Últimos 14 días", valor: String(suma(dias14, interesPorDia)), datos: dias14.map((x) => ({ etiqueta: etiqueta(x), valor: interesPorDia[x] ?? 0 })), color: "#34d399", icono: "interes", cambio: variacion(interesPorDia) },
  ];

  // Meta del mes: meta diaria × días de lunes a sábado del mes
  const [y, m] = d.split("-").map(Number);
  const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let habiles = 0;
  for (let i = 1; i <= diasMes; i++) if (new Date(Date.UTC(y, m - 1, i)).getUTCDay() !== 0) habiles++;
  const nuevosMes = filas.filter((f) => f.first_contact?.startsWith(d.slice(0, 7))).length;

  const contactados = filas.filter((f) => f.first_contact).length;
  const interes = filas.filter((f) => ETAPAS_INTERES.includes(f.stage)).length;
  const ganados = filas.filter((f) => f.stage === "Ganado");
  const montoGanado = ganados.reduce((s, g) => s + Number(g.amount_usd ?? 0), 0);
  const ult7 = suma(dias30.slice(-7), nuevosPorDia);
  const prev7 = suma(dias30.slice(-14, -7), nuevosPorDia);
  const cambio7 = prev7 ? Math.round(((ult7 - prev7) / prev7) * 100) : null;

  const porRubro = agrupar(filas, (f) => f.category);
  const mejor = porRubro.filter(([, g]) => g.contactados >= 5).sort((a, b) => b[1].interes / b[1].contactados - a[1].interes / a[1].contactados)[0];

  const porEtapa = ETAPAS.map((e) => ({ e, n: filas.filter((f) => f.stage === e).length }));
  const maxEtapa = Math.max(1, ...porEtapa.map((x) => x.n));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium tracking-tight">Métricas</h1>

      <AreaChart1 tarjetas={spark} />

      <AdvancedStats
        serie={serie}
        totalSerie={String(suma(dias30, nuevosPorDia))}
        detalleSerie={`${suma(dias30, toquesPorDia)} toques en 30 días · pasa el cursor para ver cada día`}
        objetivo={{ etiqueta: "Meta del mes", titulo: `${meta} contactos nuevos por día`, valor: nuevosMes, meta: meta * habiles }}
        destacado={
          mejor
            ? { titulo: "Rubro que más responde", texto: `${mejor[0]} convierte en interés al`, resaltado: `${Math.round((mejor[1].interes / mejor[1].contactados) * 100)} % de sus contactos.` }
            : { titulo: "Rubro que más responde", texto: "Aparecerá cuando un rubro tenga", resaltado: "al menos 5 contactados." }
        }
        kpis={[
          { label: "Prospectos", value: filas.length.toLocaleString("es-PE") },
          {
            label: "Contactos · 7 días",
            value: String(ult7),
            change: cambio7 == null ? undefined : `${cambio7 >= 0 ? "+" : ""}${cambio7}%`,
            status: cambio7 == null ? "flat" : cambio7 >= 0 ? "up" : "down",
          },
          { label: "Tasa de interés", value: contactados ? `${Math.round((interes / contactados) * 100)}%` : "—" },
          { label: `Ganados · ${ganados.length}`, value: `S/ ${Math.round(montoGanado * tc.valor).toLocaleString("es-PE")}`, change: `US$ ${Math.round(montoGanado)}`, status: "flat" },
        ]}
      />

      <section className="card p-5">
        <h2 className="mb-3 font-medium">Prospectos por etapa</h2>
        <div className="space-y-1.5">
          {porEtapa.map(({ e, n }) => (
            <div key={e} className="grid grid-cols-[140px_1fr_40px] items-center gap-2 text-xs">
              <span className="text-[var(--muted)]">{e}</span>
              <div className="h-2 rounded-full bg-white/[0.04]">
                <div className="h-2 rounded-full bg-[var(--accent)]/80" style={{ width: `${(n / maxEtapa) * 100}%` }} />
              </div>
              <b className="mono text-right font-medium">{n}</b>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <TablaGrupo titulo="Por rubro" filas={porRubro} />
        <TablaGrupo titulo="Por distrito" filas={agrupar(filas, (f) => f.district)} />
        <TablaGrupo titulo="Por responsable" filas={agrupar(filas, (f) => f.owner)} />
      </div>
    </div>
  );
}

function TablaGrupo({ titulo, filas }: { titulo: string; filas: ReturnType<typeof agrupar> }) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="font-medium p-4 pb-1">{titulo}</h2>
      <table className="tabla">
        <thead>
          <tr><th></th><th>Contact.</th><th>Interés</th><th>% interés</th><th>Ganados</th><th>US$</th></tr>
        </thead>
        <tbody>
          {filas.map(([k, g]) => (
            <tr key={k}>
              <td className="font-semibold">{k}</td>
              <td>{g.contactados}</td>
              <td>{g.interes}</td>
              <td>{g.contactados ? `${Math.round((g.interes / g.contactados) * 100)} %` : "—"}</td>
              <td>{g.ganados}</td>
              <td>{Math.round(g.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filas.length === 0 && <p className="p-4 text-sm muted">Sin datos todavía.</p>}
    </section>
  );
}
