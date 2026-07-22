"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { DiagnosisSources } from "@/components/ai/DiagnosisSources";
import { FeedbackPanel } from "@/components/diagnostics/FeedbackPanel";
import { RecommendationsChecklist } from "@/components/diagnostics/RecommendationsChecklist";
import { AgentProgress } from "@/components/scan/AgentProgress";
import { getDiagnosisById, pdfUrl, type DiagnosisResult } from "@/lib/api";
import { diagnosisShareText, whatsAppShare } from "@/lib/share";
import { cn, pct, riskColor } from "@/lib/utils";

export default function DiagnosticoDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDiagnosisById(id)
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-2xl space-y-4">
        <BackLink />
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl">
        <BackLink />
        <p className="text-sm text-ink/50 mt-4">Cargando diagnóstico…</p>
      </div>
    );
  }

  const followDue = new Date(result.created_at).getTime() + result.follow_up.check_in_hours * 3600000;
  const followPending = Date.now() >= followDue;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <BackLink />

      {followPending && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Seguimiento pendiente — revisa la planta y toma una nueva foto de comparación.
        </p>
      )}

      <div className="rounded-2xl border border-forest/10 bg-white p-4 sm:p-6 space-y-4 shadow-sm">
        <AgentProgress steps={result.agent_trace} active={false} />
        <DiagnosisSources result={result} />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/45">Diagnóstico</p>
            <h1 className="font-display text-2xl text-forest">{result.detection.disease}</h1>
            <p className="text-sm text-ink/55">
              {result.detection.crop} · {result.detection.affected_part}
            </p>
            <p className="text-xs text-ink/40 mt-1">
              {new Date(result.created_at).toLocaleString("es-EC")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-leaf">{pct(result.detection.confidence)}</p>
            <span
              className={cn(
                "inline-block mt-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase",
                riskColor(result.detection.risk_level)
              )}
            >
              Riesgo {result.detection.risk_level}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink/80">{result.diagnosis}</p>

        <div className="grid sm:grid-cols-3 gap-2 text-xs">
          <Metric label="Temp" value={`${result.weather.temperature_c}°C`} />
          <Metric label="Humedad" value={`${result.weather.humidity_pct}%`} />
          <Metric label="Clima" value={result.weather.condition} />
        </div>

        <RecommendationsChecklist
          recommendations={result.recommendations}
          onChange={(recs) => setResult((r) => (r ? { ...r, recommendations: recs } : r))}
        />

        <div className="rounded-xl border border-forest/10 bg-mist/40 px-3 py-3 text-sm">
          <p className="font-medium text-forest">Plan de seguimiento</p>
          <p className="text-xs text-ink/55 mt-1">
            Revisión sugerida en {result.follow_up.check_in_hours} h
          </p>
          <ul className="mt-2 space-y-1 text-xs text-ink/70">
            {result.follow_up.steps.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>

        <FeedbackPanel detectionId={result.id} initial={result.feedback} />

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={result.report_url ?? pdfUrl(result.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-leaf-dark"
            target="_blank"
            rel="noreferrer"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
          <Link
            href="/escanear"
            className="rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm hover:bg-mist"
          >
            Foto de seguimiento
          </Link>
          <button
            type="button"
            onClick={() =>
              whatsAppShare(
                diagnosisShareText(
                  result.detection.disease,
                  result.detection.crop,
                  result.detection.confidence
                )
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm hover:bg-mist"
          >
            <Share2 className="h-4 w-4" />
            WhatsApp
          </button>
        </div>

        <AiDisclaimer compact />
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/diagnosticos"
      className="inline-flex items-center gap-1.5 text-sm text-leaf hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver al historial
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-mist px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className="font-medium text-ink truncate">{value}</p>
    </div>
  );
}
