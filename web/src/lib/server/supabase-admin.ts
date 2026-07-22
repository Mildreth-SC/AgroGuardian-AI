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
    .select("id,name,lat,lng,area_ha,health_status,owner_id,created_at")
    .eq("owner_id", userId);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    lat: row.lat as number | undefined,
    lng: row.lng as number | undefined,
    area_ha: Number(row.area_ha ?? 1),
    health_status: (row.health_status as string) ?? "sano",
    status: (row.health_status as string) ?? "sano",
    owner_id: row.owner_id as string,
    created_at: row.created_at as string | undefined,
  }));
}

export async function userOwnsFarm(client: SupabaseClient, userId: string, farmId: string) {
  const { data } = await client
    .from("farms")
    .select("id")
    .eq("owner_id", userId)
    .eq("id", farmId)
    .maybeSingle();
  return Boolean(data?.id);
}

export async function insertFarm(
  client: SupabaseClient,
  userId: string,
  payload: { name: string; lat?: number; lng?: number; area_ha?: number }
) {
  await upsertProfile(client, userId);
  const { data, error } = await client
    .from("farms")
    .insert({
      owner_id: userId,
      name: payload.name,
      lat: payload.lat ?? -1.0547,
      lng: payload.lng ?? -80.4545,
      area_ha: payload.area_ha ?? 1,
      health_status: "sano",
    })
    .select("id,name,lat,lng,area_ha,health_status,owner_id,created_at")
    .single();
  if (error || !data) throw error ?? new Error("No se pudo crear la finca");
  return {
    id: data.id as string,
    name: data.name as string,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    area_ha: Number(data.area_ha ?? 1),
    health_status: (data.health_status as string) ?? "sano",
    status: (data.health_status as string) ?? "sano",
    owner_id: data.owner_id as string,
    created_at: data.created_at as string | undefined,
  };
}

export async function updateFarm(
  client: SupabaseClient,
  userId: string,
  farmId: string,
  payload: { name?: string; lat?: number; lng?: number; area_ha?: number; health_status?: string }
) {
  const patch: Record<string, unknown> = {};
  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.lat !== undefined) patch.lat = payload.lat;
  if (payload.lng !== undefined) patch.lng = payload.lng;
  if (payload.area_ha !== undefined) patch.area_ha = payload.area_ha;
  if (payload.health_status !== undefined) patch.health_status = payload.health_status;

  const { data, error } = await client
    .from("farms")
    .update(patch)
    .eq("owner_id", userId)
    .eq("id", farmId)
    .select("id,name,lat,lng,area_ha,health_status,owner_id,created_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Finca no encontrada");
  return {
    id: data.id as string,
    name: data.name as string,
    lat: data.lat as number | undefined,
    lng: data.lng as number | undefined,
    area_ha: Number(data.area_ha ?? 1),
    health_status: (data.health_status as string) ?? "sano",
    status: (data.health_status as string) ?? "sano",
    owner_id: data.owner_id as string,
    created_at: data.created_at as string | undefined,
  };
}

export async function deleteFarm(client: SupabaseClient, userId: string, farmId: string) {
  const { data, error } = await client
    .from("farms")
    .delete()
    .eq("owner_id", userId)
    .eq("id", farmId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Finca no encontrada");
}

export async function listCrops(client: SupabaseClient, userId: string) {
  const farms = await listFarms(client, userId);
  const farmIds = farms.map((f) => f.id);
  if (!farmIds.length) return [];

  const { data } = await client
    .from("crops")
    .select("id,farm_id,name,variety,growth_stage,health_pct,status")
    .in("farm_id", farmIds);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    farm_id: row.farm_id as string,
    name: row.name as string,
    variety: row.variety as string | undefined,
    growth_stage: (row.growth_stage as string) ?? "Desarrollo",
    stage: (row.growth_stage as string) ?? "Desarrollo",
    health_pct: (row.health_pct as number) ?? 80,
    health: (row.health_pct as number) ?? 80,
    status: (row.status as "sano" | "riesgo" | "infectado") ?? "sano",
    hectares: 1.0,
  }));
}

export async function insertCrop(
  client: SupabaseClient,
  userId: string,
  payload: {
    farm_id: string;
    name: string;
    variety?: string;
    growth_stage?: string;
    hectares?: number;
  }
) {
  const owns = await userOwnsFarm(client, userId, payload.farm_id);
  if (!owns) throw new Error("farm_id no existe");

  const { data, error } = await client
    .from("crops")
    .insert({
      farm_id: payload.farm_id,
      name: payload.name,
      variety: payload.variety ?? "",
      growth_stage: payload.growth_stage ?? "Desarrollo",
      health_pct: 90,
      status: "sano",
    })
    .select("id,farm_id,name,variety,growth_stage,health_pct,status")
    .single();
  if (error || !data) throw error ?? new Error("No se pudo crear el cultivo");

  return {
    id: data.id as string,
    farm_id: data.farm_id as string,
    name: data.name as string,
    variety: (data.variety as string) ?? "",
    growth_stage: (data.growth_stage as string) ?? "Desarrollo",
    stage: (data.growth_stage as string) ?? "Desarrollo",
    health_pct: (data.health_pct as number) ?? 90,
    health: (data.health_pct as number) ?? 90,
    status: (data.status as "sano" | "riesgo" | "infectado") ?? "sano",
    hectares: payload.hectares ?? 1,
  };
}

