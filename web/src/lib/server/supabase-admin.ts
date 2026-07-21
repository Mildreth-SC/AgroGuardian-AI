import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppConfig, hasSupabase } from "./config";
import type { DiagnosisResult, OnboardingPayload } from "@/types/api";

export function getAdminClient(cfg: AppConfig): SupabaseClient | null {
  if (!hasSupabase(cfg)) return null;
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceKey);
}

export async function upsertProfile(
  client: SupabaseClient,
  userId: string,
  fullName?: string
) {
  const payload: Record<string, string> = { id: userId };
  if (fullName) payload.full_name = fullName;
  await client.from("profiles").upsert(payload);
}

const CROP_TEMPLATES: Record<
  string,
  { variety: string; stage: string; health: number; status: "sano" | "riesgo" | "infectado" }
> = {
  Plátano: { variety: "Barraganete", stage: "Floración", health: 72, status: "riesgo" },
  Cacao: { variety: "Nacional", stage: "Producción", health: 91, status: "sano" },
  Maíz: { variety: "INIAP", stage: "Vegetativo", health: 88, status: "sano" },
  Café: { variety: "Arábiga", stage: "Crecimiento", health: 64, status: "infectado" },
  Arroz: { variety: "INIAP", stage: "Macollamiento", health: 85, status: "sano" },
};

export async function createFarmFromOnboarding(
  client: SupabaseClient,
  userId: string,
  data: OnboardingPayload
) {
  await upsertProfile(client, userId, data.fullName);

  const { data: farm, error: farmErr } = await client
    .from("farms")
    .insert({
      owner_id: userId,
      name: data.farmName,
      lat: -1.0547,
      lng: -80.4545,
      area_ha: data.hectares,
      health_status: "riesgo",
    })
    .select("id")
    .single();

  if (farmErr || !farm) throw farmErr ?? new Error("No se pudo crear la finca");

  const crops = data.crops.map((name) => {
    const t = CROP_TEMPLATES[name] ?? {
      variety: "Local",
      stage: "Desarrollo",
      health: 80,
      status: "sano" as const,
    };
    return {
      farm_id: farm.id,
      name: name === "Plátano" ? "Plátano Barraganete" : `${name} ${t.variety}`.trim(),
      variety: t.variety,
      growth_stage: t.stage,
      health_pct: t.health,
      status: t.status,
    };
  });

  if (crops.length) {
    await client.from("crops").insert(crops);
  }

  await client.from("notifications").insert({
    owner_id: userId,
    title: "¡Bienvenido a AgroGuardian!",
    body: `Tu finca «${data.farmName}» está lista para monitorear.`,
    severity: "info",
  });

  return farm.id as string;
}

export async function userHasFarm(client: SupabaseClient, userId: string) {
  const { data } = await client
    .from("farms")
    .select("id")
    .eq("owner_id", userId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function listFarms(client: SupabaseClient, userId: string) {
  const { data } = await client
    .from("farms")
    .select("id,name,lat,lng,health_status")
    .eq("owner_id", userId);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    status: (row.health_status as string) ?? "sano",
  }));
}

export async function listCrops(client: SupabaseClient, userId: string) {
  const farms = await listFarms(client, userId);
  const farmIds = farms.map((f) => f.id);
  if (!farmIds.length) return [];

  const { data } = await client
    .from("crops")
    .select("id,name,variety,growth_stage,health_pct,status")
    .in("farm_id", farmIds);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    variety: row.variety as string | undefined,
    stage: (row.growth_stage as string) ?? "—",
    health: (row.health_pct as number) ?? 80,
    status: (row.status as "sano" | "riesgo" | "infectado") ?? "sano",
    hectares: 1.0,
  }));
}

export async function dashboardStats(client: SupabaseClient, userId: string) {
  const crops = await listCrops(client, userId);
  const { data: detections } = await client
    .from("detections")
    .select("id")
    .eq("owner_id", userId);

  const infected = crops.filter((c) => c.status !== "sano").length;
  const avg = crops.length
    ? Math.round(crops.reduce((a, c) => a + c.health, 0) / crops.length)
    : 0;
  const sano = crops.filter((c) => c.status === "sano").length;
  const riesgo = crops.filter((c) => c.status === "riesgo").length;
  const infect = crops.filter((c) => c.status === "infectado").length;
  const total = crops.length || 1;

  return {
    active_crops: crops.length,
    detected_cases: Math.max(infected, detections?.length ?? 0),
    climate_risk: "alto",
    avg_health: avg,
    crop_status: {
      healthy: Math.round((sano / total) * 100),
      risk: Math.round((riesgo / total) * 100),
      infected: Math.round((infect / total) * 100),
    },
  };
}

export async function saveDetection(
  client: SupabaseClient,
  userId: string,
  result: DiagnosisResult
) {
  const det = result.detection;
  const payloadTrace = {
    agent: "Payload",
    status: "stored",
    summary: "Diagnóstico completo",
    duration_ms: 0,
    data: {
      payload: {
        weather: result.weather,
        diagnosis: result.diagnosis,
        recommendations: result.recommendations,
        follow_up: result.follow_up,
        demo: result.demo,
        alternatives: det.alternatives,
      },
    },
  };

  const { data: ins, error } = await client
    .from("detections")
    .insert({
      id: result.id,
      owner_id: userId,
      disease: det.disease,
      confidence: det.confidence,
      risk_level: det.risk_level,
      affected_part: det.affected_part,
      rationale: det.rationale,
      agent_trace: [...result.agent_trace, payloadTrace],
    })
    .select("id")
    .single();

  if (error) throw error;

  if (ins?.id && result.recommendations.length) {
    await client.from("recommendations").insert(
      result.recommendations.map((r) => ({
        detection_id: ins.id,
        title: r.title,
        detail: r.detail,
        priority: r.priority,
        timeframe: r.timeframe,
      }))
    );
  }
}

function extractPayload(trace: unknown): Record<string, unknown> | null {
  if (!Array.isArray(trace)) return null;
  for (const item of trace) {
    const row = item as { agent?: string; data?: { payload?: Record<string, unknown> } };
    if (row.agent === "Payload" && row.data?.payload) return row.data.payload;
  }
  return null;
}

export async function listDetections(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("detections")
    .select("id,disease,confidence,risk_level,affected_part,rationale,agent_trace,created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const payload = extractPayload(row.agent_trace);
    const recs = (payload?.recommendations as DiagnosisResult["recommendations"]) ?? [];
    const weather = (payload?.weather as DiagnosisResult["weather"]) ?? {
      temperature_c: 28,
      humidity_pct: 75,
      rain_mm: 0,
      wind_kmh: 10,
      condition: "—",
      climate_risk: "medio" as const,
      source: "stored",
      location: "Manabí",
    };
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      detection: {
        disease: row.disease as string,
        crop: "Cultivo",
        confidence: Number(row.confidence),
        affected_part: (row.affected_part as string) ?? "hoja",
        risk_level: row.risk_level as DiagnosisResult["detection"]["risk_level"],
        rationale: (row.rationale as string) ?? "",
        alternatives: payload?.alternatives as DiagnosisResult["detection"]["alternatives"],
      },
      weather,
      diagnosis: (payload?.diagnosis as string) ?? "",
      recommendations: recs,
      follow_up: (payload?.follow_up as DiagnosisResult["follow_up"]) ?? {
        check_in_hours: 72,
        steps: [],
      },
      agent_trace: (row.agent_trace as DiagnosisResult["agent_trace"]) ?? [],
      demo: Boolean(payload?.demo),
    } satisfies DiagnosisResult;
  });
}
