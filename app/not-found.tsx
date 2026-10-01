import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">No encontrado</h1>
        <Link href="/" className="text-[var(--accent)] font-semibold">Volver al inicio</Link>
      </div>
    </main>
  );
}
