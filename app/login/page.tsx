import { redirect } from "next/navigation";
import { nombresEquipo, usuarioActual } from "@/lib/auth";
import LoginForm from "./LoginForm";
import LogoN from "@/components/LogoN";

export default async function LoginPage() {
  if (await usuarioActual()) redirect("/");
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoN className="size-14 text-white drop-shadow-[0_0_24px_rgba(157,116,255,.45)]" />
          <p className="mono mt-5 text-[11px] tracking-[0.35em] text-[var(--muted)]">NEOESIS DEVS®</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Intranet <span className="accent-text">CRM</span></h1>
        </div>
        <div className="card p-6">
        <LoginForm nombres={nombresEquipo()} />
        </div>
      </div>
    </main>
  );
}
