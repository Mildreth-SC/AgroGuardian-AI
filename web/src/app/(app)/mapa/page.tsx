"use client";

import { useEffect, useState } from "react";
import { FarmMap } from "@/components/map/FarmMap";
import { getFarms, type Farm } from "@/lib/api";

export default function MapaPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFarms()
      .then(setFarms)
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
          Pins por estado sanitario: verde sano, amarillo riesgo, rojo infección.
        </p>
      </header>

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <FarmMap farms={pins} height={480} />

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
