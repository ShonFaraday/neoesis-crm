import { correosEquipo } from "@/lib/auth";
import { metaDiaria } from "@/lib/constants";
import { fechaCorta, hoy } from "@/lib/dates";
import { count, select } from "@/lib/db";
import type { EventRow, Prospect } from "@/lib/types";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Resumen diario por correo (lo llama Vercel Cron cada mañana, lunes a sábado). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const para = process.env.RECORDATORIO_EMAIL_PARA || correosEquipo().join(",");
  if (!apiKey || !para) return Response.json({ ok: false, motivo: "Falta RESEND_API_KEY o RECORDATORIO_EMAIL_PARA" });

  const d = hoy();
  const app = process.env.APP_URL ?? "";
  const [seguimientos, eventos, nuevos] = await Promise.all([
    select<Prospect>(`prospects?select=id,name,stage,touches,next_follow_up,owner&next_follow_up=lte.${d}&order=next_follow_up.asc&limit=60`),
    select<EventRow>(`events?select=*&day=eq.${d}&done=eq.false&order=time.asc.nullsfirst`),
    count("prospects?select=id&stage=eq.Nuevo"),
  ]);

  const filas = seguimientos
    .map((p) => `<li><a href="${app}/prospectos/${p.id}">${esc(p.name)}</a> — ${esc(p.stage)}, ${p.touches} toque(s)${p.next_follow_up! < d ? " <b style='color:#dc2626'>(atrasado)</b>" : ""}${p.owner ? ` · ${esc(p.owner)}` : ""}</li>`)
    .join("");
  const agenda = eventos.map((e) => `<li>${e.time ?? ""} ${esc(e.title)}${e.owner ? ` · ${esc(e.owner)}` : ""}</li>`).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111">
      <h2 style="margin:0 0 4px">Neoesis CRM — ${fechaCorta(d)}</h2>
      <p style="margin:0 0 16px;color:#555">Meta de hoy: ${metaDiaria()} negocios nuevos contactados. Tienes ${nuevos} prospectos “Nuevo” listos.</p>
      <h3>Seguimientos para hoy (${seguimientos.length})</h3>
      ${filas ? `<ul>${filas}</ul>` : "<p>Ninguno. ¡A capturar nuevos!</p>"}
      <h3>Agenda de hoy (${eventos.length})</h3>
      ${agenda ? `<ul>${agenda}</ul>` : "<p>Sin reuniones.</p>"}
      <p><a href="${app}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Abrir el CRM</a></p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RECORDATORIO_EMAIL_DE ?? "Neoesis CRM <onboarding@resend.dev>",
      to: para.split(",").map((s) => s.trim()),
      subject: `Hoy: ${seguimientos.length} seguimientos y ${eventos.length} reuniones`,
      html,
    }),
  });
  return Response.json({ ok: res.ok, status: res.status });
}
