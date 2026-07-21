export type Locale = "es" | "en";
export type ThemeId = "field" | "dark" | "sunset" | "ocean";

export const THEMES: { id: ThemeId; labelEs: string; labelEn: string; swatch: string }[] = [
  { id: "field", labelEs: "Campo verde", labelEn: "Green field", swatch: "#2d6a4f" },
  { id: "dark", labelEs: "Noche", labelEn: "Dark night", swatch: "#0d1f17" },
  { id: "sunset", labelEs: "Atardecer", labelEn: "Sunset", swatch: "#c45c26" },
  { id: "ocean", labelEs: "Océano", labelEn: "Ocean", swatch: "#0077b6" },
];

const es = {
  nav: {
    dashboard: "Dashboard",
    crops: "Mis Cultivos",
    scan: "Escanear Planta",
    diagnostics: "Diagnósticos",
    diseases: "Enciclopedia",
    map: "Mapa de Fincas",
    weather: "Clima y Suelo",
    assistant: "Asistente IA",
    reports: "Reportes",
    markets: "Mercados",
    training: "Capacitación",
    settings: "Configuración",
  },
  settings: {
    title: "Configuración",
    appearance: "Apariencia e idioma",
    theme: "Tema de color",
    language: "Idioma",
    saved: "Preferencias guardadas en este dispositivo",
  },
  outbreak: {
    title: "Alertas de brote",
    climate: "Riesgo climático elevado",
    cases: "casos recientes en tu zona",
  },
  timeline: {
    title: "Línea de tiempo sanitaria",
    empty: "Escanea plantas para construir el historial del lote",
  },
  dashboard: {
    greetingMorning: "Buenos días",
    greetingAfternoon: "Buenas tardes",
    greetingEvening: "Buenas noches",
    subtitle:
      "Sanidad vegetal en tiempo real - detecta plagas antes de que el daño sea evidente.",
    scanCta: "Escanear planta",
    activeCrops: "Cultivos activos",
    lotsRegistered: "lotes registrados",
    detectedCases: "Casos detectados",
    needAttention: "requieren atención",
    climateRisk: "Riesgo climático",
    loading: "cargando…",
    avgHealth: "Salud promedio",
    leafIndex: "índice foliar",
    outbreakTitle: "Alertas de brote zonal",
    farmMap: "Mapa de fincas",
    viewMap: "Ver mapa",
    healthy: "Sano",
    risk: "Riesgo",
    infected: "Infectado",
    cropStatus: "Estado de cultivos",
    recentAlerts: "Alertas recientes",
    noDiagnostics: "Sin diagnósticos aún. Escanea una planta para empezar.",
    statusHealthy: "Sanos",
    statusRisk: "Riesgo",
    statusInfected: "Infectados",
    humidityHigh: "Humedad alta",
  },
} as const;

type Dictionary = {
  nav: Record<string, string>;
  settings: Record<string, string>;
  outbreak: Record<string, string>;
  timeline: Record<string, string>;
  dashboard: Record<string, string>;
};

const en: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    crops: "My Crops",
    scan: "Scan Plant",
    diagnostics: "Diagnostics",
    diseases: "Encyclopedia",
    map: "Farm Map",
    weather: "Weather & Soil",
    assistant: "AI Assistant",
    reports: "Reports",
    markets: "Markets",
    training: "Training",
    settings: "Settings",
  },
  settings: {
    title: "Settings",
    appearance: "Appearance & language",
    theme: "Color theme",
    language: "Language",
    saved: "Preferences saved on this device",
  },
  outbreak: {
    title: "Outbreak alerts",
    climate: "Elevated climate risk",
    cases: "recent cases in your area",
  },
  timeline: {
    title: "Health timeline",
    empty: "Scan plants to build lot history",
  },
  dashboard: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    subtitle: "Real-time crop health - detect pests before damage is visible.",
    scanCta: "Scan plant",
    activeCrops: "Active crops",
    lotsRegistered: "registered lots",
    detectedCases: "Detected cases",
    needAttention: "need attention",
    climateRisk: "Climate risk",
    loading: "loading…",
    avgHealth: "Average health",
    leafIndex: "leaf index",
    outbreakTitle: "Regional outbreak alerts",
    farmMap: "Farm map",
    viewMap: "View map",
    healthy: "Healthy",
    risk: "Risk",
    infected: "Infected",
    cropStatus: "Crop status",
    recentAlerts: "Recent alerts",
    noDiagnostics: "No diagnostics yet. Scan a plant to get started.",
    statusHealthy: "Healthy",
    statusRisk: "Risk",
    statusInfected: "Infected",
    humidityHigh: "High humidity",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { es, en };

export function t(locale: Locale, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dictionaries[locale];
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = (cur as Record<string, unknown>)[p];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}
