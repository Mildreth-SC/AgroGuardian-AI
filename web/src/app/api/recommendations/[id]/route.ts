import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getAdminClient, updateRecommendationCompleted } from "@/lib/server/supabase-admin";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await ctx.params;
  const body = (await req.json()) as { completed?: boolean };
  const completed = body.completed ?? true;

  const client = getAdminClient(getConfig());
  if (!client) {
    return NextResponse.json({ ok: true, mode: "demo", completed });
  }

  try {
    const rec = await updateRecommendationCompleted(client, userId, id, completed);
    return NextResponse.json({ ok: true, recommendation: rec });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 400 });
  }
}
