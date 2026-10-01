import { cupoGoogle } from "@/app/actions";
import { requerirUsuario } from "@/lib/auth";
import { RUBROS, ZONAS } from "@/lib/constants";
import CapturaCliente from "./CapturaCliente";
import CargaRapida from "./CargaRapida";
import { hoy } from "@/lib/dates";
import { count } from "@/lib/db";

export default async function CapturaPage() {
  await requerirUsuario();
  const configurado = !!process.env.GOOGLE_PLACES_API_KEY;
  const cupo = configurado ? await cupoGoogle() : null;
  const hoyCargados = await count(`prospects?select=id&created_at=gte.${hoy()}T05:00:00Z`);
  const rubros = RUBROS.filter((r) => r.nombre !== "Otro");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Captura desde Google Maps</h1>
        <p className="text-sm muted">Solo nos interesan los negocios <b>sin página web</b>.</p>
      </div>
      {configurado && cupo ? (
        <CapturaCliente rubros={rubros} zonas={ZONAS} cupo={cupo} />
      ) : (
        <CargaRapida rubros={rubros} zonas={ZONAS} hoyCargados={hoyCargados} />
      )}
    </div>
  );
}
