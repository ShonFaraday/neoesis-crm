"use client";

// Barra lateral colapsable basada en el componente "Sidebar" de Aceternity UI (21st.dev):
// en escritorio se expande al pasar el cursor; en el celular se abre como panel.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Radar,
  SquareKanban,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import LogoN from "./LogoN";

type Item = { href: string; label: string; icon: LucideIcon };

const LINKS: Item[] = [
  { href: "/", label: "Hoy", icon: LayoutDashboard },
  { href: "/captura", label: "Captura", icon: Radar },
  { href: "/prospectos", label: "Prospectos", icon: Users },
  { href: "/embudo", label: "Embudo", icon: SquareKanban },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/metricas", label: "Métricas", icon: ChartColumn },
  { href: "/flujo", label: "Flujo de contacto", icon: MessageSquareText },
];

function Logo({ abierto }: { abierto: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1 py-1">
      <LogoN className="size-7 shrink-0 text-white" />
      <motion.span
        animate={{ opacity: abierto ? 1 : 0, width: abierto ? "auto" : 0 }}
        className="overflow-hidden whitespace-nowrap font-semibold tracking-tight"
      >
        <span className="mono text-[11px] tracking-[0.25em]">NEOESIS</span> <span className="mono text-[11px] tracking-[0.25em] text-[var(--accent)]">CRM</span>
      </motion.span>
    </Link>
  );
}

function Enlace({ item, abierto, activo, pendientes, onClick }: { item: Item; abierto: boolean; activo: boolean; pendientes: number; onClick?: () => void }) {
  const Icono = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
        activo ? "bg-white/[0.06] text-white" : "text-[var(--muted)] hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {activo && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(157,116,255,.9)]" />}
      <span className="relative shrink-0">
        <Icono className={`size-5 ${activo ? "text-[var(--accent)]" : ""}`} strokeWidth={1.8} />
        {item.href === "/" && pendientes > 0 && !abierto && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{pendientes}</span>
        )}
      </span>
      <motion.span
        animate={{ opacity: abierto ? 1 : 0, width: abierto ? "auto" : 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
      >
        {item.label}
        {item.href === "/" && pendientes > 0 && <span className="ml-2 rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{pendientes}</span>}
      </motion.span>
    </Link>
  );
}

export default function Sidebar({ usuario, pendientes, salir }: { usuario: string; pendientes: number; salir: () => Promise<void> }) {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [movil, setMovil] = useState(false);
  const activo = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const pie = (expandido: boolean) => (
    <div className="border-t border-[var(--line)] pt-3">
      <div className="flex items-center gap-3 px-1.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-transparent mono text-xs font-semibold text-white ring-1 ring-[var(--accent)]/60">
          {usuario.slice(0, 1).toUpperCase()}
        </span>
        <motion.div animate={{ opacity: expandido ? 1 : 0, width: expandido ? "auto" : 0 }} className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap">
          <span className="text-sm font-medium">{usuario}</span>
          <form action={salir}>
            <button className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-white/5 hover:text-white" title="Salir">
              <LogOut className="size-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <motion.aside
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        animate={{ width: abierto ? 232 : 68 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 left-0 z-40 hidden flex-col justify-between border-r border-[var(--line)] bg-black/90 px-3 py-4 backdrop-blur md:flex"
      >
        <div className="flex flex-col gap-6">
          <Logo abierto={abierto} />
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Enlace key={l.href} item={l} abierto={abierto} activo={activo(l.href)} pendientes={pendientes} />
            ))}
          </nav>
        </div>
        {pie(abierto)}
      </motion.aside>

      {/* Celular */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-black/85 px-4 py-2.5 backdrop-blur md:hidden">
        <Logo abierto />
        <button onClick={() => setMovil(true)} className="relative rounded-lg p-2 hover:bg-white/5" aria-label="Abrir menú">
          <Menu className="size-5" />
          {pendientes > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />}
        </button>
      </header>
      <AnimatePresence>
        {movil && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMovil(false)} className="fixed inset-0 z-50 bg-black/60 md:hidden" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[var(--line)] bg-black px-3 py-4 md:hidden"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <Logo abierto />
                  <button onClick={() => setMovil(false)} className="rounded-lg p-2 hover:bg-white/5" aria-label="Cerrar menú">
                    <X className="size-5" />
                  </button>
                </div>
                <nav className="flex flex-col gap-1">
                  {LINKS.map((l) => (
                    <Enlace key={l.href} item={l} abierto activo={activo(l.href)} pendientes={pendientes} onClick={() => setMovil(false)} />
                  ))}
                </nav>
              </div>
              {pie(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
