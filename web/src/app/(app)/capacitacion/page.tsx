import Link from "next/link";
import { BookOpen, PlayCircle, Sprout } from "lucide-react";

const COURSES = [
  {
    id: "1",
    title: "Identificación de Sigatoka Negra",
    duration: "25 min",
    level: "Básico",
    desc: "Aprende a reconocer síntomas tempranos en plátano y banano.",
  },
  {
    id: "2",
    title: "Manejo integrado de plagas (MIP)",
    duration: "40 min",
    level: "Intermedio",
    desc: "Estrategias sostenibles para cacao y café en clima húmedo.",
  },
  {
    id: "3",
    title: "Riego eficiente en época seca",
    duration: "20 min",
    level: "Básico",
    desc: "Optimiza agua según humedad del suelo y pronóstico.",
  },
  {
    id: "4",
    title: "Preparación de suelos para siembra",
    duration: "35 min",
    level: "Intermedio",
    desc: "Análisis, cal agrícola y rotación de cultivos.",
  },
  {
    id: "5",
    title: "Uso seguro de fungicidas",
    duration: "30 min",
    level: "Avanzado",
    desc: "Dosificación, EPP y cumplimiento normativo MAG.",
  },
  {
    id: "6",
    title: "Certificación orgánica — primeros pasos",
    duration: "45 min",
    level: "Intermedio",
    desc: "Requisitos y beneficios para pequeños productores.",
  },
];

export default function CapacitacionPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Aprendizaje</p>
        <h1 className="font-display text-3xl text-forest mt-1">Capacitación</h1>
        <p className="text-sm text-ink/60 mt-1">
          Cursos y guías para mejorar la sanidad vegetal y productividad de tu finca.
        </p>
      </header>

      <div className="rounded-2xl border border-leaf/20 bg-leaf/5 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Sprout className="h-10 w-10 text-leaf shrink-0" />
        <div className="flex-1">
          <h2 className="font-display text-xl text-forest">Ruta recomendada para ti</h2>
          <p className="text-sm text-ink/60 mt-1">
            Basado en tus cultivos (plátano y cacao), empieza con Sigatoka Negra y MIP.
          </p>
        </div>
        <Link
          href="/enfermedades"
          className="rounded-xl border border-leaf/30 bg-white px-4 py-2.5 text-sm font-medium text-leaf hover:bg-leaf/5 shrink-0"
        >
          Enciclopedia
        </Link>
        <Link
          href="/escanear"
          className="rounded-xl bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark shrink-0"
        >
          Practicar con escaneo
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {COURSES.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-forest/10 bg-cream p-5 hover:border-leaf/30 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <BookOpen className="h-5 w-5 text-leaf" />
              <span className="rounded-md bg-mist px-2 py-0.5 text-[10px] font-semibold uppercase text-ink/50">
                {c.level}
              </span>
            </div>
            <h3 className="font-display text-lg text-forest mt-3 group-hover:text-leaf transition-colors">
              {c.title}
            </h3>
            <p className="text-sm text-ink/60 mt-2 leading-relaxed">{c.desc}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-ink/45">
              <span>{c.duration}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-leaf font-medium hover:underline"
              >
                <PlayCircle className="h-4 w-4" />
                Iniciar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
