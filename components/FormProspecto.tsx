import { DISTRITOS, RUBROS } from "@/lib/constants";
import type { Prospect } from "@/lib/types";

/** Campos del formulario de prospecto (sirve para crear y editar). */
export default function CamposProspecto({ p, equipo, conSeguimiento }: { p?: Partial<Prospect>; equipo: string[]; conSeguimiento?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="label">Negocio *</label>
        <input name="name" required defaultValue={p?.name ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Rubro</label>
        <select name="category" defaultValue={p?.category ?? ""} className="input">
          <option value="">—</option>
          {RUBROS.map((r) => <option key={r.nombre}>{r.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Distrito</label>
        <select name="district" defaultValue={p?.district ?? ""} className="input">
          <option value="">—</option>
          {DISTRITOS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Teléfono</label>
        <input name="phone" defaultValue={p?.phone ?? ""} className="input" inputMode="tel" placeholder="987 654 321" />
      </div>
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" defaultValue={p?.email ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Reseñas</label>
        <input name="reviews" type="number" min="0" defaultValue={p?.reviews ?? 0} className="input" />
      </div>
      <div>
        <label className="label">Estrellas</label>
        <input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={p?.rating ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Web actual</label>
        <select name="web_status" defaultValue={p?.web_status ?? "sin_web"} className="input">
          <option value="sin_web">Sin web</option>
          <option value="solo_redes">Solo redes</option>
          <option value="con_web">Con web</option>
        </select>
      </div>
      <div>
        <label className="label">Responsable</label>
        <select name="owner" defaultValue={p?.owner ?? ""} className="input">
          <option value="">—</option>
          {equipo.map((n) => <option key={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Sitio / red social</label>
        <input name="website" defaultValue={p?.website ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Enlace de Google Maps</label>
        <input name="maps_url" defaultValue={p?.maps_url ?? ""} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="label">Dirección</label>
        <input name="address" defaultValue={p?.address ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Monto cotizado / cerrado (US$)</label>
        <input name="amount_usd" type="number" step="1" min="0" defaultValue={p?.amount_usd ?? ""} className="input" />
      </div>
      {conSeguimiento && (
        <div>
          <label className="label">Próximo seguimiento</label>
          <input name="next_follow_up" type="date" defaultValue={p?.next_follow_up ?? ""} className="input" />
        </div>
      )}
      <div className="md:col-span-2">
        <label className="label">Etiquetas (separadas por coma)</label>
        <input name="tags" defaultValue={(p?.tags ?? []).join(", ")} className="input" placeholder="Rediseño, Posiblemente sin intranet" />
      </div>
      <div className="md:col-span-2">
        <label className="label">Notas</label>
        <textarea name="notes" rows={3} defaultValue={p?.notes ?? ""} className="input" />
      </div>
    </div>
  );
}
