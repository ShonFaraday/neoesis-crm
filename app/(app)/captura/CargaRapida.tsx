"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cargaRapida, type EstadoCargaRapida } from "@/app/actions";
import AvisoDuplicado, { enviarSinBorrar } from "@/components/AvisoDuplicado";
import type { Rubro } from "@/lib/constants";

export default function CargaRapida({ rubros, zonas, hoyCargados }: { rubros: Rubro[]; zonas: Record<string, string[]>; hoyCargados: number }) {
  const [estado, accion, guardando] = useActionState<EstadoCargaRapida | undefined, FormData>(cargaRapida, undefined);
  const [rubro, setRubro] = useState(rubros[0]?.nombre ?? "");
  const [distrito, setDistrito] = useState("Los Olivos");
  const [contador, setContador] = useState(hoyCargados);
  const form = useRef<HTMLFormElement>(null);
  const nombre = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado?.ok) {
      setContador((c) => c + 1);
      form.current?.reset();
      nombre.current?.focus();
    }
  }, [estado]);

  const termino = rubros.find((r) => r.nombre === rubro)?.busqueda || rubro;
  const urlMaps = `https://www.google.com/maps/search/${encodeURIComponent(`${termino} en ${distrito}, Lima`)}`;

  return (
    <section className="card p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-medium">Carga rápida desde Google Maps</h2>
          <p className="text-sm muted">1) Elige rubro y distrito · 2) Abre Maps · 3) Por cada ficha SIN botón “Sitio web”, copia los datos aquí y pulsa Enter.</p>
        </div>
        <span className="chip bg-[var(--accent)]/15 text-violet-300">{contador} cargados hoy</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label className="label">Rubro</label>
          <select className="input" value={rubro} onChange={(e) => setRubro(e.target.value)}>
            {rubros.map((r) => (
              <option key={r.nombre}>{r.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Distrito</label>
          <select className="input" value={distrito} onChange={(e) => setDistrito(e.target.value)}>
            {Object.entries(zonas).map(([z, ds]) => (
              <optgroup key={z} label={z}>
                {ds.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <a href={urlMaps} target="_blank" rel="noreferrer" className="btn btn-primary">Abrir en Google Maps ↗</a>
      </div>

      <form ref={form} onSubmit={(e) => enviarSinBorrar(e, accion)} className="grid gap-2 md:grid-cols-[2fr_1.2fr_0.7fr_0.7fr_1fr] md:items-end border-t pt-4">
        <input type="hidden" name="category" value={rubro} />
        <input type="hidden" name="district" value={distrito} />
        <div>
          <label className="label">Negocio *</label>
          <input ref={nombre} name="name" className="input" required autoFocus placeholder="Nombre como aparece en Maps" />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input name="phone" className="input" inputMode="tel" placeholder="987 654 321" />
        </div>
        <div>
          <label className="label">Reseñas</label>
          <input name="reviews" type="number" min="0" className="input" placeholder="48" />
        </div>
        <div>
          <label className="label">Estrellas</label>
          <input name="rating" type="number" step="0.1" min="0" max="5" className="input" placeholder="4.7" />
        </div>
        <div>
          <label className="label">Web actual</label>
          <select name="web_status" className="input" defaultValue="sin_web">
            <option value="sin_web">Sin web</option>
            <option value="solo_redes">Solo redes</option>
          </select>
        </div>
        <div className="md:col-span-4">
          <label className="label">Enlace de la ficha (opcional)</label>
          <input name="maps_url" className="input" placeholder="Maps → Compartir → Copiar vínculo" />
        </div>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Agregar ↵"}</button>
        {estado?.duplicado && <input type="hidden" name="forzar" value="1" />}
      </form>
      {estado?.ok && <p className="text-sm text-emerald-400">{estado.ok} Sigue con el siguiente.</p>}
      <AvisoDuplicado estado={estado} boton="Agregar" />
    </section>
  );
}
