import { FarmMap } from "@/components/map/FarmMap";
import { FARMS } from "@/lib/mock-data";

export default function MapaPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Geolocalización</p>
        <h1 className="font-display text-3xl text-forest mt-1">Mapa de fincas</h1>
        <p className="text-sm text-ink/60 mt-1">
          Pins por estado sanitario: verde sano, amarillo riesgo, rojo infección.
        </p>
      </header>

      <FarmMap height={480} />

      <ul className="grid sm:grid-cols-3 gap-3">
        {FARMS.map((f) => (
          <li key={f.id} className="rounded-2xl border border-forest/10 bg-cream px-4 py-3 text-sm">
            <p className="font-medium text-forest">{f.name}</p>
            <p className="text-xs text-ink/50 capitalize mt-0.5">Estado: {f.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
