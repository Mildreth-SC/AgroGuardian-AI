import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getFarmStore, isDbMissingError } from "@/lib/server/demo-data";
import { deleteFarm, getAdminClient, updateFarm } from "@/lib/server/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await params;
  const body = await req.json();
  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (client) {
    try {
      const farm = await updateFarm(client, userId, id, {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        lat: body.lat !== undefined ? Number(body.lat) : undefined,
        lng: body.lng !== undefined ? Number(body.lng) : undefined,
        area_ha: body.area_ha !== undefined ? Number(body.area_ha) : undefined,
        health_status: body.health_status ? String(body.health_status) : undefined,
      });
      return NextResponse.json(farm);
    } catch (e) {
      if (!isDbMissingError(e)) {
        const msg = e instanceof Error ? e.message : "Error al actualizar finca";
        return NextResponse.json({ detail: msg }, { status: 400 });
      }
    }
  }

  const farms = getFarmStore();
  const idx = farms.findIndex((f) => f.id === id);
  if (idx < 0) return NextResponse.json({ detail: "Finca no encontrada" }, { status: 404 });

  const current = farms[idx];
  const updated = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    lat: body.lat !== undefined ? Number(body.lat) : current.lat,
    lng: body.lng !== undefined ? Number(body.lng) : current.lng,
    area_ha: body.area_ha !== undefined ? Number(body.area_ha) : current.area_ha,
    health_status: body.health_status ?? current.health_status,
    status: body.health_status ?? current.status,
  };
  farms[idx] = updated;
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await params;
  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (client) {
    try {
      await deleteFarm(client, userId, id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      if (!isDbMissingError(e)) {
        const msg = e instanceof Error ? e.message : "Error al eliminar finca";
        return NextResponse.json({ detail: msg }, { status: 400 });
      }
    }
  }

  const farms = getFarmStore();
  const idx = farms.findIndex((f) => f.id === id);
  if (idx < 0) return NextResponse.json({ detail: "Finca no encontrada" }, { status: 404 });
  farms.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
