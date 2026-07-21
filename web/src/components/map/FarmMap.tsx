"use client";

import dynamic from "next/dynamic";
import { FARMS } from "@/lib/mock-data";

const MapInner = dynamic(() => import("./FarmMapInner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-72 place-items-center rounded-2xl bg-forest/5 text-sm text-ink/50">
      Cargando mapa…
    </div>
  ),
});

export function FarmMap({ height = 320 }: { height?: number }) {
  return <MapInner farms={FARMS} height={height} />;
}
