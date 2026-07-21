import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import { DiseaseThumbnail } from "@/components/diseases/DiseaseThumbnail";
import { DISEASE_CATALOG, getDiseaseBySlug } from "@/lib/diseases";

export function generateStaticParams() {
  return DISEASE_CATALOG.map((d) => ({ slug: d.slug }));
}

export default async function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const disease = getDiseaseBySlug(slug);
  if (!disease) notFound();

  return (
    <div className="max-w-3xl space-y-6 animate-fade-up">
      <Link href="/enfermedades" className="inline-flex items-center gap-1 text-sm text-leaf hover:underline">
        <ArrowLeft className="h-4 w-4" /> Enciclopedia
      </Link>

      <header className="rounded-2xl border border-forest/10 bg-cream p-5 sm:p-6">
        <DiseaseThumbnail slug={disease.slug} image={disease.image} alt={disease.nameEs} variant="detail" />
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">{disease.crop}</p>
        <h1 className="font-display text-3xl text-forest mt-1">{disease.nameEs}</h1>
        <p className="text-sm text-ink/55 italic mt-1">{disease.nameEn}</p>
        <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink/45">Patógeno</dt>
            <dd className="font-medium">{disease.pathogen}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/45">Temporada crítica</dt>
            <dd>{disease.season}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink/45">Riesgo climático</dt>
            <dd>{disease.riskClimate}</dd>
          </div>
        </dl>
      </header>

      <section className="rounded-2xl border border-forest/10 bg-cream p-5">
        <h2 className="font-display text-xl text-forest mb-3">Síntomas</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-ink/80">
          {disease.symptomsEs.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-forest/10 bg-cream p-5">
        <h2 className="font-display text-xl text-forest mb-3">Tratamiento recomendado</h2>
        <ul className="space-y-2">
          {disease.treatmentEs.map((t, i) => (
            <li key={t} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/escanear"
        className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-cream hover:bg-leaf transition-colors"
      >
        <ScanLine className="h-4 w-4" />
        Escanear planta con esta referencia
      </Link>
    </div>
  );
}
