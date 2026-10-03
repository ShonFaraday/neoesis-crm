import { nombresEquipo, requerirUsuario } from "@/lib/auth";
import FormNuevo from "./FormNuevo";

export default async function NuevoProspecto() {
  const yo = await requerirUsuario();
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-medium tracking-tight">Nuevo prospecto</h1>
      <FormNuevo yo={yo} equipo={nombresEquipo()} />
    </div>
  );
}