export async function updateCrop(
  client: SupabaseClient,
  userId: string,
  cropId: string,
  payload: {
    name?: string;
    variety?: string;
    growth_stage?: string;
    health_pct?: number;
    status?: "sano" | "riesgo" | "infectado";
    hectares?: number;
  }
) {
  const farms = await listFarms(client, userId);
  const farmIds = farms.map((f) => f.id);
  if (!farmIds.length) throw new Error("Cultivo no encontrado");

  const patch: Record<string, unknown> = {};
  if (payload.name !== undefined) patch.name = payload.name;
  if (payload.variety !== undefined) patch.variety = payload.variety;
  if (payload.growth_stage !== undefined) patch.growth_stage = payload.growth_stage;
  if (payload.health_pct !== undefined) patch.health_pct = payload.health_pct;
  if (payload.status !== undefined) patch.status = payload.status;

  const { data, error } = await client
    .from("crops")
    .update(patch)
    .eq("id", cropId)
    .in("farm_id", farmIds)
    .select("id,farm_id,name,variety,growth_stage,health_pct,status")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cultivo no encontrado");

  return {
    id: data.id as string,
    farm_id: data.farm_id as string,
    name: data.name as string,
    variety: (data.variety as string) ?? "",
    growth_stage: (data.growth_stage as string) ?? "Desarrollo",
    stage: (data.growth_stage as string) ?? "Desarrollo",
    health_pct: (data.health_pct as number) ?? 80,
    health: (data.health_pct as number) ?? 80,
    status: (data.status as "sano" | "riesgo" | "infectado") ?? "sano",
    hectares: payload.hectares ?? 1,
  };
}

