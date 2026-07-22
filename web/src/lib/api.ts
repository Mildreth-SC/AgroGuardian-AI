function apiBase() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

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
    alternatives?: { disease: string; confidence: number }[];
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
    id?: string;
    title: string;
    detail: string;
    priority: number;
    timeframe: string;
    completed?: boolean;
  }[];
  follow_up: {
    check_in_hours: number;
    steps: string[];
  };
  agent_trace: AgentTrace[];
  demo: boolean;
  image_path?: string | null;
  report_id?: string | null;
  report_url?: string | null;
  farm_id?: string | null;
  crop_id?: string | null;
  farm_name?: string | null;
  lat?: number | null;
  lon?: number | null;
  feedback?: {
    correct: boolean | null;
    comment?: string | null;
    at?: string | null;
  } | null;
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

export type DashboardStats = {
  active_crops: number;
  detected_cases: number;
  climate_risk: string;
  avg_health: number;
  crop_status: { healthy: number; risk: number; infected: number };
};

export type MarketPrice = {
  crop: string;
  price_usd: number;
  unit: string;
  trend: "up" | "down" | "stable";
  market: string;
  updated: string;
};

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${apiBase()}${path}`, { ...init, credentials: "same-origin" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res;
}

function normalizeFarm(row: Record<string, unknown>): Farm {
  return {
    id: String(row.id),
    name: String(row.name),
    lat: Number(row.lat ?? -1.0547),
    lng: Number(row.lng ?? -80.4545),
    area_ha: Number(row.area_ha ?? row.hectares ?? 1),
    health_status: (row.health_status ?? row.status ?? "sano") as Farm["health_status"],
    owner_id: row.owner_id ? String(row.owner_id) : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

function normalizeCrop(row: Record<string, unknown>): Crop {
  return {
    id: String(row.id),
    farm_id: String(row.farm_id ?? "f1"),
    name: String(row.name),
    variety: String(row.variety ?? ""),
    growth_stage: String(row.growth_stage ?? row.stage ?? "Desarrollo"),
    health_pct: Number(row.health_pct ?? row.health ?? 80),
    status: (row.status ?? "sano") as Crop["status"],
    hectares: Number(row.hectares ?? 1),
  };
}

export async function getHealth() {
  const res = await apiFetch("/api/health", { cache: "no-store" });
  return res.json() as Promise<{
    status: string;
    demo_mode: boolean;
    openai?: boolean;
    openrouter: boolean;
    ai_provider?: "openai" | "openrouter" | null;
    ai_live?: { ok: boolean; detail: string; provider: string | null };
    openweather: boolean;
    supabase: boolean;
    models: { text: string; vision: string };
  }>;
}

export async function getOnboardingStatus() {
  const res = await apiFetch("/api/onboarding", { cache: "no-store" });
  return res.json() as Promise<{ completed: boolean; mode?: string }>;
}

export async function submitOnboarding(data: {
  fullName: string;
  farmName: string;
  province: string;
  hectares: number;
  crops: string[];
}) {
  const res = await apiFetch("/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getFarms() {
  const res = await apiFetch("/api/farms", { cache: "no-store" });
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(normalizeFarm);
}

export async function createFarm(payload: {
  name: string;
  lat?: number;
  lng?: number;
  area_ha?: number;
}) {
  const res = await apiFetch("/api/farms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return normalizeFarm(await res.json());
}

export async function getCrops(farmId?: string) {
  const q = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
  const res = await apiFetch(`/api/farms/crops${q}`, { cache: "no-store" });
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map(normalizeCrop);
}

export async function createCrop(payload: {
  farm_id: string;
  name: string;
  variety?: string;
  growth_stage?: string;
  hectares?: number;
}) {
  const res = await apiFetch("/api/farms/crops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return normalizeCrop(await res.json());
}

export async function updateFarm(
  id: string,
  payload: { name?: string; lat?: number; lng?: number; area_ha?: number; health_status?: Farm["health_status"] }
) {
  const res = await apiFetch(`/api/farms/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return normalizeFarm(await res.json());
}

