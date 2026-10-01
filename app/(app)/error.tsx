"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-6 space-y-3">
      <h1 className="text-xl font-bold">Algo falló</h1>
      <p className="text-sm text-red-400 break-words">{error.message}</p>
      <p className="text-sm muted">Si dice “Faltan SUPABASE_URL…”, revisa las variables de entorno en Vercel (ver README).</p>
      <button className="btn" onClick={reset}>Reintentar</button>
    </div>
  );
}
