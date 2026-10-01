"use client";

// Select de filtro que se aplica al instante y se ilumina en morado cuando está activo.
export default function FiltroSelect({ name, valor, todos, opciones }: { name: string; valor?: string; todos: string; opciones: string[] }) {
  const activo = !!valor;
  return (
    <select
      name={name}
      defaultValue={valor ?? ""}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={`input ${activo ? "!border-[var(--accent)] !bg-[var(--accent)]/10 text-white shadow-[0_0_0_3px_rgba(157,116,255,.18)]" : ""}`}
    >
      <option value="">{todos}</option>
      {opciones.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
