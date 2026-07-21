export function getConfig() {
  return {
    openrouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
    openrouterModel:
      process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-20b:free",
    openrouterVisionModel:
      process.env.OPENROUTER_VISION_MODEL ?? "nvidia/nemotron-nano-12b-v2-vl:free",
    openrouterBaseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    demoMode: process.env.DEMO_MODE === "true",
    defaultLat: Number(process.env.DEFAULT_LAT ?? -1.0547),
    defaultLon: Number(process.env.DEFAULT_LON ?? -80.4545),
  };
}

export type AppConfig = ReturnType<typeof getConfig>;

export function hasOpenRouter(cfg: AppConfig) {
  return Boolean(cfg.openrouterApiKey.trim());
}

export function hasSupabase(cfg: AppConfig) {
  return Boolean(cfg.supabaseUrl.trim() && cfg.supabaseServiceKey.trim());
}
