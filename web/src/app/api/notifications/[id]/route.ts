import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getAdminClient, markNotificationRead } from "@/lib/server/supabase-admin";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await ctx.params;
  if (id.startsWith("followup-")) {
    return NextResponse.json({ ok: true, synthetic: true });
  }

  const client = getAdminClient(getConfig());
  if (!client) return NextResponse.json({ ok: true, mode: "demo" });

  try {
    await markNotificationRead(client, userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
