"use client";

import { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export default function ConfigPage() {
  const [health, setHealth] = useState<{
    status: string;
    demo_mode: boolean;
    openrouter: boolean;
    openweather: boolean;
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
        <h1 className="font-display text-3xl text-forest mt-1">Configuración</h1>
      </header>

      <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-4 text-sm">
        <h2 className="font-medium text-forest">Estado del backend</h2>
        {health ? (
          <ul className="space-y-2 text-ink/70">
            <li>API: <strong className="text-leaf">{health.status}</strong></li>
            <li>Demo mode: {health.demo_mode ? "sí" : "no"}</li>
            <li>OpenRouter / GPT-4o: {health.openrouter ? "conectado" : "sin clave"}</li>
            <li>OpenWeather: {health.openweather ? "conectado" : "usando Open-Meteo"}</li>
          </ul>
        ) : (
          <p className="text-amber-800">Backend no alcanzable en {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</p>
        )}

        <div className="pt-2 border-t border-forest/10 space-y-2 text-xs text-ink/55">
          <p>
            Copia <code>backend/.env.example</code> → <code>backend/.env</code> y agrega{" "}
            <code>OPENROUTER_API_KEY</code> para visión real.
          </p>
          <p>
            Clerk: opcional. Con <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> aparece Entrar/Registro
            en el sidebar.
          </p>
          <p>
            PWA: instala desde el navegador (manifest + service worker). Muestras demo en Escanear.
          </p>
        </div>
      </div>
    </div>
  );
}
