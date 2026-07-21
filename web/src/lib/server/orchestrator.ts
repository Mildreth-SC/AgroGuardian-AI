import { randomUUID } from "crypto";
import type { AppConfig } from "./config";
import { hasOpenRouter } from "./config";
import { chatCompletion, extractJson, visionAnalyze } from "./openrouter";
import { demoWeather, fetchWeather } from "./weather";
import type {
  AgentTrace,
  DiagnosisResult,
  DiseaseDetection,
  FollowUpPlan,
  Recommendation,
  RiskLevel,
  WeatherSnapshot,
} from "@/types/api";

const VISION_PROMPT = `Eres un detector de enfermedades vegetales para cultivos de Manabí, Ecuador
(plátano, cacao, maíz, café, arroz). Analiza la imagen de la hoja/planta.

Responde SOLO JSON válido con esta forma:
{
  "disease": "nombre de la enfermedad o 'Sano'",
  "crop": "cultivo probable",
  "confidence": 0.0 a 1.0,
  "affected_part": "hoja|tallo|fruto|raiz",
  "risk_level": "bajo|medio|alto|critico",
  "rationale": "explicación breve en español de señales visuales"
}`;

function demoDetection(cropHint?: string | null): DiseaseDetection {
  return {
    disease: "Sigatoka Negra",
    crop: cropHint || "Plátano",
    confidence: 0.94,
    affected_part: "hoja",
    risk_level: "alto",
    rationale:
      "Manchas necróticas alargadas con borde amarillo en el limbo foliar, patrón típico de Mycosphaerella fijiensis en plátano.",
    alternatives: [
      { disease: "Sigatoka amarilla", confidence: 0.04 },
      { disease: "Deficiencia nutricional", confidence: 0.02 },
    ],
  };
}

function demoAgronomist(detection: DiseaseDetection, climate: WeatherSnapshot) {
  const diagnosis = `Encontramos una alta probabilidad de ${detection.disease} (${Math.round(detection.confidence * 100)}%) en ${detection.crop}. Las señales visuales indican afectación en ${detection.affected_part}. Debido a la humedad registrada (${climate.humidity_pct}%) y la condición «${climate.condition}», existe un alto riesgo de propagación en las próximas 48–72 h.`;
  const recommendations: Recommendation[] = [
    { title: "Eliminar hojas afectadas", detail: "Retirar y destruir hojas con lesiones activas fuera del lote.", priority: 1, timeframe: "hoy" },
    { title: "Evitar riego por aspersión", detail: "La humedad foliar favorece la esporulación; suspender riego aéreo hoy.", priority: 1, timeframe: "24h" },
    { title: "Aplicar fungicida recomendado", detail: "Aplicar en focos afectados según etiqueta local (consulta técnica MAG).", priority: 2, timeframe: "48h" },
    { title: "Monitorear lote vecino", detail: "Inspeccionar plantas adyacentes y registrar nuevos síntomas.", priority: 2, timeframe: "72h" },
  ];
  const follow_up: FollowUpPlan = {
    check_in_hours: 72,
    steps: [
      "Tomar nueva foto de la misma planta en 72 horas",
      "Registrar si aparecen manchas nuevas",
      "Actualizar clima y ajustar tratamiento",
    ],
  };
  return { diagnosis, recommendations, follow_up };
}

async function llmAgronomist(
  cfg: AppConfig,
  detection: DiseaseDetection,
  climate: WeatherSnapshot
) {
  const prompt = `Eres un agrónomo experto en Manabí, Ecuador. Genera un diagnóstico accionable.

Detección: ${JSON.stringify(detection)}
Clima: ${JSON.stringify(climate)}

Responde SOLO JSON:
{
  "diagnosis": "texto en español (3-5 oraciones)",
  "recommendations": [{"title":"...","detail":"...","priority":1,"timeframe":"hoy|24h|48h|72h"}],
  "follow_up": {"check_in_hours": 72, "steps": ["..."]}
}
Máximo 4 recomendaciones.`;

  const raw = await chatCompletion(cfg, [
    { role: "system", content: "Eres AgroGuardian, agrónomo IA. Responde solo JSON." },
    { role: "user", content: prompt },
  ]);

  const data = extractJson(raw);
  return {
    diagnosis: String(data.diagnosis ?? ""),
    recommendations: (data.recommendations as Recommendation[]) ?? [],
    follow_up: (data.follow_up as FollowUpPlan) ?? { check_in_hours: 72, steps: [] },
  };
}

