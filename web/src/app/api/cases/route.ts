import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseStore, isDbMissingError } from "@/lib/server/demo-data";
import { getAdminClient, listDetections } from "@/lib/server/supabase-admin";
import type { DiagnosisResult } from "@/types/api";

function mergeCases(memory: DiagnosisResult[], db: DiagnosisResult[]) {
  const map = new Map<string, DiagnosisResult>();
  for (const c of db) map.set(c.id, c);
  for (const c of memory) map.set(c.id, c);
  return [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const memory = [...getCaseStore().values()];
  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (!client) return NextResponse.json(memory);

  try {
    const dbCases = await listDetections(client, userId);
    return NextResponse.json(mergeCases(memory, dbCases));
  } catch (e) {
    if (isDbMissingError(e)) return NextResponse.json(memory);
    return NextResponse.json(mergeCases(memory, []));
  }
}
