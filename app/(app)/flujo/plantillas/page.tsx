import { guardarPlantilla } from "@/app/actions";
import { requerirUsuario } from "@/lib/auth";
import { plantillas } from "@/lib/data";

export default async function PlantillasPage() {
  await requerirUsuario();
  const lista = await plantillas();
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <a href="/flujo" className="text-sm muted hover:text-white">← Flujo de contacto</a>
        <h1 className="text-2xl font-medium tracking-tight">Editar plantillas</h1>
        <p className="text-sm muted">
          Variables: <code>{"{negocio}"}</code> <code>{"{rubro}"}</code> <code>{"{distrito}"}</code> <code>{"{resenas}"}</code> <code>{"{estrellas}"}</code> <code>{"{yo}"}</code>. Se reemplazan solas al enviar.
        </p>
      </div>
      {lista.map((t) => (
        <form key={t.code} action={guardarPlantilla.bind(null, t.code)} className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="chip bg-[var(--accent)]/15 text-violet-300">{t.code}</span>
            <span className="chip bg-white/10 text-white/70">{t.channel}</span>
            <input name="name" defaultValue={t.name} className="input" />
          </div>
          {t.channel === "email" && <input name="subject" defaultValue={t.subject ?? ""} className="input" placeholder="Asunto" />}
          <textarea name="body" defaultValue={t.body} rows={t.channel === "email" ? 9 : 5} className="input" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="counts_touch" defaultChecked={t.counts_touch} /> Cuenta como toque de la secuencia
            </label>
            <button className="btn btn-primary">Guardar</button>
          </div>
        </form>
      ))}
    </div>
  );
}
