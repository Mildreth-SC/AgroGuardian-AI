"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getFarms, type Farm } from "@/lib/api";

const MapInner = dynamic(() => import("./FarmMapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-2xl bg-forest/5 text-sm text-ink/50">
      Cargando mapa…
    </div>
  ),
});

export type MapFarm = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "sano" | "riesgo" | "infectado";
};

export function FarmMap({
  height = 320,
  farms: farmsProp,
}: {
  height?: number;
  farms?: MapFarm[];
}) {
  const [fetched, setFetched] = useState<MapFarm[]>([]);

  useEffect(() => {
    if (farmsProp) return;
    let cancelled = false;
    getFarms()
      .then((list: Farm[]) => {
        if (cancelled) return;
        setFetched(
          list.map((f) => ({
            id: f.id,
            name: f.name,
            lat: f.lat,
            lng: f.lng,
            status: f.health_status,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setFetched([]);
      });
    return () => {
      cancelled = true;
    };
  }, [farmsProp]);

  return <MapInner farms={farmsProp ?? fetched} height={height} />;
}
