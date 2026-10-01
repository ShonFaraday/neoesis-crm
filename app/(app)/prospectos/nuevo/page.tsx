import { crearProspecto } from "@/app/actions";
import CamposProspecto from "@/components/FormProspecto";
import { nombresEquipo, requerirUsuario } from "@/lib/auth";

export default async function NuevoProspecto() {
  const yo = await requerirUsuario();
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-medium tracking-tight">Nuevo prospecto</h1>
      <form action={crearProspecto} className="card p-4 space-y-4">
        <CamposProspecto p={{ owner: yo }} equipo={nombresEquipo()} />
        <button className="btn btn-primary">Guardar</button>
      </form>
    </div>
  );
}
