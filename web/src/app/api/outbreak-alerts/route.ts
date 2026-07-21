import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseStore } from "@/lib/server/demo-data";
import { getAdminClient, listDetections } from "@/lib/server/supabase-admin";
import { fetchWeather } from "@/lib/server/weather";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const cfg = getConfig();
  let climate = { climate_risk: "medio", humidity_pct: 70, condition: "Variable" };
  try {
    const w = await fetchWeather(cfg);
    climate = w;
  } catch {
    /* fallback */
  }

  const memory = [...getCaseStore().values()];
  let cases = memory;
  const client = getAdminClient(cfg);
  if (client) {
    try {
      const db = await listDetections(client, userId);
      const map = new Map(memory.map((c) => [c.id, c]));
      db.forEach((c) => map.set(c.id, c));
      cases = [...map.values()];
    } catch {
      /* optional */
    }
  }

  const byDisease = new Map<string, number>();
  for (const c of cases) {
    const key = c.detection.disease.toLowerCase();
    byDisease.set(key, (byDisease.get(key) ?? 0) + 1);
  }

  const alerts = [...byDisease.entries()]
    .filter(([, count]) => count >= 1)
    .map(([disease, count]) => ({
      id: disease.replace(/\s+/g, "-"),
      disease,
      count,
      level:
        climate.climate_risk === "alto" || climate.climate_risk === "critico"
          ? "alto"
          : count > 1
            ? "medio"
            : "bajo",
      message:
        climate.climate_risk === "alto"
          ? `Humedad ${climate.humidity_pct}% favorece ${disease}. ${count} caso(s) registrado(s).`
          : `${count} caso(s) de ${disease} en tus lotes.`,
      climate_factor: climate.condition,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!alerts.length && (climate.climate_risk === "alto" || climate.climate_risk === "critico")) {
    alerts.push({
      id: "climate",
      disease: "Riesgo climático",
      count: 0,
      level: "medio",
      message: `Condición «${climate.condition}» con humedad ${climate.humidity_pct}% — monitorea Sigatoka y roya.`,
      climate_factor: climate.condition,
    });
  }

  return NextResponse.json({ alerts, climate_risk: climate.climate_risk });
}
