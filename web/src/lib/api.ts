const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

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
  agent_trace: {
    agent: string;
    status: string;
    summary: string;
    duration_ms: number;
  }[];
  demo: boolean;
};

export type WeatherSnapshot = DiagnosisResult["weather"];

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

export async function diagnoseImage(file: Blob, meta?: { crop?: string; lat?: number; lon?: number }) {
  const form = new FormData();
  const name = file instanceof File ? file.name : "capture.jpg";
  form.append("file", file, name);
  if (meta?.crop) form.append("crop", meta.crop);
  if (meta?.lat != null) form.append("lat", String(meta.lat));
  if (meta?.lon != null) form.append("lon", String(meta.lon));

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

export async function getCases() {
  const res = await fetch(`${API_URL}/api/cases`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el historial");
  return res.json() as Promise<DiagnosisResult[]>;
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
