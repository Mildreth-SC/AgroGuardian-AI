"use client";

import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Farm = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "sano" | "riesgo" | "infectado";
};

type CasePin = {
  id: string;
  lat: number;
  lng: number;
  disease: string;
  crop: string;
  risk_level: "bajo" | "medio" | "alto" | "critico";
  created_at: string;
};

const FARM_COLORS = {
  sano: "#2D6A4F",
  riesgo: "#D4A017",
  infectado: "#C1121F",
};

const CASE_COLORS = {
  bajo: "#52B788",
  medio: "#D4A017",
  alto: "#E85D04",
  critico: "#C1121F",
};

export default function FarmMapInner({
  farms,
  cases = [],
  height,
}: {
  farms: Farm[];
  cases?: CasePin[];
  height: number;
}) {
  const center =
    cases[0] != null
      ? ([cases[0].lat, cases[0].lng] as [number, number])
      : farms[0] != null
        ? ([farms[0].lat, farms[0].lng] as [number, number])
        : ([-1.05, -80.45] as [number, number]);

  return (
    <div className="overflow-hidden rounded-2xl border border-forest/10" style={{ height }}>
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {farms.map((f) => (
          <CircleMarker
            key={`farm-${f.id}`}
            center={[f.lat, f.lng]}
            radius={14}
            pathOptions={{
              color: FARM_COLORS[f.status],
              fillColor: FARM_COLORS[f.status],
              fillOpacity: 0.55,
              weight: 2,
            }}
          >
            <Popup>
              <strong>{f.name}</strong>
              <br />
              Finca · estado: {f.status}
            </Popup>
          </CircleMarker>
        ))}
        {cases.map((c) => (
          <CircleMarker
            key={`case-${c.id}`}
            center={[c.lat, c.lng]}
            radius={8}
            pathOptions={{
              color: CASE_COLORS[c.risk_level],
              fillColor: CASE_COLORS[c.risk_level],
              fillOpacity: 0.9,
              weight: 1,
            }}
          >
            <Popup>
              <strong>{c.disease}</strong>
              <br />
              {c.crop} · riesgo {c.risk_level}
              <br />
              <span className="text-xs opacity-70">
                {new Date(c.created_at).toLocaleString("es-EC")}
              </span>
              <br />
              <Link href={`/diagnosticos/${c.id}`} className="text-xs text-leaf underline">
                Ver diagnóstico
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
