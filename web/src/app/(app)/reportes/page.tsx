"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import { getReports, pdfUrl, type ReportItem } from "@/lib/api";
import { usePreferences } from "@/providers/preferences-provider";
import { cn, pct, riskColor } from "@/lib/utils";

export default function ReportesPage() {
  const { locale, t } = usePreferences();
  const dateLocale = locale === "en" ? enUS : es;
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        r.disease.toLowerCase().includes(q) ||
        r.crop.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "all" || r.risk_level === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [reports, query, riskFilter]);

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Documentación</p>
        <h1 className="font-display text-3xl text-forest mt-1">{t("nav.reports")}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {locale === "en"
            ? "Each scan generates a PDF with image, weather, recommendations and follow-up plan."
            : "Cada diagnóstico genera un PDF con imagen, clima, recomendaciones y plan de seguimiento."}
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={locale === "en" ? "Search disease or crop…" : "Buscar enfermedad o cultivo…"}
            className="w-full rounded-xl border border-forest/15 bg-cream py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="rounded-xl border border-forest/15 bg-cream px-3 py-2.5 text-sm"
        >
          <option value="all">{locale === "en" ? "All risks" : "Todos los riesgos"}</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
          <option value="critico">Crítico</option>
        </select>
        <Link
          href="/escanear"
          className="inline-flex items-center justify-center rounded-xl bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark"
        >
          {locale === "en" ? "New scan" : "Nuevo escaneo"}
        </Link>
      </div>

      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {!error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-cream px-4 py-12 text-center space-y-3">
          <FileText className="mx-auto h-10 w-10 text-leaf/60" />
          <p className="text-sm text-ink/55">
            {locale === "en"
              ? "No reports yet. Scan a plant to generate your first PDF."
              : "Aún no hay reportes. Escanea una planta para generar tu primer PDF."}
          </p>
          <Link href="/escanear" className="text-sm text-leaf font-medium hover:underline">
            {locale === "en" ? "Go to scan" : "Ir a escanear"}
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-forest/10 bg-cream p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf/10 text-leaf">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink/45">
                {format(new Date(r.created_at), "PPp", { locale: dateLocale })}
              </p>
              <h2 className="font-display text-lg text-forest truncate">{r.disease}</h2>
              <p className="text-sm text-ink/60 truncate">
                {r.crop} · {pct(r.confidence)} ·{" "}
                <span className={cn("uppercase text-xs font-semibold", riskColor(r.risk_level))}>
                  {r.risk_level}
                </span>
              </p>
              {r.summary && <p className="text-xs text-ink/50 mt-1 line-clamp-1">{r.summary}</p>}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/diagnosticos/${r.detection_id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-forest/15 bg-white px-3 py-2 text-xs font-medium hover:bg-mist"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {locale === "en" ? "View" : "Ver"}
              </Link>
              <a
                href={r.pdf_url || pdfUrl(r.detection_id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-xs font-medium text-cream hover:bg-leaf-dark"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
