"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { History, List, Share2 } from "lucide-react";
import { getCases, pdfUrl, type DiagnosisResult } from "@/lib/api";
import { diagnosisShareText, whatsAppShare } from "@/lib/share";
import { usePreferences } from "@/providers/preferences-provider";
import { cn, pct, riskColor } from "@/lib/utils";

export default function DiagnosticosPage() {
  const [cases, setCases] = useState<DiagnosisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "timeline">("timeline");
  const { locale, t } = usePreferences();
  const dateLocale = locale === "en" ? enUS : es;

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Historial</p>
          <h1 className="font-display text-3xl text-forest mt-1">{t("nav.diagnostics")}</h1>
          <p className="text-sm text-ink/60 mt-1">
            {locale === "en"
              ? "Persistent history from Supabase + active session."
              : "Historial persistente en Supabase + sesión activa."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("timeline")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
              view === "timeline" ? "border-leaf bg-leaf/10 text-leaf" : "border-forest/15"
            )}
          >
            <History className="h-4 w-4" /> Timeline
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
              view === "table" ? "border-leaf bg-leaf/10 text-leaf" : "border-forest/15"
            )}
          >
            <List className="h-4 w-4" /> Tabla
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {!error && cases.length === 0 && (
        <p className="text-sm text-ink/55 rounded-2xl border border-dashed border-forest/20 bg-cream px-4 py-10 text-center">
          {t("timeline.empty")}
        </p>
      )}

      {view === "timeline" && cases.length > 0 && (
        <div className="relative pl-6 border-l-2 border-leaf/30 space-y-6">
          {cases.map((c) => (
            <article key={c.id} className="relative rounded-2xl border border-forest/10 bg-cream p-4 shadow-sm">
              <span className="absolute -left-[1.6rem] top-4 h-3 w-3 rounded-full bg-leaf ring-4 ring-mist" />
              <time className="text-xs text-ink/45">
                {format(new Date(c.created_at), "PPp", { locale: dateLocale })}
              </time>
              <h2 className="font-display text-xl text-forest mt-1">{c.detection.disease}</h2>
              <p className="text-sm text-ink/60">
                {c.detection.crop} · {pct(c.detection.confidence)} ·{" "}
                <span className={cn("uppercase text-xs font-semibold", riskColor(c.detection.risk_level))}>
                  {c.detection.risk_level}
                </span>
              </p>
              {c.diagnosis && (
                <p className="text-sm text-ink/75 mt-2 line-clamp-2">{c.diagnosis}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={pdfUrl(c.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-leaf font-medium hover:underline"
                >
                  PDF
                </a>
                <button
                  type="button"
                  onClick={() =>
                    whatsAppShare(
                      diagnosisShareText(
                        c.detection.disease,
                        c.detection.crop,
                        c.detection.confidence
                      )
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs text-leaf font-medium hover:underline"
                >
                  <Share2 className="h-3 w-3" /> WhatsApp
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === "table" && cases.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-forest/10 bg-cream">
          <table className="min-w-full text-sm">
            <thead className="bg-forest text-cream text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cultivo</th>
                <th className="px-4 py-3 font-medium">Enfermedad</th>
                <th className="px-4 py-3 font-medium">Confianza</th>
                <th className="px-4 py-3 font-medium">Riesgo</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id} className="border-t border-forest/8">
                  <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                    {format(new Date(c.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                  </td>
                  <td className="px-4 py-3">{c.detection.crop}</td>
                  <td className="px-4 py-3 font-medium">{c.detection.disease}</td>
                  <td className="px-4 py-3">{pct(c.detection.confidence)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                        riskColor(c.detection.risk_level)
                      )}
                    >
                      {c.detection.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={pdfUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-leaf hover:underline text-xs font-medium"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
