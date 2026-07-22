import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseById } from "@/lib/server/diagnosis-persistence";
import { getCaseStore } from "@/lib/server/demo-data";
import { getAdminClient, saveDetectionFeedback } from "@/lib/server/supabase-admin";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await ctx.params;
  const body = (await req.json()) as { correct: boolean; comment?: string };

  if (typeof body.correct !== "boolean") {
    return NextResponse.json({ detail: "Indica si el diagnóstico fue correcto." }, { status: 400 });
  }

  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (!client) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      feedback: { correct: body.correct, comment: body.comment ?? null, at: new Date().toISOString() },
    });
  }

  try {
    const feedback = await saveDetectionFeedback(client, userId, id, body);
    const existing = await getCaseById(cfg, userId, id);
    if (existing) {
      existing.feedback = feedback;
      getCaseStore().set(id, existing);
    }
    return NextResponse.json({ ok: true, feedback });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 400 });
  }
}
