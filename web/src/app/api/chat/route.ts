import { NextRequest, NextResponse } from "next/server";
import { getConfig, hasAI } from "@/lib/server/config";
import { aiSourceLabel, chatCompletion } from "@/lib/server/openrouter";
import { demoWeather, fetchWeather } from "@/lib/server/weather";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cfg = getConfig();

  let climate = demoWeather();
  try {
    climate = await fetchWeather(cfg);
  } catch {
    /* fallback */
  }

  const sources = [`Clima (${climate.source})`, "Historial de finca"];

  if (cfg.demoMode && !hasAI(cfg)) {
    return NextResponse.json({
      reply: `Respecto a «${body.message}»: con humedad del ${climate.humidity_pct}% y condición «${climate.condition}», el riesgo es ${climate.climate_risk}. (Modo demo)`,
      sources,
      demo: true,
    });
  }

  const system =
    "Eres AgroGuardian AI, copiloto del agricultor en Manabí, Ecuador. Responde en español, claro y práctico.";
  const context = `Provincia: ${body.province ?? "Manabí"}. Clima: ${JSON.stringify(climate)}`;
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: `${system}\n${context}` },
  ];
  for (const m of (body.history ?? []).slice(-8)) {
    messages.push({ role: m.role as "user" | "assistant", content: m.content });
  }
  messages.push({ role: "user", content: body.message });

  try {
    const reply = await chatCompletion(cfg, messages);
    sources.push(aiSourceLabel(cfg));
    return NextResponse.json({ reply, sources, demo: false });
  } catch (e) {
    return NextResponse.json(
      { detail: e instanceof Error ? e.message : "Error en asistente" },
      { status: 500 }
    );
  }
}
