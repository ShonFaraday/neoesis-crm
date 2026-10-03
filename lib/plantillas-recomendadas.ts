/**
 * Textos recomendados de las plantillas de WhatsApp. Las plantillas viven en la tabla `templates`;
 * el botón "Aplicar textos recomendados" de /flujo/plantillas copia estos textos a la base.
 * Todo se adapta solo al prospecto: {gancho_resenas} según sus reseñas (0, menos de 15, o 15 o más),
 * y {sistema_ejemplos}, {web_ejemplos} y {demo_sistema} según su rubro (ver `perfilRubro` en lib/format).
 */
export const PLANTILLAS_WHATSAPP: { code: string; body: string }[] = [
  {
    code: "A",
    body: `Hola, buenos días. ¿Hablo con {negocio}? Soy {yo} de Neoesis DEVS.

{gancho_resenas}

Noté además que aún no tienen página web, y quienes buscan "{rubro} en {distrito}" terminan en la web de la competencia. Hacemos páginas con {web_ejemplos}.

Y no solo eso: también desarrollamos sistemas administrativos para tener todo {negocio} organizado: {sistema_ejemplos}.

• {demo_sistema}: {link_sistema}
• Aquí puede armar usted mismo un boceto de su página y de su sistema: {link_neoesis}

Si toma la página y el sistema juntos, le hacemos un descuento especial. ¿Le preparo una propuesta sin compromiso?`,
  },
  {
    code: "B",
    body: `Hola de nuevo. Le dejo dos enlaces para que vea lo que podemos hacer por {negocio}:

• {demo_sistema} ({sistema_ejemplos}): {link_sistema}
• Arme usted mismo el boceto de su página web y de su sistema: {link_neoesis}

La página puede estar lista en pocos días desde US$ 190 con dominio incluido, y si la toma junto con el sistema le aplicamos un descuento. ¿Qué le parece?`,
  },
  {
    code: "C",
    body: `Una pregunta rápida: ¿una página web o un sistema para organizar {negocio} ({sistema_ejemplos}) es algo que les interesa este año, o lo dejamos para más adelante? Con un sí o un no me ayuda muchísimo.`,
  },
  {
    code: "D",
    body: `Entiendo que deben estar con mucho trabajo. No le escribo más para no incomodar. Si más adelante necesitan su página web o un sistema para ordenar {negocio}, aquí estamos: Neoesis DEVS, {mi_telefono}. Puede armar su boceto cuando quiera en {link_neoesis}. ¡Éxitos!`,
  },
  {
    code: "E",
    body: `¡Excelente! Para armar el boceto de {negocio} me ayudan 3 cosas: su logo (si tienen), 3 a 5 fotos del local o trabajos, y los servicios principales con horarios.

Si también quieren el sistema, cuénteme qué les gustaría controlar ({sistema_ejemplos}) y lo incluimos en la propuesta con el descuento por llevar ambos.`,
  },
];
