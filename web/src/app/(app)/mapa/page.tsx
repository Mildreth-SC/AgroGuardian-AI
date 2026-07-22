"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FarmMap } from "@/components/map/FarmMap";
import { getFarms, getMapCases, type Farm, type MapCasePin } from "@/lib/api";

export default function MapaPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [cases, setCases] = useState<MapCasePin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFarms(), getMapCases()])
      .then(([f, c]) => {
        setFarms(f);
        setCases(c);
      })
      .catch((e) => setError(e.message));
  }, []);

  const pins = farms.map((f) => ({
    id: f.id,
    name: f.name,
    lat: f.lat,
    lng: f.lng,
    status: f.health_status,
  }));

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Geolocalización</p>
        <h1 className="font-display text-3xl text-forest mt-1">Mapa de fincas</h1>
        <p className="text-sm text-ink/60 mt-1">
          Círculos grandes: fincas. Puntos pequeños: diagnósticos con GPS al escanear.
        </p>
      </header>

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <FarmMap farms={pins} cases={cases} height={480} />

      <div className="flex flex-wrap gap-4 text-xs text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#2D6A4F]" /> Finca sana
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#D4A017]" /> Riesgo / caso medio
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#C1121F]" /> Infección / caso crítico
        </span>
      </div>

      {cases.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium text-forest text-sm">Diagnósticos en mapa ({cases.length})</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {cases.slice(0, 6).map((c) => (
              <li key={c.id} className="rounded-xl border border-forest/10 bg-cream px-3 py-2 text-sm">
                <Link href={`/diagnosticos/${c.id}`} className="font-medium text-forest hover:underline">
                  {c.disease}
                </Link>
                <p className="text-xs text-ink/50">
                  {c.crop} · {new Date(c.created_at).toLocaleDateString("es-EC")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="grid sm:grid-cols-3 gap-3">
        {farms.map((f) => (
          <li key={f.id} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3 text-sm">
            <p className="font-medium text-forest">{f.name}</p>
            <p className="text-xs text-ink/50 capitalize mt-0.5">
              Estado: {f.health_status} · {f.area_ha} ha
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
