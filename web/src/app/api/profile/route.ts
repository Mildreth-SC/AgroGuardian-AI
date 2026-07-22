import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { isDbMissingError } from "@/lib/server/demo-data";
import { getAdminClient, getProfile, listFarms, updateProfile } from "@/lib/server/supabase-admin";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (!client) {
    return NextResponse.json({
      id: userId,
      full_name: null,
      phone: null,
      province: "Manabí",
      default_crop: null,
      farms: [],
      mode: "demo",
    });
  }

  try {
    const [profile, farms] = await Promise.all([
      getProfile(client, userId),
      listFarms(client, userId),
    ]);
    return NextResponse.json({ ...profile, farms, mode: "supabase" });
  } catch (e) {
    if (isDbMissingError(e)) {
      return NextResponse.json({
        id: userId,
        full_name: null,
        phone: null,
        province: "Manabí",
        default_crop: null,
        farms: [],
        mode: "demo-fallback",
      });
    }
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const body = (await req.json()) as {
    full_name?: string;
    phone?: string;
    province?: string;
    default_crop?: string | null;
  };

  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (!client) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      message: "Perfil guardado localmente no disponible sin Supabase.",
    });
  }

  try {
    const profile = await updateProfile(client, userId, body);
    return NextResponse.json({ ok: true, profile });
  } catch (e) {
    if (isDbMissingError(e)) {
      return NextResponse.json({ ok: true, mode: "demo-fallback" });
    }
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
