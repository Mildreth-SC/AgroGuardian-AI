"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Farm = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "sano" | "riesgo" | "infectado";
};

const COLORS = {
  sano: "#2D6A4F",
  riesgo: "#D4A017",
  infectado: "#C1121F",
};

export default function FarmMapInner({ farms, height }: { farms: Farm[]; height: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-forest/10" style={{ height }}>
      <MapContainer
        center={[-1.05, -80.45]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {farms.map((f) => (
          <CircleMarker
            key={f.id}
            center={[f.lat, f.lng]}
            radius={12}
            pathOptions={{
              color: COLORS[f.status],
              fillColor: COLORS[f.status],
              fillOpacity: 0.75,
            }}
          >
            <Popup>
              <strong>{f.name}</strong>
              <br />
              Estado: {f.status}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
