// Utilidades para dibujar áreas suaves en SVG sin librerías externas.
export type Punto = [number, number];

export function escalar(valores: number[], ancho: number, alto: number, margen = 6, maximo?: number): Punto[] {
  const max = Math.max(1, maximo ?? Math.max(...valores, 0));
  const n = valores.length;
  return valores.map((v, i) => [n <= 1 ? ancho / 2 : (i / (n - 1)) * ancho, alto - margen - (v / max) * (alto - margen * 2)]);
}

/** Curva suave (Catmull-Rom → Bézier). */
export function linea(p: Punto[]): string {
  if (!p.length) return "";
  if (p.length < 3) return `M${p.map((q) => q.join(",")).join(" L")}`;
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1: Punto = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Punto = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function area(p: Punto[], alto: number): string {
  if (!p.length) return "";
  return `${linea(p)} L${p[p.length - 1][0]},${alto} L${p[0][0]},${alto} Z`;
}