export async function deleteCrop(client: SupabaseClient, userId: string, cropId: string) {
  const farms = await listFarms(client, userId);
  const farmIds = farms.map((f) => f.id);
  if (!farmIds.length) throw new Error("Cultivo no encontrado");

  const { data, error } = await client
    .from("crops")
    .delete()
    .eq("id", cropId)
    .in("farm_id", farmIds)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cultivo no encontrado");
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
  result: DiagnosisResult,
  links?: { image_id?: string | null; crop_id?: string | null; farm_id?: string | null }
) {
  const det = result.detection;
  const payloadTrace = {
    agent: "Payload",
    status: "stored",
    summary: "Diagnóstico completo",
    duration_ms: 0,
    data: {
      payload: {
        crop: det.crop,
        weather: result.weather,
        diagnosis: result.diagnosis,
        recommendations: result.recommendations,
        follow_up: result.follow_up,
        demo: result.demo,
        alternatives: det.alternatives,
        farm_id: links?.farm_id ?? result.farm_id ?? null,
        crop_id: links?.crop_id ?? result.crop_id ?? null,
        image_path: result.image_path ?? null,
        report_url: result.report_url ?? null,
      },
    },
  };

  const { data: ins, error } = await client
    .from("detections")
    .insert({
      id: result.id,
      owner_id: userId,
      image_id: links?.image_id ?? null,
      crop_id: links?.crop_id ?? result.crop_id ?? null,
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

export async function uploadScanImage(
  client: SupabaseClient,
  userId: string,
  caseId: string,
  imageBytes: Buffer,
  mime: string
) {
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/${caseId}.${ext}`;

  const { error: upErr } = await client.storage.from("plant-scans").upload(path, imageBytes, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) throw upErr;

  const { data: img, error: imgErr } = await client
    .from("images")
    .insert({
      owner_id: userId,
      storage_path: path,
      mime,
    })
    .select("id")
    .single();
  if (imgErr) throw imgErr;

  return { path, imageId: img.id as string };
}

export async function uploadReportPdf(
  client: SupabaseClient,
  userId: string,
  result: DiagnosisResult,
  pdfBytes: Uint8Array
) {
  const path = `${userId}/${result.id}.pdf`;
  const { error } = await client.storage.from("reports").upload(path, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
  return { id: result.id, path };
}

export async function saveReportRecord(
  client: SupabaseClient,
  userId: string,
  detectionId: string,
  storagePath: string,
  summary: string
) {
  await client.from("reports").delete().eq("owner_id", userId).eq("detection_id", detectionId);
  const { error } = await client.from("reports").insert({
    detection_id: detectionId,
    owner_id: userId,
    storage_path: storagePath,
    summary,
  });
  if (error) throw error;
}

export async function loadScanImageBytes(
  client: SupabaseClient,
  storagePath: string
): Promise<Buffer | null> {
  const { data, error } = await client.storage.from("plant-scans").download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function updateCropHealthFromDiagnosis(
  client: SupabaseClient,
  userId: string,
  cropId: string,
  result: DiagnosisResult
) {
  const farms = await listFarms(client, userId);
  const farmIds = farms.map((f) => f.id);
  if (!farmIds.length) return;

  const risk = result.detection.risk_level;
  let status: "sano" | "riesgo" | "infectado" = "sano";
  if (risk === "alto" || risk === "critico") status = "infectado";
  else if (risk === "medio") status = "riesgo";

  const health_pct = Math.max(40, Math.round(100 - result.detection.confidence * 45));

  await client
    .from("crops")
    .update({ status, health_pct })
    .eq("id", cropId)
    .in("farm_id", farmIds);
}

function extractPayload(trace: unknown): Record<string, unknown> | null {
  if (!Array.isArray(trace)) return null;
  for (const item of trace) {
    const row = item as { agent?: string; data?: { payload?: Record<string, unknown> } };
    if (row.agent === "Payload" && row.data?.payload) return row.data.payload;
  }
  return null;
}

function rowToDiagnosis(row: Record<string, unknown>): DiagnosisResult {
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
      crop: (payload?.crop as string) ?? "Cultivo",
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
    image_path: (payload?.image_path as string) ?? null,
    report_url: (payload?.report_url as string) ?? `/api/diagnose/${row.id}/pdf`,
    farm_id: (payload?.farm_id as string) ?? null,
    crop_id: (row.crop_id as string) ?? (payload?.crop_id as string) ?? null,
  };
}

export async function getDetectionById(
  client: SupabaseClient,
  userId: string,
  detectionId: string
) {
  const { data, error } = await client
    .from("detections")
    .select("id,disease,confidence,risk_level,affected_part,rationale,agent_trace,created_at,crop_id")
    .eq("owner_id", userId)
    .eq("id", detectionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToDiagnosis(data as Record<string, unknown>);
}

export async function listDetections(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("detections")
    .select("id,disease,confidence,risk_level,affected_part,rationale,agent_trace,created_at,crop_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row) => rowToDiagnosis(row as Record<string, unknown>));
}

export async function listReports(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("reports")
    .select("id,detection_id,storage_path,summary,created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const detectionIds = (data ?? []).map((r) => r.detection_id).filter(Boolean) as string[];
  let detections: Record<string, DiagnosisResult> = {};
  if (detectionIds.length) {
    const { data: dets } = await client
      .from("detections")
      .select("id,disease,confidence,risk_level,affected_part,rationale,agent_trace,created_at,crop_id")
      .in("id", detectionIds);
    for (const row of dets ?? []) {
      const d = rowToDiagnosis(row as Record<string, unknown>);
      detections[d.id] = d;
    }
  }

  return (data ?? []).map((row) => {
    const det = row.detection_id ? detections[row.detection_id as string] : null;
    return {
      id: row.id as string,
      detection_id: (row.detection_id as string) ?? "",
      created_at: row.created_at as string,
      summary: (row.summary as string) ?? "",
      storage_path: (row.storage_path as string) ?? null,
      disease: det?.detection.disease ?? "Diagnóstico",
      crop: det?.detection.crop ?? "Cultivo",
      confidence: det?.detection.confidence ?? 0,
      risk_level: det?.detection.risk_level ?? ("medio" as const),
      pdf_url: `/api/diagnose/${row.detection_id}/pdf`,
    };
  });
}

export async function getProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id,full_name,phone,province,default_crop,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      id: userId,
      full_name: null,
      phone: null,
      province: "Manabí",
      default_crop: null,
    };
  }
  return {
    id: data.id as string,
    full_name: (data.full_name as string) ?? null,
    phone: (data.phone as string) ?? null,
    province: (data.province as string) ?? "Manabí",
    default_crop: (data.default_crop as string) ?? null,
    created_at: data.created_at as string | undefined,
  };
}

export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  payload: {
    full_name?: string;
    phone?: string;
    province?: string;
    default_crop?: string | null;
  }
) {
  await upsertProfile(client, userId, payload.full_name);
  const patch: Record<string, unknown> = { id: userId };
  if (payload.full_name !== undefined) patch.full_name = payload.full_name;
  if (payload.phone !== undefined) patch.phone = payload.phone;
  if (payload.province !== undefined) patch.province = payload.province;
  if (payload.default_crop !== undefined) patch.default_crop = payload.default_crop;

  const { data, error } = await client.from("profiles").upsert(patch).select().single();
  if (error) throw error;
  return {
    id: data.id as string,
    full_name: (data.full_name as string) ?? null,
    phone: (data.phone as string) ?? null,
    province: (data.province as string) ?? "Manabí",
    default_crop: (data.default_crop as string) ?? null,
    created_at: data.created_at as string | undefined,
  };
}