export async function runDiagnosisPipeline(
  cfg: AppConfig,
  imageBytes: Buffer,
  opts: {
    mime?: string;
    cropHint?: string | null;
    lat?: number | null;
    lon?: number | null;
    onProgress?: (trace: AgentTrace) => void;
  }
): Promise<DiagnosisResult> {
  const traces: AgentTrace[] = [];
  const pushTrace = (trace: AgentTrace) => {
    traces.push(trace);
    opts.onProgress?.(trace);
  };
  const useDemo = cfg.demoMode && !hasOpenRouter(cfg);

  let t0 = Date.now();
  let detection: DiseaseDetection;
  if (useDemo) {
    detection = demoDetection(opts.cropHint);
    pushTrace({
      agent: "Disease Detector",
      status: "demo",
      summary: `Detección simulada: ${detection.disease} (${Math.round(detection.confidence * 100)}%)`,
      duration_ms: Date.now() - t0,
    });
  } else {
    let prompt = VISION_PROMPT;
    if (opts.cropHint) prompt += `\nEl agricultor indica que el cultivo es: ${opts.cropHint}.`;
    const raw = await visionAnalyze(cfg, imageBytes, prompt, opts.mime ?? "image/jpeg");
    const payload = extractJson(raw);
    detection = {
      disease: String(payload.disease ?? "Desconocido"),
      crop: String(payload.crop ?? opts.cropHint ?? "Desconocido"),
      confidence: Number(payload.confidence ?? 0.5),
      affected_part: String(payload.affected_part ?? "hoja"),
      risk_level: String(payload.risk_level ?? "medio").toLowerCase() as RiskLevel,
      rationale: String(payload.rationale ?? ""),
      alternatives: Array.isArray(payload.alternatives)
        ? (payload.alternatives as { disease: string; confidence: number }[]).slice(0, 3)
        : undefined,
    };
    pushTrace({
      agent: "Disease Detector",
      status: "ok",
      summary: `${detection.disease} · ${Math.round(detection.confidence * 100)}%`,
      duration_ms: Date.now() - t0,
    });
  }

  t0 = Date.now();
  let climate: WeatherSnapshot;
  let climateStatus = "ok";
  try {
    climate = await fetchWeather(cfg, opts.lat, opts.lon);
  } catch {
    climate = demoWeather();
    climateStatus = "fallback-demo";
  }
  pushTrace({
    agent: "Climate Agent",
    status: climateStatus,
    summary: `${climate.condition} · ${climate.humidity_pct}% humedad · riesgo ${climate.climate_risk}`,
    duration_ms: Date.now() - t0,
  });

  t0 = Date.now();
  let diagnosis: string;
  let recommendations: Recommendation[];
  let follow_up: FollowUpPlan;
  if (useDemo) {
    ({ diagnosis, recommendations, follow_up } = demoAgronomist(detection, climate));
    pushTrace({ agent: "Agronomist", status: "demo", summary: "Plan demo", duration_ms: Date.now() - t0 });
  } else {
    ({ diagnosis, recommendations, follow_up } = await llmAgronomist(cfg, detection, climate));
    pushTrace({ agent: "Agronomist", status: "ok", summary: "Diagnóstico contextualizado", duration_ms: Date.now() - t0 });
  }

  pushTrace({
    agent: "Report Agent",
    status: "ok",
    summary: "Caso empaquetado para historial y PDF",
    duration_ms: 5,
    data: { recommendations: recommendations.length },
  });

  return {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    detection,
    weather: climate,
    diagnosis,
    recommendations,
    follow_up,
    agent_trace: traces,
    demo: useDemo,
  };
}
