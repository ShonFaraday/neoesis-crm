export type Rubro = { nombre: string; busqueda: string; prioridad: "Alta" | "Media" | "Baja"; grupo: string };

export const RUBROS: Rubro[] = [
  // Salud
  { nombre: "Consultorio dental", busqueda: "dentista", prioridad: "Alta", grupo: "Salud" },
  { nombre: "Consultorio médico", busqueda: "consultorio médico", prioridad: "Alta", grupo: "Salud" },
  { nombre: "Fisioterapia", busqueda: "fisioterapia", prioridad: "Alta", grupo: "Salud" },
  { nombre: "Psicólogo", busqueda: "psicólogo", prioridad: "Media", grupo: "Salud" },
  { nombre: "Nutricionista", busqueda: "nutricionista", prioridad: "Media", grupo: "Salud" },
  { nombre: "Óptica", busqueda: "óptica", prioridad: "Media", grupo: "Salud" },
  { nombre: "Laboratorio clínico", busqueda: "laboratorio clínico", prioridad: "Media", grupo: "Salud" },
  { nombre: "Podología", busqueda: "podología", prioridad: "Media", grupo: "Salud" },
  { nombre: "Veterinaria", busqueda: "veterinaria", prioridad: "Alta", grupo: "Salud" },
  // Belleza y bienestar
  { nombre: "Salón de belleza", busqueda: "salón de belleza", prioridad: "Alta", grupo: "Belleza y bienestar" },
  { nombre: "Barbería", busqueda: "barbería", prioridad: "Alta", grupo: "Belleza y bienestar" },
  { nombre: "Clínica estética / spa", busqueda: "spa", prioridad: "Alta", grupo: "Belleza y bienestar" },
  { nombre: "Uñas / manicure", busqueda: "manicure", prioridad: "Media", grupo: "Belleza y bienestar" },
  { nombre: "Gimnasio / yoga", busqueda: "gimnasio", prioridad: "Alta", grupo: "Belleza y bienestar" },
  { nombre: "Estudio de tatuajes", busqueda: "tatuajes", prioridad: "Media", grupo: "Belleza y bienestar" },
  // Servicios profesionales
  { nombre: "Abogado", busqueda: "abogados", prioridad: "Alta", grupo: "Servicios profesionales" },
  { nombre: "Contador", busqueda: "contador", prioridad: "Alta", grupo: "Servicios profesionales" },
  { nombre: "Inmobiliaria", busqueda: "inmobiliaria", prioridad: "Media", grupo: "Servicios profesionales" },
  { nombre: "Arquitecto / construcción", busqueda: "arquitecto", prioridad: "Media", grupo: "Servicios profesionales" },
  { nombre: "Agencia de viajes", busqueda: "agencia de viajes", prioridad: "Media", grupo: "Servicios profesionales" },
  { nombre: "Notaría / trámites", busqueda: "trámites documentarios", prioridad: "Baja", grupo: "Servicios profesionales" },
  // Autos y oficios
  { nombre: "Taller mecánico", busqueda: "taller mecánico", prioridad: "Alta", grupo: "Autos y oficios" },
  { nombre: "Lavado de autos", busqueda: "lavado de autos", prioridad: "Media", grupo: "Autos y oficios" },
  { nombre: "Llantería / repuestos", busqueda: "repuestos de autos", prioridad: "Media", grupo: "Autos y oficios" },
  { nombre: "Carpintería", busqueda: "carpintería", prioridad: "Baja", grupo: "Autos y oficios" },
  { nombre: "Vidriería / aluminio", busqueda: "vidriería", prioridad: "Baja", grupo: "Autos y oficios" },
  { nombre: "Imprenta / gráfica", busqueda: "imprenta", prioridad: "Media", grupo: "Autos y oficios" },
  // Comida
  { nombre: "Restaurante", busqueda: "restaurante", prioridad: "Media", grupo: "Comida" },
  { nombre: "Cafetería", busqueda: "cafetería", prioridad: "Media", grupo: "Comida" },
  { nombre: "Pastelería / panadería", busqueda: "pastelería", prioridad: "Media", grupo: "Comida" },
  { nombre: "Pollería", busqueda: "pollería", prioridad: "Media", grupo: "Comida" },
  { nombre: "Cevichería", busqueda: "cevichería", prioridad: "Media", grupo: "Comida" },
  // Educación
  { nombre: "Academia", busqueda: "academia", prioridad: "Media", grupo: "Educación" },
  { nombre: "Nido / inicial", busqueda: "nido", prioridad: "Media", grupo: "Educación" },
  { nombre: "Colegio privado", busqueda: "colegio privado", prioridad: "Media", grupo: "Educación" },
  { nombre: "Escuela de idiomas / música", busqueda: "clases de inglés", prioridad: "Media", grupo: "Educación" },
  // Comercio y alojamiento
  { nombre: "Hostal / hotel", busqueda: "hostal", prioridad: "Media", grupo: "Comercio y alojamiento" },
  { nombre: "Fotógrafo / eventos", busqueda: "fotógrafo", prioridad: "Media", grupo: "Comercio y alojamiento" },
  { nombre: "Local de eventos", busqueda: "local de eventos", prioridad: "Media", grupo: "Comercio y alojamiento" },
  { nombre: "Florería", busqueda: "florería", prioridad: "Baja", grupo: "Comercio y alojamiento" },
  { nombre: "Tienda de ropa", busqueda: "tienda de ropa", prioridad: "Baja", grupo: "Comercio y alojamiento" },
  { nombre: "Mueblería", busqueda: "mueblería", prioridad: "Baja", grupo: "Comercio y alojamiento" },
  { nombre: "Ferretería", busqueda: "ferretería", prioridad: "Baja", grupo: "Comercio y alojamiento" },
  { nombre: "Lavandería", busqueda: "lavandería", prioridad: "Baja", grupo: "Comercio y alojamiento" },
  { nombre: "Otro", busqueda: "", prioridad: "Baja", grupo: "Otro" },
];

