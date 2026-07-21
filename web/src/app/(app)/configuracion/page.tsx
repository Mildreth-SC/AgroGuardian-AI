"use client";

import { useEffect, useState } from "react";
import { AppearancePanel } from "@/components/settings/AppearancePanel";
import { getHealth } from "@/lib/api";
import { usePreferences } from "@/providers/preferences-provider";

export default function ConfigPage() {
  const { t } = usePreferences();
  const [health, setHealth] = useState<{
    status: string;
    demo_mode: boolean;
    openai?: boolean;
    openrouter: boolean;
    ai_provider?: "openai" | "openrouter" | null;
    openweather: boolean;
    supabase: boolean;
    models: { text: string; vision: string };
  } | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="max-w-xl space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Sistema</p>
        <h1 className="font-display text-3xl text-forest mt-1">{t("settings.title")}</h1>
      </header>

      <AppearancePanel />

      <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-4 text-sm">
        <h2 className="font-medium text-forest">Estado de la API (Next.js)</h2>
        {health ? (
          <ul className="space-y-2 text-ink/70">
            <li>
              API: <strong className="text-leaf">{health.status}</strong>
            </li>
            <li>Demo mode: {health.demo_mode ? "sí" : "no"}</li>
            <li>
              OpenAI: {health.openai ? "conectado" : "sin clave"}
              {health.ai_provider === "openai" ? " (activo)" : ""}
            </li>
            <li>OpenRouter: {health.openrouter ? "conectado (respaldo)" : "sin clave"}</li>
            <li>
              Modelo texto: <code className="text-xs">{health.models?.text}</code>
            </li>
            <li>
              Modelo visión: <code className="text-xs">{health.models?.vision}</code>
            </li>
            <li>Supabase: {health.supabase ? "conectado" : "modo demo local"}</li>
          </ul>
        ) : (
          <p className="text-amber-800">API no alcanzable.</p>
        )}
      </div>
    </div>
  );
}
