import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppConfig } from "./config";
import { getAdminClient } from "./supabase-admin";
import { getCaseStore } from "./demo-data";
import { buildDiagnosisPdf } from "./pdf";
import {
  getDetectionById,
  saveDetection,
  saveReportRecord,
  updateCropHealthFromDiagnosis,
  uploadReportPdf,
  uploadScanImage,
} from "./supabase-admin";
import type { DiagnosisResult } from "@/types/api";

export type PersistMeta = {
  farm_id?: string | null;
  crop_id?: string | null;
  mime?: string;
};

export async function getCaseById(
  cfg: AppConfig,
  userId: string,
  caseId: string
): Promise<DiagnosisResult | null> {
  const cached = getCaseStore().get(caseId);
  if (cached) return cached;

  const client = getAdminClient(cfg);
  if (!client) return null;
  return getDetectionById(client, userId, caseId);
}

export async function persistDiagnosisArtifacts(
  cfg: AppConfig,
  userId: string,
  result: DiagnosisResult,
  imageBytes: Buffer,
  meta: PersistMeta = {}
): Promise<DiagnosisResult> {
  let enriched: DiagnosisResult = {
    ...result,
    farm_id: meta.farm_id ?? result.farm_id ?? null,
    crop_id: meta.crop_id ?? result.crop_id ?? null,
    image_path: result.image_path ?? null,
    report_url: result.report_url ?? null,
  };

  getCaseStore().set(enriched.id, enriched);

  const client = getAdminClient(cfg);
  if (!client) {
    try {
      const pdfBytes = await buildDiagnosisPdf(enriched, imageBytes);
      enriched.report_url = `/api/diagnose/${enriched.id}/pdf`;
      getCaseStore().set(enriched.id, enriched);
      void pdfBytes;
    } catch {
      /* demo without storage */
    }
    return enriched;
  }

  let imageId: string | null = null;
  try {
    const uploaded = await uploadScanImage(
      client,
      userId,
      enriched.id,
      imageBytes,
      meta.mime ?? "image/jpeg"
    );
    enriched = { ...enriched, image_path: uploaded.path };
    imageId = uploaded.imageId;
  } catch {
    /* storage optional */
  }

  try {
    await saveDetection(client, userId, enriched, {
      image_id: imageId,
      crop_id: enriched.crop_id ?? null,
      farm_id: enriched.farm_id ?? null,
    });
    const withRecs = await getDetectionById(client, userId, enriched.id);
    if (withRecs) enriched = withRecs;
  } catch {
    /* DB optional */
  }

  if (enriched.crop_id) {
    try {
      await updateCropHealthFromDiagnosis(client, userId, enriched.crop_id, enriched);
    } catch {
      /* optional */
    }
  }

  try {
    const pdfBytes = await buildDiagnosisPdf(enriched, imageBytes);
    const report = await uploadReportPdf(client, userId, enriched, pdfBytes);
    enriched = {
      ...enriched,
      report_id: report.id,
      report_url: `/api/diagnose/${enriched.id}/pdf`,
    };

    await saveReportRecord(client, userId, enriched.id, report.path, buildSummary(enriched));

    await client.from("notifications").insert({
      owner_id: userId,
      title: "Reporte listo",
      body: `${enriched.detection.disease} en ${enriched.detection.crop} — PDF generado.`,
      severity:
        enriched.detection.risk_level === "alto" || enriched.detection.risk_level === "critico"
          ? "alto"
          : "info",
    });
  } catch {
    enriched.report_url = `/api/diagnose/${enriched.id}/pdf`;
  }

  getCaseStore().set(enriched.id, enriched);
  return enriched;
}

function buildSummary(result: DiagnosisResult) {
  return `${result.detection.disease} · ${result.detection.crop} · ${Math.round(result.detection.confidence * 100)}% · riesgo ${result.detection.risk_level}`;
}

export async function loadReportPdfBytes(
  client: SupabaseClient,
  storagePath: string
): Promise<Buffer | null> {
  const { data, error } = await client.storage.from("reports").download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function findReportPath(
  client: SupabaseClient,
  userId: string,
  detectionId: string
): Promise<string | null> {
  const { data } = await client
    .from("reports")
    .select("storage_path")
    .eq("owner_id", userId)
    .eq("detection_id", detectionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.storage_path as string) ?? null;
}
