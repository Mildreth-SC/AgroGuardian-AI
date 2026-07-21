import { NextRequest, NextResponse } from "next/server";
import { getConfig, hasOpenRouter, hasSupabase } from "@/lib/server/config";
import { probeOpenRouter } from "@/lib/server/openrouter";

export async function GET(req: NextRequest) {
  const cfg = getConfig();
  const probe = req.nextUrl.searchParams.get("probe") === "1";
  let openrouter_live: { ok: boolean; detail: string } | undefined;

  if (probe && hasOpenRouter(cfg)) {
    openrouter_live = await probeOpenRouter(cfg);
  }

  return NextResponse.json({
    status: "ok",
    demo_mode: cfg.demoMode,
    openrouter: hasOpenRouter(cfg),
    openrouter_live,
    openweather: false,
    supabase: hasSupabase(cfg),
    models: { text: cfg.openrouterModel, vision: cfg.openrouterVisionModel },
  });
}
