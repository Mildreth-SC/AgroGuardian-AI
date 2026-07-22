import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseStore, isDbMissingError } from "@/lib/server/demo-data";
import { getAdminClient, listReports } from "@/lib/server/supabase-admin";
import type { ReportItem } from "@/types/api";

function memoryReports(): ReportItem[] {
  return [...getCaseStore().values()].map((c) => ({
    id: c.report_id ?? c.id,
    detection_id: c.id,
    created_at: c.created_at,
    summary: `${c.detection.disease} · ${c.detection.crop}`,
    storage_path: null,
    disease: c.detection.disease,
    crop: c.detection.crop,
    confidence: c.detection.confidence,
    risk_level: c.detection.risk_level,
    pdf_url: c.report_url ?? `/api/diagnose/${c.id}/pdf`,
  }));
}

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const memory = memoryReports();
  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (!client) return NextResponse.json(memory);

  try {
    const dbReports = await listReports(client, userId);
    const map = new Map<string, ReportItem>();
    for (const r of dbReports) map.set(r.detection_id, r);
    for (const r of memory) map.set(r.detection_id, r);
    return NextResponse.json(
      [...map.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
  } catch (e) {
    if (isDbMissingError(e)) return NextResponse.json(memory);
    return NextResponse.json(memory);
  }
}