export async function deleteFarm(id: string) {
  await apiFetch(`/api/farms/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateCrop(
  id: string,
  payload: {
    name?: string;
    variety?: string;
    growth_stage?: string;
    health_pct?: number;
    status?: Crop["status"];
    hectares?: number;
  }
) {
  const res = await apiFetch(`/api/farms/crops/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return normalizeCrop(await res.json());
}

export async function deleteCrop(id: string) {
  await apiFetch(`/api/farms/crops/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getDashboardStats() {
  const res = await apiFetch("/api/dashboard/stats", { cache: "no-store" });
  return res.json() as Promise<DashboardStats>;
}

export async function getMarketPrices() {
  const res = await apiFetch("/api/markets/prices", { cache: "no-store" });
  return res.json() as Promise<MarketPrice[]>;
}

export async function getWeather(lat?: number, lon?: number) {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", String(lat));
  if (lon != null) params.set("lon", String(lon));
  const q = params.toString() ? `?${params}` : "";
  const res = await fetch(`${apiBase()}/api/weather${q}`, { cache: "no-store" });
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

  const res = await fetch(`${apiBase()}/api/diagnose`, {
    method: "POST",
    credentials: "same-origin",
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

  const res = await fetch(`${apiBase()}/api/diagnose/stream`, {
    method: "POST",
    credentials: "same-origin",
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
  const res = await apiFetch("/api/cases", { cache: "no-store" });
  return res.json() as Promise<DiagnosisResult[]>;
}

export async function getDiagnosisById(id: string) {
  const res = await apiFetch(`/api/diagnose/${encodeURIComponent(id)}`, { cache: "no-store" });
  return res.json() as Promise<DiagnosisResult>;
}

export async function getReports() {
  const res = await apiFetch("/api/reports", { cache: "no-store" });
  return res.json() as Promise<ReportItem[]>;
}

export async function getProfileSettings() {
  const res = await apiFetch("/api/profile", { cache: "no-store" });
  return res.json() as Promise<UserProfile>;
}

export async function updateProfileSettings(payload: {
  full_name?: string;
  phone?: string;
  province?: string;
  default_crop?: string | null;
}) {
  const res = await apiFetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export type ReportItem = {
  id: string;
  detection_id: string;
  created_at: string;
  summary: string;
  storage_path: string | null;
  disease: string;
  crop: string;
  confidence: number;
  risk_level: RiskLevel;
  pdf_url: string;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  province: string | null;
  default_crop: string | null;
  farms?: Farm[];
  mode?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  read: boolean;
  created_at: string;
  synthetic?: boolean;
  href?: string | null;
};

export type MapCasePin = {
  id: string;
  lat: number;
  lng: number;
  disease: string;
  crop: string;
  risk_level: RiskLevel;
  created_at: string;
};

export type OutbreakAlert = {
  id: string;
  disease: string;
  count: number;
  level: string;
  message: string;
  climate_factor: string;
};

export async function getOutbreakAlerts() {
  const res = await apiFetch("/api/outbreak-alerts", { cache: "no-store" });
  return res.json() as Promise<{ alerts: OutbreakAlert[]; climate_risk: string }>;
}

export async function getDiseaseCatalog() {
  const res = await fetch(`${apiBase()}/api/diseases`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  return res.json();
}

export async function chatAssistant(message: string, history: { role: string; content: string }[] = []) {
  const res = await apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, province: "Manabí" }),
  });
  return res.json() as Promise<{ reply: string; sources: string[]; demo: boolean }>;
}

export function pdfUrl(caseId: string) {
  return `${apiBase()}/api/diagnose/${caseId}/pdf`;
}

export async function getNotifications() {
  const res = await apiFetch("/api/notifications", { cache: "no-store" });
  return res.json() as Promise<{ items: AppNotification[]; unread: number }>;
}

export async function markNotificationRead(id: string) {
  const res = await apiFetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: "PATCH",
  });
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await apiFetch("/api/notifications", { method: "PATCH" });
  return res.json();
}

export async function updateRecommendation(id: string, completed: boolean) {
  const res = await apiFetch(`/api/recommendations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  return res.json();
}

export async function submitDiagnosisFeedback(
  detectionId: string,
  payload: { correct: boolean; comment?: string }
) {
  const res = await apiFetch(`/api/diagnose/${encodeURIComponent(detectionId)}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "No se pudo enviar feedback");
  }
  return res.json() as Promise<{ ok: boolean; feedback: DiagnosisResult["feedback"] }>;
}

export async function getMapCases() {
  const res = await apiFetch("/api/map/cases", { cache: "no-store" });
  return res.json() as Promise<MapCasePin[]>;
}
