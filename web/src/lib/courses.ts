export type Course = {
  id: string;
  title: string;
  duration: string;
  level: "Básico" | "Intermedio" | "Avanzado";
  desc: string;
  videoUrl: string;
  videoSource: string;
  relatedHref?: string;
};

/** Videos educativos en español (INIAP, FAO, Agrocalidad, sanidad vegetal). */
export const COURSES: Course[] = [
  {
    id: "1",
    title: "Identificación de Sigatoka Negra",
    duration: "25 min",
    level: "Básico",
    desc: "Aprende a reconocer síntomas tempranos en plátano y banano.",
    videoUrl: "https://www.youtube.com/watch?v=mEc1xsTv6Fw",
    videoSource: "Banana Time Ecuador · control biológico sigatoka",
    relatedHref: "/enfermedades/sigatoka-negra",
  },
  {
    id: "2",
    title: "Manejo integrado de plagas (MIP)",
    duration: "40 min",
    level: "Intermedio",
    desc: "Estrategias sostenibles para cacao y café en clima húmedo.",
    videoUrl: "https://www.youtube.com/watch?v=XHIeG9JA0ns",
    videoSource: "INIAP · moniliasis del cacao (MIP)",
    relatedHref: "/enfermedades/monilia-cacao",
  },
  {
    id: "3",
    title: "Riego eficiente en época seca",
    duration: "20 min",
    level: "Básico",
    desc: "Optimiza agua según humedad del suelo y pronóstico.",
    videoUrl: "https://www.youtube.com/watch?v=h8P4bAnQOhQ",
    videoSource: "FAO Américas · riego tecnificado",
    relatedHref: "/clima",
  },
  {
    id: "4",
    title: "Preparación de suelos para siembra",
    duration: "35 min",
    level: "Intermedio",
    desc: "Análisis, cal agrícola y rotación de cultivos.",
    videoUrl: "https://www.youtube.com/watch?v=_IvTlHufT04",
    videoSource: "Agricultura de conservación · preparación del suelo",
    relatedHref: "/cultivos",
  },
  {
    id: "5",
    title: "Uso seguro de fungicidas",
    duration: "30 min",
    level: "Avanzado",
    desc: "Dosificación, EPP y cumplimiento normativo MAG.",
    videoUrl: "https://www.youtube.com/watch?v=5IFHv0vos5M",
    videoSource: "Capacitación EPP · fitosanitarios",
  },
  {
    id: "6",
    title: "Certificación orgánica — primeros pasos",
    duration: "45 min",
    level: "Intermedio",
    desc: "Requisitos y beneficios para pequeños productores.",
    videoUrl: "https://www.youtube.com/watch?v=0obqJ1HHe90",
    videoSource: "Agrocalidad Ecuador · normativa orgánica",
    relatedHref: "https://organicos.agrocalidad.gob.ec/",
  },
];
