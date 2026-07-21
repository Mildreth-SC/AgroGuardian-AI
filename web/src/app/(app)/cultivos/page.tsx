"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createCrop, createFarm, getCrops, getFarms, type Crop, type Farm } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusStyle = {
  sano: "bg-emerald-50 text-emerald-800 border-emerald-200",
  riesgo: "bg-amber-50 text-amber-900 border-amber-200",
  infectado: "bg-red-50 text-red-800 border-red-200",
};

export default function CultivosPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showFarm, setShowFarm] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [c, f] = await Promise.all([getCrops(), getFarms()]);
    setCrops(c);
    setFarms(f);
  };

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  const onCreateFarm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await createFarm({
        name: String(fd.get("name")),
        lat: Number(fd.get("lat") || -1.0547),
        lng: Number(fd.get("lng") || -80.4545),
        area_ha: Number(fd.get("area_ha") || 1),
      });
      setShowFarm(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const onCreateCrop = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await createCrop({
        farm_id: String(fd.get("farm_id")),
        name: String(fd.get("name")),
        variety: String(fd.get("variety") || ""),
        growth_stage: String(fd.get("growth_stage") || "Desarrollo"),
        hectares: Number(fd.get("hectares") || 1),
      });
      setShowCrop(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const farmName = (id: string) => farms.find((f) => f.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Lotes</p>
          <h1 className="font-display text-3xl text-forest mt-1">Mis cultivos</h1>
          <p className="text-sm text-ink/60 mt-1">Estado sanitario y etapa de crecimiento por lote.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowFarm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm hover:bg-mist"
          >
            <Plus className="h-4 w-4" /> Finca
          </button>
          <button
            type="button"
            onClick={() => setShowCrop((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-leaf px-3 py-2 text-sm font-medium text-white hover:bg-leaf-dark"
          >
            <Plus className="h-4 w-4" /> Cultivo
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {showFarm && (
        <form onSubmit={onCreateFarm} className="rounded-2xl border border-forest/10 bg-cream p-4 grid sm:grid-cols-2 gap-3 text-sm">
          <Field name="name" label="Nombre" required placeholder="Finca El Guabo" />
          <Field name="area_ha" label="Área (ha)" type="number" step="0.1" defaultValue="2" />
          <Field name="lat" label="Lat" type="number" step="0.0001" defaultValue="-1.0547" />
          <Field name="lng" label="Lng" type="number" step="0.0001" defaultValue="-80.4545" />
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={busy} type="submit" className="rounded-xl bg-forest px-4 py-2 text-cream text-sm disabled:opacity-40">
              Guardar finca
            </button>
            <button type="button" onClick={() => setShowFarm(false)} className="rounded-xl px-4 py-2 text-sm text-ink/60">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {showCrop && (
        <form onSubmit={onCreateCrop} className="rounded-2xl border border-forest/10 bg-cream p-4 grid sm:grid-cols-2 gap-3 text-sm">
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-xs text-ink/50">Finca</span>
            <select name="farm_id" required className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2">
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
          <Field name="name" label="Cultivo" required placeholder="Plátano Barraganete" />
          <Field name="variety" label="Variedad" placeholder="Barraganete" />
          <Field name="growth_stage" label="Etapa" defaultValue="Desarrollo" />
          <Field name="hectares" label="Hectáreas" type="number" step="0.1" defaultValue="1" />
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={busy || farms.length === 0} type="submit" className="rounded-xl bg-forest px-4 py-2 text-cream text-sm disabled:opacity-40">
              Guardar cultivo
            </button>
            <button type="button" onClick={() => setShowCrop(false)} className="rounded-xl px-4 py-2 text-sm text-ink/60">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {crops.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-forest/10 bg-cream p-4 hover:border-leaf/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-xl text-forest">{c.name}</h2>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  statusStyle[c.status]
                )}
              >
                {c.status}
              </span>
            </div>
            <p className="text-xs text-ink/50 mt-1">
              {c.hectares} ha · {c.growth_stage} · {farmName(c.farm_id)}
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink/50">Salud</span>
                <span className="font-medium">{c.health_pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-sand overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    c.health_pct >= 85 ? "bg-leaf" : c.health_pct >= 70 ? "bg-amber-500" : "bg-red-600"
                  )}
                  style={{ width: `${c.health_pct}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  ...props
}: React.ComponentProps<"input"> & { name: string; label: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-ink/50">{label}</span>
      <input
        name={name}
        className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2"
        {...props}
      />
    </label>
  );
}
