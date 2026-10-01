// Logo de Neoesis DEVS® (N de nodos) en SVG: se ve nítido a cualquier tamaño y toma el color del texto.
export default function LogoN({ className = "size-8", titulo = "Neoesis" }: { className?: string; titulo?: string }) {
  return (
    <svg viewBox="230 230 796 796" className={className} fill="currentColor" role="img" aria-label={titulo}>
      <g stroke="currentColor" strokeWidth="38" strokeLinecap="round">
        <line x1="325" y1="308" x2="325" y2="945" />
        <line x1="928" y1="308" x2="928" y2="945" />
        <line x1="325" y1="308" x2="532" y2="527" />
        <line x1="325" y1="628" x2="532" y2="527" />
        <line x1="532" y1="527" x2="729" y2="746" />
        <line x1="729" y1="746" x2="928" y2="628" />
        <line x1="729" y1="746" x2="928" y2="945" />
      </g>
      <circle cx="325" cy="308" r="60" />
      <circle cx="325" cy="628" r="58" />
      <circle cx="325" cy="945" r="60" />
      <circle cx="532" cy="527" r="57" />
      <circle cx="729" cy="746" r="57" />
      <circle cx="928" cy="308" r="60" />
      <circle cx="928" cy="628" r="58" />
      <circle cx="928" cy="945" r="60" />
    </svg>
  );
}
