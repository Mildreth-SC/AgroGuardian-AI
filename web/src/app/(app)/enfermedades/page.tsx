"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { DISEASE_CATALOG } from "@/lib/diseases";
import { usePreferences } from "@/providers/preferences-provider";
import { cn } from "@/lib/utils";

const severityStyle = {
  bajo: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medio: "bg-amber-50 text-amber-900 border-amber-200",
  alto: "bg-orange-50 text-orange-900 border-orange-200",
  critico: "bg-red-50 text-red-800 border-red-200",
};

export default function EnfermedadesPage() {
  const { locale } = usePreferences();

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Sanidad vegetal</p>
        <h1 className="font-display text-3xl text-forest mt-1">
          {locale === "en" ? "Disease encyclopedia" : "Enciclopedia de enfermedades"}
        </h1>
        <p className="text-sm text-ink/60 mt-1 max-w-2xl">
          {locale === "en"
            ? "Catalog of major crop diseases in Manabí — symptoms, climate risk and treatments."
            : "Catálogo de enfermedades principales en Manabí — síntomas, riesgo climático y tratamientos."}
        </p>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {DISEASE_CATALOG.map((d) => (
          <Link
            key={d.slug}
            href={`/enfermedades/${d.slug}`}
            className="group rounded-2xl border border-forest/10 bg-cream overflow-hidden hover:border-leaf/40 hover:shadow-md transition-all"
          >
            {d.image && (
              <div className="h-32 overflow-hidden bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt={locale === "en" ? d.nameEn : d.nameEs}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg text-forest">
                    {locale === "en" ? d.nameEn : d.nameEs}
                  </h2>
                  <p className="text-xs text-ink/50 mt-0.5">{d.crop}</p>
                </div>
                <span
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0",
                    severityStyle[d.severity]
                  )}
                >
                  {d.severity}
                </span>
              </div>
              <p className="text-xs text-ink/55 mt-2 line-clamp-2">
                {(locale === "en" ? d.symptomsEn : d.symptomsEs)[0]}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-leaf mt-3 font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                {locale === "en" ? "View protocol" : "Ver protocolo"}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
