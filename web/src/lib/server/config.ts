export function getConfig() {
  return {
    openaiApiKey: process.env.OPENAI_API_KEY ?? "",
    openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    openaiVisionModel: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
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

export function hasOpenAI(cfg: AppConfig) {
  return Boolean(cfg.openaiApiKey.trim());
}

export function hasOpenRouter(cfg: AppConfig) {
  return Boolean(cfg.openrouterApiKey.trim());
}

/** OpenAI first; OpenRouter as optional fallback provider. */
export function hasAI(cfg: AppConfig) {
  return hasOpenAI(cfg) || hasOpenRouter(cfg);
}

export function aiProvider(cfg: AppConfig): "openai" | "openrouter" | null {
  if (hasOpenAI(cfg)) return "openai";
  if (hasOpenRouter(cfg)) return "openrouter";
  return null;
}

export function aiTextModel(cfg: AppConfig) {
  return hasOpenAI(cfg) ? cfg.openaiModel : cfg.openrouterModel;
}

export function aiVisionModel(cfg: AppConfig) {
  return hasOpenAI(cfg) ? cfg.openaiVisionModel : cfg.openrouterVisionModel;
}

export function hasSupabase(cfg: AppConfig) {
  return Boolean(cfg.supabaseUrl.trim() && cfg.supabaseServiceKey.trim());
}
