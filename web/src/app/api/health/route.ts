import { NextRequest, NextResponse } from "next/server";
import {
  aiProvider,
  aiTextModel,
  aiVisionModel,
  getConfig,
  hasAI,
  hasOpenAI,
  hasOpenRouter,
  hasSupabase,
} from "@/lib/server/config";
import { probeAI } from "@/lib/server/openrouter";

export async function GET(req: NextRequest) {
  const cfg = getConfig();
  const probe = req.nextUrl.searchParams.get("probe") === "1";
  let ai_live: { ok: boolean; detail: string; provider: string | null } | undefined;

  if (probe && hasAI(cfg)) {
    ai_live = await probeAI(cfg);
  }

  return NextResponse.json({
    status: "ok",
    demo_mode: cfg.demoMode,
    openai: hasOpenAI(cfg),
    openrouter: hasOpenRouter(cfg),
    ai_provider: aiProvider(cfg),
    ai_live,
    openrouter_live: ai_live,
    openweather: false,
    supabase: hasSupabase(cfg),
    models: { text: aiTextModel(cfg), vision: aiVisionModel(cfg) },
  });
}
