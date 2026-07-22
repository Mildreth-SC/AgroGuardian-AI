"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Sparkles } from "lucide-react";
import { AppearancePanel } from "@/components/settings/AppearancePanel";
import {
  getCrops,
  getFarms,
  getHealth,
  getProfileSettings,
  updateProfileSettings,
  type Crop,
  type Farm,
} from "@/lib/api";
import { usePreferences } from "@/providers/preferences-provider";
import { cn } from "@/lib/utils";

const PROVINCES = ["Manabí", "Guayas", "Los Ríos", "Esmeraldas", "Pichincha"];
const CROP_OPTIONS = ["Plátano", "Cacao", "Maíz", "Café", "Arroz", "Otro"];

export default function ConfigPage() {
  const { t } = usePreferences();
  const [health, setHealth] = useState<{
    status: string;
    demo_mode: boolean;
    openai?: boolean;
    openrouter: boolean;
    ai_provider?: "openai" | "openrouter" | null;
    ai_live?: { ok: boolean; detail: string; provider: string | null };
    openweather: boolean;
    supabase: boolean;
    models: { text: string; vision: string };
  } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("Manabí");
  const [defaultCrop, setDefaultCrop] = useState("");
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [profileMode, setProfileMode] = useState<string>("loading");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
    getProfileSettings()
      .then((p) => {
        setFullName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setProvince(p.province ?? "Manabí");
        setDefaultCrop(p.default_crop ?? "");
        setProfileMode(p.mode ?? "supabase");
        if (p.farms?.length) setFarms(p.farms);
      })
      .catch(() => setProfileMode("demo"));
    Promise.all([getFarms(), getCrops()])
      .then(([f, c]) => {
        setFarms(f);
        setCrops(c);
      })
      .catch(() => {});
  }, []);

  const primaryFarm = useMemo(() => farms[0], [farms]);

  const saveProfile = async () => {
    setSaving(true);
    setSavedMsg(null);
    setProfileError(null);
    try {
      await updateProfileSettings({
        full_name: fullName,
        phone,
        province,
        default_crop: defaultCrop || null,
      });
      setSavedMsg("Perfil guardado correctamente.");
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Sistema</p>
        <h1 className="font-display text-3xl text-forest mt-1">{t("settings.title")}</h1>
      </header>

      <AppearancePanel />

      <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-4 text-sm">
        <div>
          <h2 className="font-medium text-forest">Perfil del agricultor</h2>
          <p className="text-xs text-ink/55 mt-1">
            {profileMode === "demo" || profileMode === "demo-fallback"
              ? "Modo demo — conecta Supabase para persistir el perfil."
              : "Datos sincronizados con tu cuenta."}
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink/60">Nombre completo</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2.5"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink/60">Teléfono / WhatsApp</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+593 99 000 0000"
            className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2.5"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink/60">Provincia</span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2.5"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs font-medium text-ink/60 mb-2">Cultivo por defecto al escanear</p>
          <div className="flex flex-wrap gap-2">
            {CROP_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setDefaultCrop(c)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs border transition-colors",
                  defaultCrop === c
                    ? "bg-leaf text-white border-leaf"
                    : "bg-white border-forest/15 hover:border-leaf/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {profileError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {profileError}
          </p>
        )}
        {savedMsg && (
          <p className="text-xs text-leaf bg-leaf/10 border border-leaf/20 rounded-lg px-3 py-2">
            {savedMsg}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => void saveProfile()}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-medium text-cream hover:bg-leaf-dark disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar perfil
        </button>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-3 text-sm">
        <h2 className="font-medium text-forest">Mi finca</h2>
        {primaryFarm ? (
          <ul className="space-y-1 text-ink/70">
            <li>
              <strong className="text-forest">{primaryFarm.name}</strong>
            </li>
            <li>{primaryFarm.area_ha} ha · estado {primaryFarm.health_status}</li>
            <li>
              {crops.length} cultivo(s) registrado(s)
            </li>
          </ul>
        ) : (
          <p className="text-ink/55">Sin finca registrada.</p>
        )}
        <Link
          href="/cultivos"
          className="inline-flex text-sm text-leaf font-medium hover:underline"
        >
          Gestionar fincas y cultivos →
        </Link>
      </div>

      <div className="rounded-2xl border border-forest/10 bg-cream p-5 space-y-4 text-sm">
        <h2 className="font-medium text-forest">Estado de la API</h2>
        {health ? (
          <ul className="space-y-2 text-ink/70">
            <li>
              API: <strong className="text-leaf">{health.status}</strong>
            </li>
            <li>Demo mode: {health.demo_mode ? "sí" : "no"}</li>
            <li>
              OpenAI: {health.openai ? "conectado" : "sin clave"}
              {health.ai_provider === "openai" ? " (activo)" : ""}
            </li>
            <li>OpenRouter: {health.openrouter ? "conectado (respaldo)" : "sin clave"}</li>
            <li>
              Proveedor IA activo: <strong>{health.ai_provider ?? "ninguno"}</strong>
              {health.ai_live ? (
                <span className={health.ai_live.ok ? " text-leaf" : " text-amber-800"}>
                  {" "}
                  · probe {health.ai_live.ok ? "OK" : "falló"}
                </span>
              ) : null}
            </li>
            <li>
              Modelo texto: <code className="text-xs">{health.models?.text}</code>
            </li>
            <li>
              Modelo visión: <code className="text-xs">{health.models?.vision}</code>
            </li>
            <li>Supabase: {health.supabase ? "conectado" : "modo demo local"}</li>
          </ul>
        ) : (
          <p className="text-amber-800">API no alcanzable.</p>
        )}
      </div>
    </div>
  );
}
