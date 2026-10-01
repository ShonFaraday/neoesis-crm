"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { agregarDesdeMaps, buscarRubro, type Cupo } from "@/app/actions";
import { Estrellas, Web } from "@/components/Badges";
import type { Rubro } from "@/lib/constants";
import type { PlaceResult } from "@/lib/types";

type Props = { rubros: Rubro[]; zonas: Record<string, string[]>; cupo: Cupo };
type Modo = "barrido" | "libre";

export default function CapturaCliente({ rubros, zonas, cupo: cupoInicial }: Props) {
  const grupos = useMemo(() => {
    const m = new Map<string, Rubro[]>();
    for (const r of rubros) m.set(r.grupo, [...(m.get(r.grupo) ?? []), r]);
    return [...m.entries()];
  }, [rubros]);

  const [modo, setModo] = useState<Modo>("barrido");
  const [distrito, setDistrito] = useState("Los Olivos");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set(rubros.filter((r) => r.prioridad === "Alta").map((r) => r.nombre)));
  const [libre, setLibre] = useState("");
  const [paginas, setPaginas] = useState(1);

  const [resultados, setResultados] = useState<PlaceResult[]>([]);
  const [conWebOcultos, setConWebOcultos] = useState(0);
  const [progreso, setProgreso] = useState<{ hecho: number; total: number; actual: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cupo, setCupo] = useState<Cupo>(cupoInicial);
  const detener = useRef(false);

  const [incluirRedes, setIncluirRedes] = useState(false);
  const [filtroRubro, setFiltroRubro] = useState<string>("");
  const [texto, setTexto] = useState("");
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [agregados, setAgregados] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [agregando, start] = useTransition();

  const consultasEstimadas = modo === "barrido" ? elegidos.size * paginas : paginas;
  const restantes = cupo.restantes;
  const buscando = progreso !== null && progreso.hecho < progreso.total;

  const toggleRubro = (n: string) =>
    setElegidos((s) => {
      const x = new Set(s);
      if (x.has(n)) x.delete(n);
      else x.add(n);
      return x;
    });

  async function iniciar() {
    setError(null);
    setMensaje(null);
    if (consultasEstimadas > restantes) {
      setError(`Este barrido usaría ${consultasEstimadas} consultas y hoy solo quedan ${restantes} gratis. Marca menos rubros o sigue mañana.`);
      return;
    }
    const tareas: { rubro: string; libre?: string }[] = modo === "barrido" ? [...elegidos].map((r) => ({ rubro: r })) : [{ rubro: "Otro", libre }];
    if (!tareas.length || (modo === "libre" && !libre.trim())) {
      setError(modo === "libre" ? "Escribe qué buscar." : "Marca al menos un rubro.");
      return;
    }
    detener.current = false;
    setResultados([]);
    setConWebOcultos(0);
    setMarcados(new Set());
    setAgregados(new Set());
    setFiltroRubro("");
    const vistos = new Set<string>();
    let ocultos = 0;

    for (let i = 0; i < tareas.length; i++) {
      if (detener.current) break;
      const t = tareas[i];
      setProgreso({ hecho: i, total: tareas.length, actual: t.libre ?? t.rubro });
      const r = await buscarRubro({ rubro: t.rubro, distrito, libre: t.libre, paginas });
      if (r.cupo) setCupo(r.cupo);
      if (r.error) {
        setError(r.error);
        break;
      }
      const nuevos: PlaceResult[] = [];
      for (const l of r.resultados ?? []) {
        if (vistos.has(l.place_id)) continue;
        vistos.add(l.place_id);
        if (l.web_status === "con_web") {
          ocultos++;
          continue;
        }
        nuevos.push(l);
      }
      setConWebOcultos(ocultos);
      setResultados((prev) => [...prev, ...nuevos]);
      setMarcados((prev) => {
        const x = new Set(prev);
        for (const n of nuevos) if (!n.ya_registrado && n.web_status === "sin_web") x.add(n.place_id);
        return x;
      });
    }
    setProgreso((p) => (p ? { ...p, hecho: p.total } : p));
  }

  const base = resultados.filter((l) => incluirRedes || l.web_status === "sin_web");
  const conteoRubro = base.reduce<Record<string, number>>((acc, l) => ((acc[l.rubro] = (acc[l.rubro] ?? 0) + 1), acc), {});
  const visibles = base
    .filter((l) => !filtroRubro || l.rubro === filtroRubro)
    .filter((l) => !texto || `${l.name} ${l.tipo ?? ""} ${l.address}`.toLowerCase().includes(texto.toLowerCase()))
    .sort((a, b) => b.reviews - a.reviews);
  const seleccionables = visibles.filter((l) => !l.ya_registrado && !agregados.has(l.place_id));
  const marcadosVisibles = seleccionables.filter((l) => marcados.has(l.place_id));

  const toggle = (id: string) =>
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const agregar = () => {
    const lista = marcadosVisibles;
    if (!lista.length) return;
    start(async () => {
      const { agregados: n } = await agregarDesdeMaps({ distrito, lugares: lista });
      setAgregados((s) => new Set([...s, ...lista.map((l) => l.place_id)]));
      setMarcados((s) => {
        const x = new Set(s);
        for (const l of lista) x.delete(l.place_id);
        return x;
      });
      setMensaje(`${n} prospecto(s) agregado(s). Ya aparecen en Hoy → Nuevos por contactar.`);
    });
  };

  return (
    <>
      <section className="card p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="label">Distrito</label>
            <select className="input" value={distrito} onChange={(e) => setDistrito(e.target.value)} disabled={buscando}>
              {Object.entries(zonas).map(([z, ds]) => (
                <optgroup key={z} label={z}>
                  {ds.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Modo</label>
            <select className="input" value={modo} onChange={(e) => setModo(e.target.value as Modo)} disabled={buscando}>
              <option value="barrido">Barrido por rubros</option>
              <option value="libre">Búsqueda libre</option>
            </select>
          </div>
          <div>
            <label className="label">Resultados por rubro</label>
            <select className="input" value={paginas} onChange={(e) => setPaginas(Number(e.target.value))} disabled={buscando}>
              <option value={1}>Hasta 20 (1 consulta)</option>
              <option value={2}>Hasta 40 (2 consultas)</option>
              <option value={3}>Hasta 60 (3 consultas)</option>
            </select>
          </div>
        </div>

        {modo === "barrido" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">Rubros a barrer:</span>
              <button type="button" className="btn !py-1" onClick={() => setElegidos(new Set(rubros.map((r) => r.nombre)))}>Todos ({rubros.length})</button>
              <button type="button" className="btn !py-1" onClick={() => setElegidos(new Set(rubros.filter((r) => r.prioridad === "Alta").map((r) => r.nombre)))}>Solo prioridad alta</button>
              <button type="button" className="btn !py-1" onClick={() => setElegidos(new Set())}>Ninguno</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {grupos.map(([g, rs]) => (
                <div key={g} className="rounded-lg border border-[var(--line)] p-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase muted mb-1.5">
                    <input
                      type="checkbox"
                      checked={rs.every((r) => elegidos.has(r.nombre))}
                      onChange={(e) =>
                        setElegidos((s) => {
                          const x = new Set(s);
                          for (const r of rs) {
                            if (e.target.checked) x.add(r.nombre);
                            else x.delete(r.nombre);
                          }
                          return x;
                        })
                      }
                    />
                    {g}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {rs.map((r) => (
                      <button
                        key={r.nombre}
                        type="button"
                        onClick={() => toggleRubro(r.nombre)}
                        className={`chip border ${elegidos.has(r.nombre) ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-transparent text-[var(--muted)] border-[var(--line)]"}`}
                      >
                        {r.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="label">¿Qué buscar?</label>
            <input className="input" value={libre} onChange={(e) => setLibre(e.target.value)} placeholder="ej. pastelería, estudio contable, clínica dental…" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-sm">
            Usará <b>{consultasEstimadas}</b> consulta(s) · disponibles hoy: <b>{restantes}</b> · mes: {cupo.usadasMes}/{cupo.limiteMes} · día: {cupo.usadasDia}/{cupo.limiteDia}
            <span className="block text-xs text-emerald-400">Topes dentro del cupo gratis de Google: sin costo.</span>
          </p>
          {buscando ? (
            <button type="button" className="btn" onClick={() => (detener.current = true)}>Detener</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={iniciar}>
              {modo === "barrido" ? `Barrer ${distrito}` : "Buscar"}
            </button>
          )}
        </div>
        {progreso && (
          <div>
            <div className="h-2 rounded-full bg-white/5">
              <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(progreso.hecho / progreso.total) * 100}%` }} />
            </div>
            <p className="text-xs muted mt-1">
              {buscando ? `Buscando “${progreso.actual}”… (${progreso.hecho + 1} de ${progreso.total})` : `Listo: ${progreso.total} búsqueda(s) en ${distrito}.`}
            </p>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {(resultados.length > 0 || (progreso && !buscando)) && (
        <section className="card">
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">
                <b className="text-emerald-400">{base.length}</b> negocios sin web{incluirRedes ? " o con solo redes" : ""}
                {conWebOcultos > 0 && <span className="muted"> · {conWebOcultos} con web descartados</span>}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={incluirRedes} onChange={(e) => setIncluirRedes(e.target.checked)} />
                Incluir los que solo tienen Facebook/Instagram
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setFiltroRubro("")} className={`chip border ${!filtroRubro ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-transparent border-[var(--line)]"}`}>
                Todos ({base.length})
              </button>
              {Object.entries(conteoRubro)
                .sort((a, b) => b[1] - a[1])
                .map(([r, n]) => (
                  <button key={r} type="button" onClick={() => setFiltroRubro(r)} className={`chip border ${filtroRubro === r ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-transparent border-[var(--line)]"}`}>
                    {r} ({n})
                  </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input className="input md:!w-72" placeholder="Filtrar por nombre o tipo…" value={texto} onChange={(e) => setTexto(e.target.value)} />
              <button type="button" className="btn" onClick={() => setMarcados((s) => new Set([...s, ...seleccionables.map((l) => l.place_id)]))}>Marcar visibles</button>
              <button type="button" className="btn" onClick={() => setMarcados(new Set())}>Desmarcar</button>
              <button type="button" className="btn btn-primary ml-auto" onClick={agregar} disabled={agregando || marcadosVisibles.length === 0}>
                {agregando ? "Agregando…" : `Agregar ${marcadosVisibles.length} a mi lista`}
              </button>
            </div>
            {mensaje && <p className="text-sm text-emerald-400">{mensaje}</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th></th>
                  <th>Negocio</th>
                  <th>Rubro / tipo</th>
                  <th>Web</th>
                  <th>Teléfono</th>
                  <th>Reseñas</th>
                  <th>Maps</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((l) => {
                  const bloqueado = l.ya_registrado || agregados.has(l.place_id);
                  return (
                    <tr key={l.place_id} className={bloqueado ? "opacity-50" : ""}>
                      <td>
                        <input type="checkbox" className="size-4" disabled={bloqueado} checked={!bloqueado && marcados.has(l.place_id)} onChange={() => toggle(l.place_id)} />
                      </td>
                      <td>
                        <div className="font-semibold">{l.name}</div>
                        <div className="text-xs muted">{l.address}</div>
                        {bloqueado && <div className="text-xs font-semibold text-white/45">Ya está en tu lista</div>}
                      </td>
                      <td className="text-xs">
                        {l.rubro}
                        {l.tipo && <div className="muted">{l.tipo}</div>}
                      </td>
                      <td>
                        <Web estado={l.web_status} />
                        {l.website && (
                          <a href={l.website} target="_blank" rel="noreferrer" className="block text-xs text-[var(--accent)] truncate max-w-40">
                            {l.website.replace(/^https?:\/\/(www\.)?/, "")}
                          </a>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{l.phone ?? <span className="muted">—</span>}</td>
                      <td>
                        <Estrellas rating={l.rating} reviews={l.reviews} />
                      </td>
                      <td>
                        {l.maps_url && (
                          <a href={l.maps_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--accent)]">Ver</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibles.length === 0 && <p className="p-4 text-sm muted">Ningún negocio sin web con este filtro.</p>}
          </div>
        </section>
      )}
    </>
  );
}
