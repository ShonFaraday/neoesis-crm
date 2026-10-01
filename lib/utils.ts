// Une clases de Tailwind ignorando valores vacíos (equivalente simple de `cn` de shadcn).
export function cn(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}
