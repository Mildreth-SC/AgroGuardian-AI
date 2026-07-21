"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Droplets, Leaf, ScanLine, Thermometer } from "lucide-react";
import { FarmMap } from "@/components/map/FarmMap";
import { getCases, getCrops, getOutbreakAlerts, getWeather, type Crop, type DiagnosisResult, type OutbreakAlert, type WeatherSnapshot } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cases, setCases] = useState<DiagnosisResult[]>([]);
  const [outbreaks, setOutbreaks] = useState<OutbreakAlert[]>([]);

  useEffect(() => {
    getWeather()
      .then(setWeather)
      .catch(() =>
        setWeather({
          temperature_c: 28.4,
          humidity_pct: 87,
          rain_mm: 6.2,
          wind_kmh: 12,
          condition: "Humedad alta",
          climate_risk: "alto",
          source: "demo",
          location: "Portoviejo, Manab├¡",
        })
      );
    getCrops().then(setCrops).catch(() => setCrops([]));
    getCases().then(setCases).catch(() => setCases([]));
    getOutbreakAlerts()
      .then((r) => setOutbreaks(r.alerts))
      .catch(() => setOutbreaks([]));
  }, []);

  const avgHealth = crops.length
    ? Math.round(crops.reduce((a, c) => a + c.health_pct, 0) / crops.length)
    : 0;
  const infected = crops.filter((c) => c.status !== "sano").length;

  const ring = useMemo(() => {
    if (!crops.length) return { healthy: 70, risk: 20, infected: 10 };
    const n = crops.length;
    const h = Math.round((crops.filter((c) => c.status === "sano").length / n) * 100);
    const r = Math.round((crops.filter((c) => c.status === "riesgo").length / n) * 100);
    return { healthy: h, risk: r, infected: Math.max(0, 100 - h - r) };
  }, [crops]);

  const alerts = cases.slice(0, 3).map((c) => ({
    id: c.id,
    title: `${c.detection.disease} detectada`,
    detail: `${c.detection.crop} ┬À confianza ${Math.round(c.detection.confidence * 100)}%`,
    time: new Date(c.created_at).toLocaleString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }),
    level: c.detection.risk_level === "alto" || c.detection.risk_level === "critico" ? "alto" : "medio",
  }));

  return (
    <div className="bg-field -mx-4 -mt-5 px-4 pt-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-2 space-y-6 animate-fade-up">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">AgroGuardian AI</p>
          <h1 className="font-display text-3xl sm:text-4xl text-forest mt-1">Buenos d├¡as</h1>
          <p className="mt-1 text-sm text-ink/60 max-w-lg">
            Sanidad vegetal en tiempo real ÔÇö detecta plagas antes de que el da├▒o sea evidente.
          </p>
        </div>
        <Link
          href="/escanear"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-leaf-dark transition-colors"
        >
          <ScanLine className="h-4 w-4" />
          Escanear planta
        </Link>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Cultivos activos", value: String(crops.length || "ÔÇö"), icon: Leaf, hint: "lotes registrados" },
          { label: "Casos detectados", value: String(infected), icon: AlertTriangle, hint: "requieren atenci├│n" },
          {
            label: "Riesgo clim├ítico",
            value: weather ? weather.climate_risk.toUpperCase() : "ÔÇª",
            icon: Droplets,
            hint: weather ? `Humedad ${weather.humidity_pct}%` : "cargandoÔÇª",
          },
          { label: "Salud promedio", value: crops.length ? `${avgHealth}%` : "ÔÇö", icon: Thermometer, hint: "├¡ndice foliar" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-forest/8 bg-cream/80 backdrop-blur px-4 py-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink/50">{m.label}</p>
              <m.icon className="h-4 w-4 text-leaf" />
            </div>
            <p className="mt-2 font-display text-2xl text-forest">{m.value}</p>
            <p className="text-[11px] text-ink/45 mt-1">{m.hint}</p>
          </div>
        ))}
      </section>

      {outbreaks.length > 0 && (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 sm:p-5">
          <h2 className="font-display text-xl text-forest mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Alertas de brote zonal
          </h2>
          <ul className="space-y-2">
            {outbreaks.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border border-amber-200/60 bg-white/70 px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-ink">{o.disease}</p>
                <p className="text-xs text-ink/60 mt-0.5">{o.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-2xl border border-forest/8 bg-cream/90 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-forest">Mapa de fincas</h2>
            <Link href="/mapa" className="text-xs text-leaf hover:underline">
              Ver mapa
            </Link>
          </div>
          <FarmMap height={280} />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink/55">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-leaf" /> Sano
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Riesgo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-red-600" /> Infectado
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-forest/8 bg-cream/90 p-4 sm:p-5">
            <h2 className="font-display text-xl text-forest mb-3">Estado de cultivos</h2>
            <StatusRing {...ring} />
          </div>
          <div className="rounded-2xl border border-forest/8 bg-cream/90 p-4 sm:p-5">
            <h2 className="font-display text-xl text-forest mb-3">Alertas recientes</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-ink/50">Sin diagn├│sticos a├║n. Escanea una planta para empezar.</p>
            ) : (
              <ul className="space-y-3">
                {alerts.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        a.level === "alto" ? "bg-red-500 animate-pulse-soft" : "bg-amber-500"
                      )}
                    />
                    <div>
                      <p className="font-medium text-ink">{a.title}</p>
                      <p className="text-xs text-ink/50">{a.detail}</p>
                      <p className="text-[10px] text-ink/40 mt-0.5">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusRing({
  healthy,
  risk,
  infected,
}: {
  healthy: number;
  risk: number;
  infected: number;
}) {
  const c = 2 * Math.PI * 42;
  const h = (healthy / 100) * c;
  const r = (risk / 100) * c;
  const i = (infected / 100) * c;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#d8e2d9" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#2d6a4f"
          strokeWidth="10"
          strokeDasharray={`${h} ${c - h}`}
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#d4a017"
          strokeWidth="10"
          strokeDasharray={`${r} ${c - r}`}
          strokeDashoffset={-h}
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#c1121f"
          strokeWidth="10"
          strokeDasharray={`${i} ${c - i}`}
          strokeDashoffset={-(h + r)}
        />
      </svg>
      <ul className="text-sm space-y-1.5">
        <li className="flex justify-between gap-6">
          <span className="text-ink/60">Sanos</span>
          <strong>{healthy}%</strong>
        </li>
        <li className="flex justify-between gap-6">
          <span className="text-ink/60">Riesgo</span>
          <strong>{risk}%</strong>
        </li>
        <li className="flex justify-between gap-6">
          <span className="text-ink/60">Infectados</span>
          <strong>{infected}%</strong>
        </li>
      </ul>
    </div>
  );
}
