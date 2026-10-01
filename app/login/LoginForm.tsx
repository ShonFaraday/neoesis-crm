"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export default function LoginForm({ nombres }: { nombres: string[] }) {
  const [estado, accion, pendiente] = useActionState(login, undefined);
  return (
    <form action={accion} className="space-y-4">
      <div>
        <label className="label" htmlFor="nombre">Usuario</label>
        <select id="nombre" name="nombre" className="input" required>
          {nombres.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="clave">Clave</label>
        <input id="clave" name="clave" type="password" className="input" required autoComplete="current-password" />
      </div>
      {estado?.error && <p className="text-sm text-red-400">{estado.error}</p>}
      <button className="btn btn-primary w-full" disabled={pendiente}>{pendiente ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
