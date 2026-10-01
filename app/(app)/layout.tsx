import { logout } from "@/app/actions";
import Sidebar from "@/components/Sidebar";
import { requerirUsuario } from "@/lib/auth";
import { hoy } from "@/lib/dates";
import { count } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const yo = await requerirUsuario();
  let pendientes = 0;
  try {
    pendientes = await count(`prospects?select=id&next_follow_up=lte.${hoy()}`);
  } catch {
    pendientes = 0;
  }
  return (
    <div className="min-h-screen">
      <Sidebar usuario={yo} pendientes={pendientes} salir={logout} />
      <div className="md:pl-[68px]">
        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
