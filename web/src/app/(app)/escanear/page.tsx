"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { AgentProgress, type AgentStep } from "@/components/scan/AgentProgress";
import { CameraCapture, ImageDropzone } from "@/components/scan/CameraCapture";
import {
  diagnoseImageStream,
  pdfUrl,
  type AgentTrace,
  type DiagnosisResult,
} from "@/lib/api";
import { SAMPLE_IMAGES } from "@/lib/samples";
import { cn, pct, riskColor } from "@/lib/utils";

const CROPS = ["Plátano", "Cacao", "Maíz", "Café", "Arroz", "Otro"];

export default function EscanearPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [crop, setCrop] = useState("Plátano");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setSteps([]);
  };

  const loadSample = async (src: string, name: string, cropName: string) => {
    const res = await fetch(src);
    const blob = await res.blob();
    const f = new File([blob], name, { type: blob.type || "image/jpeg" });
    setCrop(cropName);
    onFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSteps([]);
    try {
      let lat: number | undefined;
      let lon: number | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
          );
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          /* optional */
        }
      }

      const upsert = (trace: AgentTrace) => {
        setSteps((prev) => [...prev.filter((s) => s.agent !== trace.agent), trace]);
      };

      await diagnoseImageStream(file, { crop, lat, lon }, {
        onProgress: upsert,
        onResult: (data) => {
          setResult(data);
          setSteps(data.agent_trace);
          sessionStorage.setItem(`diagnosis:${data.id}`, JSON.stringify(data));
        },
        onError: (msg) => setError(msg),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Sanidad vegetal</p>
        <h1 className="font-display text-3xl text-forest mt-1">Escanear planta</h1>
        <p className="text-sm text-ink/60 mt-1">
          Toma una foto de la hoja o sube una imagen. La IA detecta la enfermedad, consulta el clima y
          recomienda acciones.
        </p>
      </header>

      <div className="rounded-2xl border border-forest/10 bg-cream p-4 sm:p-5 space-y-5">
        <div>
          <label className="text-xs font-medium text-ink/60">Cultivo</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CROPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCrop(c)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm border transition-colors",
                  crop === c
                    ? "bg-leaf text-white border-leaf"
                    : "bg-white border-forest/15 text-ink hover:border-leaf/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-ink/60 mb-2">Muestras demo (estilo PlantVillage)</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_IMAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={loading}
                onClick={() => void loadSample(s.src, s.filename, s.crop)}
                className="rounded-lg border border-forest/15 bg-white px-3 py-1.5 text-xs hover:border-leaf/40 disabled:opacity-40"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <CameraCapture onCapture={onFile} disabled={loading} />

        <div className="relative flex items-center gap-3 text-xs text-ink/40">
          <div className="h-px flex-1 bg-forest/10" />
          o sube desde galería
          <div className="h-px flex-1 bg-forest/10" />
        </div>

        <ImageDropzone
          previewUrl={preview}
          onFile={onFile}
          onClear={() => {
            setFile(null);
            setResult(null);
            setSteps([]);
          }}
          disabled={loading}
        />

        <button
          type="button"
          disabled={!file || loading}
          onClick={() => void analyze()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-3.5 text-sm font-semibold text-cream disabled:opacity-40 hover:bg-leaf-dark transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analizando con agentes IA…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analizar muestra
            </>
          )}
        </button>

        {(loading || steps.length > 0) && !result && (
          <AgentProgress steps={steps} active={loading} />
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
            <span className="block text-xs mt-1 opacity-80">
              Si el error menciona un modelo, espera 1 minuto y reintenta — los modelos :free rotan.
              Revisa Configuración → estado API o contacta soporte con este mensaje.
            </span>
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-2xl border border-forest/10 bg-white p-4 sm:p-6 space-y-4 shadow-sm animate-fade-up">
          {result.demo && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Modo demo (sin OpenRouter). Configura OPENROUTER_API_KEY con modelos gratuitos (:free).
            </p>
          )}

          <AgentProgress steps={result.agent_trace} active={false} />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/45">Diagnóstico</p>
              <h2 className="font-display text-2xl text-forest">{result.detection.disease}</h2>
              <p className="text-sm text-ink/55">
                {result.detection.crop} · {result.detection.affected_part}
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

          {result.detection.alternatives && result.detection.alternatives.length > 0 && (
            <div className="rounded-xl border border-forest/10 bg-mist/50 px-3 py-2.5">
              <p className="text-xs font-medium text-ink/50 mb-2">Segunda opinión IA</p>
              <ul className="space-y-1">
                {result.detection.alternatives.map((alt) => (
                  <li key={alt.disease} className="flex justify-between text-xs">
                    <span>{alt.disease}</span>
                    <span className="text-ink/45">{pct(alt.confidence)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-2 text-xs">
            <Metric label="Temp" value={`${result.weather.temperature_c}°C`} />
            <Metric label="Humedad" value={`${result.weather.humidity_pct}%`} />
            <Metric label="Clima" value={result.weather.condition} />
          </div>

          <div>
            <h3 className="font-medium text-forest mb-2">IA recomienda</h3>
            <ul className="space-y-2">
              {result.recommendations.map((r, idx) => (
                <li key={idx} className="rounded-xl border border-forest/10 bg-mist/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.title}</p>
                    <span className="text-[10px] uppercase tracking-wide text-ink/40">{r.timeframe}</span>
                  </div>
                  <p className="text-xs text-ink/60 mt-0.5">{r.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={pdfUrl(result.id)}
              className="rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-sm hover:bg-mist"
              target="_blank"
              rel="noreferrer"
            >
              Descargar reporte
            </a>
            <button
              type="button"
              onClick={() => router.push("/diagnosticos")}
              className="rounded-xl bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark"
            >
              Ver historial
            </button>
          </div>
        </div>
      )}
    </div>
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
