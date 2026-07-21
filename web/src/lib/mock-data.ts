export const CROPS = [
  { id: "1", name: "Plátano Barraganete", stage: "Floración", health: 72, status: "riesgo" as const, hectares: 3.2 },
  { id: "2", name: "Cacao Nacional", stage: "Producción", health: 91, status: "sano" as const, hectares: 2.0 },
  { id: "3", name: "Maíz duro", stage: "Vegetativo", health: 88, status: "sano" as const, hectares: 1.5 },
  { id: "4", name: "Café arábiga", stage: "Crecimiento", health: 64, status: "infectado" as const, hectares: 0.8 },
  { id: "5", name: "Arroz INIAP", stage: "Macollamiento", health: 85, status: "sano" as const, hectares: 4.1 },
  { id: "6", name: "Plátano Dominico", stage: "Desarrollo", health: 79, status: "riesgo" as const, hectares: 1.2 },
];

export const FARMS = [
  { id: "f1", name: "Finca El Guabo", lat: -1.0547, lng: -80.4545, status: "riesgo" as const },
  { id: "f2", name: "Lote Río Chico", lat: -1.072, lng: -80.42, status: "sano" as const },
  { id: "f3", name: "Parcela Calceta", lat: -0.845, lng: -80.163, status: "infectado" as const },
];

export const ALERTS = [
  { id: "a1", title: "Sigatoka Negra detectada", detail: "Lote Plátano · confianza 94%", time: "Hace 12 min", level: "alto" },
  { id: "a2", title: "Humedad crítica 87%", detail: "Riesgo de propagación foliar", time: "Hace 1 h", level: "alto" },
  { id: "a3", title: "Seguimiento pendiente", detail: "Revisar Café arábiga en 24h", time: "Hace 3 h", level: "medio" },
];
