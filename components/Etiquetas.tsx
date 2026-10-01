// Etiquetas del prospecto como chips. "Rediseño" en morado; el resto en gris.
export default function Etiquetas({ tags }: { tags: string[] | null | undefined }) {
  if (!tags?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className={`chip border ${t === "Rediseño" ? "border-[var(--accent)]/50 bg-[var(--accent)]/10 text-violet-200" : "border-[var(--line)] text-[var(--muted)]"}`}
        >
          {t}
        </span>
      ))}
    </span>
  );
}