export const ZONAS: Record<string, string[]> = {
  "Lima Norte": ["Los Olivos", "San Martín de Porres", "Independencia", "Comas", "Puente Piedra"],
  "Lima Este": ["San Juan de Lurigancho", "Ate", "Santa Anita", "La Molina", "El Agustino"],
  "Lima Sur": ["Chorrillos", "Villa El Salvador", "San Juan de Miraflores", "Villa María del Triunfo"],
  "Lima Centro": ["Jesús María", "Lince", "Pueblo Libre", "Magdalena del Mar", "San Miguel", "Breña", "Cercado de Lima"],
  "Lima Moderna": ["Santiago de Surco", "San Borja", "Miraflores", "San Isidro", "Surquillo", "Barranco"],
  Callao: ["Bellavista", "La Perla", "Callao"],
};
export const DISTRITOS = [...Object.values(ZONAS).flat(), "Otro"];

export const ETAPAS = [
  "Nuevo",
  "Contactado",
  "Respondió",
  "Interesado",
  "Boceto enviado",
  "Cotización enviada",
  "Ganado",
  "Perdido",
  "Descartado",
] as const;
export type Etapa = (typeof ETAPAS)[number];
export const ETAPAS_CERRADAS: string[] = ["Ganado", "Perdido", "Descartado"];
export const ETAPAS_INTERES: string[] = ["Interesado", "Boceto enviado", "Cotización enviada", "Ganado"];

/** Días hasta el siguiente seguimiento según el número de toques ya hechos (A→B día 3, B→C día 6, C→D día 10). */
export const DIAS_SIGUIENTE_TOQUE: Record<number, number> = { 1: 2, 2: 3, 3: 4 };
export const MAX_TOQUES = 4;

export const WEB_LABEL: Record<string, string> = {
  sin_web: "Sin web",
  solo_redes: "Solo redes",
  con_web: "Con web",
};

export const TIPOS_EVENTO = ["reunion", "llamada", "entrega", "otro"] as const;
export const TIPO_EVENTO_LABEL: Record<string, string> = {
  reunion: "Reunión",
  llamada: "Llamada",
  entrega: "Entrega",
  otro: "Otro",
};

export function metaDiaria(): number {
  return Number(process.env.META_DIARIA ?? 50) || 50;
}
