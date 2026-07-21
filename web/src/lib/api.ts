const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

export type AgentTrace = {
  agent: string;
  status: string;
  summary: string;
  duration_ms: number;
  data?: Record<string, unknown>;
};

export type DiagnosisResult = {
  id: string;
  created_at: string;
  detection: {
    disease: string;
    crop: string;
    confidence: number;
    affected_part: string;
    risk_level: RiskLevel;
    rationale: string;
  };
  weather: {
    temperature_c: number;
    humidity_pct: number;
    rain_mm: number;
    wind_kmh: number;
    condition: string;
    climate_risk: RiskLevel;
    source: string;
    location: string;
  };
  diagnosis: string;
  recommendations: {
    title: string;
    detail: string;
    priority: number;
    timeframe: string;
  }[];
  follow_up: {
    check_in_hours: number;
    steps: string[];
  };
  agent_trace: AgentTrace[];
  demo: boolean;
  image_path?: string | null;
  farm_id?: string | null;
  crop_id?: string | null;
};

export type WeatherSnapshot = DiagnosisResult["weather"];

export type Farm = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area_ha: number;
  health_status: "sano" | "riesgo" | "infectado";
  owner_id?: string;
  created_at?: string;
};

export type Crop = {
  id: string;
  farm_id: string;
  name: string;
  variety: string;
  growth_stage: string;
  health_pct: number;
  status: "sano" | "riesgo" | "infectado";
  hectares: number;
};

export function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}/api/media/${path.replace(/^\//, "")}`;
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("API no disponible");
  return res.json() as Promise<{
    status: string;
    demo_mode: boolean;
    openrouter: boolean;
    openweather: boolean;
  }>;
}

export async function getWeather(lat?: number, lon?: number) {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", String(lat));
  if (lon != null) params.set("lon", String(lon));
  const q = params.toString() ? `?${params}` : "";
  const res = await fetch(`${API_URL}/api/weather${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo obtener el clima");
  return res.json() as Promise<WeatherSnapshot>;
}

export type DiagnoseMeta = {
  crop?: string;
  lat?: number;
  lon?: number;
  farm_id?: string;
  crop_id?: string;
};

function appendMeta(form: FormData, meta?: DiagnoseMeta) {
  if (meta?.crop) form.append("crop", meta.crop);
  if (meta?.lat != null) form.append("lat", String(meta.lat));
  if (meta?.lon != null) form.append("lon", String(meta.lon));
  if (meta?.farm_id) form.append("farm_id", meta.farm_id);
  if (meta?.crop_id) form.append("crop_id", meta.crop_id);
}

export async function diagnoseImage(file: Blob, meta?: DiagnoseMeta) {
  const form = new FormData();
  const name = file instanceof File ? file.name : "capture.jpg";
  form.append("file", file, name);
  appendMeta(form, meta);

  const res = await fetch(`${API_URL}/api/diagnose`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al analizar la imagen");
  }
  return res.json() as Promise<DiagnosisResult>;
}

export async function diagnoseImageStream(
  file: Blob,
  meta: DiagnoseMeta | undefined,
  handlers: {
    onProgress: (trace: AgentTrace) => void;
    onResult: (result: DiagnosisResult) => void;
    onError?: (message: string) => void;
  }
) {
  const form = new FormData();
  const name = file instanceof File ? file.name : "capture.jpg";
  form.append("file", file, name);
  appendMeta(form, meta);

  const res = await fetch(`${API_URL}/api/diagnose/stream`, {
    method: "POST",
    body: form,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error al analizar la imagen");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotResult = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (event === "progress") handlers.onProgress(parsed as AgentTrace);
        else if (event === "result") {
          gotResult = true;
          handlers.onResult(parsed as DiagnosisResult);
        } else if (event === "error") {
          handlers.onError?.(parsed.detail || "Error en el pipeline");
        }
      } catch {
        /* ignore partial JSON */
      }
    }
  }

  if (!gotResult) throw new Error("El stream terminó sin resultado");
}

export async function getCases() {
  const res = await fetch(`${API_URL}/api/cases`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el historial");
  return res.json() as Promise<DiagnosisResult[]>;
}

export async function getFarms() {
  const res = await fetch(`${API_URL}/api/farms`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron cargar las fincas");
  return res.json() as Promise<Farm[]>;
}

export async function createFarm(payload: {
  name: string;
  lat?: number;
  lng?: number;
  area_ha?: number;
}) {
  const res = await fetch(`${API_URL}/api/farms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("No se pudo crear la finca");
  return res.json() as Promise<Farm>;
}

export async function getCrops(farmId?: string) {
  const q = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
  const res = await fetch(`${API_URL}/api/crops${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron cargar los cultivos");
  return res.json() as Promise<Crop[]>;
}

export async function createCrop(payload: {
  farm_id: string;
  name: string;
  variety?: string;
  growth_stage?: string;
  hectares?: number;
}) {
  const res = await fetch(`${API_URL}/api/crops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "No se pudo crear el cultivo");
  }
  return res.json() as Promise<Crop>;
}

export async function chatAssistant(message: string, history: { role: string; content: string }[] = []) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, province: "Manabí" }),
  });
  if (!res.ok) throw new Error("Error en el asistente");
  return res.json() as Promise<{ reply: string; sources: string[]; demo: boolean }>;
}

export function pdfUrl(caseId: string) {
  return `${API_URL}/api/diagnose/${caseId}/pdf`;
}
