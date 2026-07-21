import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCropStore, isDbMissingError } from "@/lib/server/demo-data";
import { deleteCrop, getAdminClient, updateCrop } from "@/lib/server/supabase-admin";

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
      const crop = await updateCrop(client, userId, id, {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        variety: body.variety !== undefined ? String(body.variety) : undefined,
        growth_stage: body.growth_stage !== undefined ? String(body.growth_stage) : undefined,
        health_pct: body.health_pct !== undefined ? Number(body.health_pct) : undefined,
        status: body.status,
        hectares: body.hectares !== undefined ? Number(body.hectares) : undefined,
      });
      return NextResponse.json(crop);
    } catch (e) {
      if (!isDbMissingError(e)) {
        const msg = e instanceof Error ? e.message : "Error al actualizar cultivo";
        return NextResponse.json({ detail: msg }, { status: 400 });
      }
    }
  }

  const crops = getCropStore();
  const idx = crops.findIndex((c) => c.id === id);
  if (idx < 0) return NextResponse.json({ detail: "Cultivo no encontrado" }, { status: 404 });

  const current = crops[idx];
  const updated = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    variety: body.variety !== undefined ? String(body.variety) : current.variety,
    growth_stage: body.growth_stage !== undefined ? String(body.growth_stage) : current.growth_stage,
    stage: body.growth_stage !== undefined ? String(body.growth_stage) : current.stage,
    health_pct: body.health_pct !== undefined ? Number(body.health_pct) : current.health_pct,
    health: body.health_pct !== undefined ? Number(body.health_pct) : current.health,
    status: body.status ?? current.status,
    hectares: body.hectares !== undefined ? Number(body.hectares) : current.hectares,
  };
  crops[idx] = updated;
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
      await deleteCrop(client, userId, id);
      return NextResponse.json({ ok: true });
    } catch (e) {
      if (!isDbMissingError(e)) {
        const msg = e instanceof Error ? e.message : "Error al eliminar cultivo";
        return NextResponse.json({ detail: msg }, { status: 400 });
      }
    }
  }

  const crops = getCropStore();
  const idx = crops.findIndex((c) => c.id === id);
  if (idx < 0) return NextResponse.json({ detail: "Cultivo no encontrado" }, { status: 404 });
  crops.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
