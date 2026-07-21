"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCrop,
  createFarm,
  deleteCrop,
  deleteFarm,
  getCrops,
  getFarms,
  updateCrop,
  updateFarm,
  type Crop,
  type Farm,
} from "@/lib/api";
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
  const [editFarmId, setEditFarmId] = useState<string | null>(null);
  const [editCropId, setEditCropId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [c, f] = await Promise.all([getCrops(), getFarms()]);
    setCrops(c);
    setFarms(f);
  };

  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const onCreateFarm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await run(async () => {
      await createFarm({
        name: String(fd.get("name")),
        lat: Number(fd.get("lat") || -1.0547),
        lng: Number(fd.get("lng") || -80.4545),
        area_ha: Number(fd.get("area_ha") || 1),
      });
      setShowFarm(false);
    });
  };

  const onUpdateFarm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFarmId) return;
    const fd = new FormData(e.currentTarget);
    await run(async () => {
      await updateFarm(editFarmId, {
        name: String(fd.get("name")),
        lat: Number(fd.get("lat")),
        lng: Number(fd.get("lng")),
        area_ha: Number(fd.get("area_ha")),
      });
      setEditFarmId(null);
    });
  };

  const onCreateCrop = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await run(async () => {
      await createCrop({
        farm_id: String(fd.get("farm_id")),
        name: String(fd.get("name")),
        variety: String(fd.get("variety") || ""),
        growth_stage: String(fd.get("growth_stage") || "Desarrollo"),
        hectares: Number(fd.get("hectares") || 1),
      });
      setShowCrop(false);
    });
  };

  const onUpdateCrop = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCropId) return;
    const fd = new FormData(e.currentTarget);
    await run(async () => {
      await updateCrop(editCropId, {
        name: String(fd.get("name")),
        variety: String(fd.get("variety") || ""),
        growth_stage: String(fd.get("growth_stage") || "Desarrollo"),
        health_pct: Number(fd.get("health_pct") || 80),
        status: String(fd.get("status")) as Crop["status"],
        hectares: Number(fd.get("hectares") || 1),
      });
      setEditCropId(null);
    });
  };

  const farmName = (id: string) => farms.find((f) => f.id === id)?.name || id;
  const editingFarm = farms.find((f) => f.id === editFarmId);
  const editingCrop = crops.find((c) => c.id === editCropId);

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
            onClick={() => {
              setShowFarm((v) => !v);
              setEditFarmId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm hover:bg-mist"
          >
            <Plus className="h-4 w-4" /> Finca
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCrop((v) => !v);
              setEditCropId(null);
            }}
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

      {editingFarm && (
        <form
          key={editingFarm.id}
          onSubmit={onUpdateFarm}
          className="rounded-2xl border border-leaf/30 bg-cream p-4 grid sm:grid-cols-2 gap-3 text-sm"
        >
          <p className="sm:col-span-2 text-xs uppercase tracking-wide text-leaf">Editar finca</p>
          <Field name="name" label="Nombre" required defaultValue={editingFarm.name} />
          <Field name="area_ha" label="Área (ha)" type="number" step="0.1" defaultValue={String(editingFarm.area_ha)} />
          <Field name="lat" label="Lat" type="number" step="0.0001" defaultValue={String(editingFarm.lat)} />
          <Field name="lng" label="Lng" type="number" step="0.0001" defaultValue={String(editingFarm.lng)} />
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={busy} type="submit" className="rounded-xl bg-forest px-4 py-2 text-cream text-sm disabled:opacity-40">
              Actualizar finca
            </button>
            <button type="button" onClick={() => setEditFarmId(null)} className="rounded-xl px-4 py-2 text-sm text-ink/60">
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

      {editingCrop && (
        <form
          key={editingCrop.id}
          onSubmit={onUpdateCrop}
          className="rounded-2xl border border-leaf/30 bg-cream p-4 grid sm:grid-cols-2 gap-3 text-sm"
        >
          <p className="sm:col-span-2 text-xs uppercase tracking-wide text-leaf">Editar cultivo</p>
          <Field name="name" label="Cultivo" required defaultValue={editingCrop.name} />
          <Field name="variety" label="Variedad" defaultValue={editingCrop.variety} />
          <Field name="growth_stage" label="Etapa" defaultValue={editingCrop.growth_stage} />
          <Field name="hectares" label="Hectáreas" type="number" step="0.1" defaultValue={String(editingCrop.hectares)} />
          <Field name="health_pct" label="Salud (%)" type="number" min="0" max="100" defaultValue={String(editingCrop.health_pct)} />
          <label className="block space-y-1">
            <span className="text-xs text-ink/50">Estado</span>
            <select name="status" defaultValue={editingCrop.status} className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2">
              <option value="sano">Sano</option>
              <option value="riesgo">Riesgo</option>
              <option value="infectado">Infectado</option>
            </select>
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={busy} type="submit" className="rounded-xl bg-forest px-4 py-2 text-cream text-sm disabled:opacity-40">
              Actualizar cultivo
            </button>
            <button type="button" onClick={() => setEditCropId(null)} className="rounded-xl px-4 py-2 text-sm text-ink/60">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-forest">Mis fincas</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {farms.map((f) => (
            <article
              key={f.id}
              className="rounded-2xl border border-forest/10 bg-white p-4 flex items-start justify-between gap-2"
            >
              <div>
                <h3 className="font-display text-lg text-forest">{f.name}</h3>
                <p className="text-xs text-ink/50 mt-1">
                  {f.area_ha} ha · {f.lat?.toFixed(4)}, {f.lng?.toFixed(4)}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  aria-label={`Editar ${f.name}`}
                  onClick={() => {
                    setEditFarmId(f.id);
                    setShowFarm(false);
                  }}
                  className="rounded-lg p-2 text-ink/50 hover:bg-mist hover:text-forest"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${f.name}`}
                  onClick={() => {
                    if (!confirm(`¿Eliminar la finca «${f.name}» y sus cultivos?`)) return;
                    run(async () => {
                      await deleteFarm(f.id);
                      if (editFarmId === f.id) setEditFarmId(null);
                    });
                  }}
                  className="rounded-lg p-2 text-ink/50 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-forest">Cultivos por lote</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {crops.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-forest/10 bg-cream p-4 hover:border-leaf/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-forest truncate">{c.name}</h2>
                  <span
                    className={cn(
                      "inline-block mt-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      statusStyle[c.status]
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`Editar ${c.name}`}
                    onClick={() => {
                      setEditCropId(c.id);
                      setShowCrop(false);
                    }}
                    className="rounded-lg p-2 text-ink/50 hover:bg-mist hover:text-forest"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${c.name}`}
                    onClick={() => {
                      if (!confirm(`¿Eliminar el cultivo «${c.name}»?`)) return;
                      run(async () => {
                        await deleteCrop(c.id);
                        if (editCropId === c.id) setEditCropId(null);
                      });
                    }}
                    className="rounded-lg p-2 text-ink/50 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-ink/50 mt-2">
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
      </section>
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
