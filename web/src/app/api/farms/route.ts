import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getFarmStore, isDbMissingError } from "@/lib/server/demo-data";
import { getAdminClient, insertFarm, listFarms } from "@/lib/server/supabase-admin";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (!client) return NextResponse.json(getFarmStore());

  try {
    const farms = await listFarms(client, userId);
    if (!farms.length) return NextResponse.json(getFarmStore());
    return NextResponse.json(farms);
  } catch (e) {
    if (isDbMissingError(e)) return NextResponse.json(getFarmStore());
    return NextResponse.json(getFarmStore());
  }
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ detail: "Nombre requerido" }, { status: 400 });
  }

  const payload = {
    name,
    lat: Number(body.lat ?? -1.0547),
    lng: Number(body.lng ?? -80.4545),
    area_ha: Number(body.area_ha ?? 1),
  };

  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (client) {
    try {
      const farm = await insertFarm(client, userId, payload);
      return NextResponse.json(farm, { status: 201 });
    } catch (e) {
      if (!isDbMissingError(e)) {
        const msg = e instanceof Error ? e.message : "Error al crear finca";
        return NextResponse.json({ detail: msg }, { status: 400 });
      }
    }
  }

  const farm = {
    id: randomUUID(),
    ...payload,
    health_status: "sano" as const,
    status: "sano" as const,
    owner_id: userId,
    created_at: new Date().toISOString(),
  };

  getFarmStore().push(farm);
  return NextResponse.json(farm, { status: 201 });
}
