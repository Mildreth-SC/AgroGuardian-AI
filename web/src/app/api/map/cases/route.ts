import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseStore, isDbMissingError } from "@/lib/server/demo-data";
import { getAdminClient, listMapCasePins } from "@/lib/server/supabase-admin";
import type { MapCasePin } from "@/types/api";

function memoryPins(): MapCasePin[] {
  return [...getCaseStore().values()]
    .filter((c) => c.lat != null && c.lon != null)
    .map((c) => ({
      id: c.id,
      lat: c.lat!,
      lng: c.lon!,
      disease: c.detection.disease,
      crop: c.detection.crop,
      risk_level: c.detection.risk_level,
      created_at: c.created_at,
    }));
}

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const memory = memoryPins();
  const client = getAdminClient(getConfig());
  if (!client) return NextResponse.json(memory);

  try {
    const dbPins = await listMapCasePins(client, userId);
    const map = new Map<string, MapCasePin>();
    for (const p of dbPins) map.set(p.id, p);
    for (const p of memory) map.set(p.id, p);
    return NextResponse.json([...map.values()]);
  } catch (e) {
    if (isDbMissingError(e)) return NextResponse.json(memory);
    return NextResponse.json(memory);
  }
}
