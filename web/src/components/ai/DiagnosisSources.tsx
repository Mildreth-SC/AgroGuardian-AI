import type { DiagnosisResult } from "@/lib/api";

export function DiagnosisSources({ result }: { result: DiagnosisResult }) {
  const inputs = [
    `Imagen analizada (${result.detection.crop})`,
    `Clima: ${result.weather.condition}, ${result.weather.humidity_pct}% humedad · fuente ${result.weather.source}`,
    `Confianza detección: ${Math.round(result.detection.confidence * 100)}%`,
  ];

  return (
    <div className="rounded-xl border border-forest/10 bg-mist/40 px-3 py-2.5 text-xs text-ink/65">
      <p className="font-medium text-ink/50 mb-1.5">Datos de entrada de esta recomendación</p>
      <ul className="space-y-1">
        {inputs.map((line) => (
          <li key={line}>· {line}</li>
        ))}
        {result.detection.rationale && (
          <li>· Señales visuales: {result.detection.rationale}</li>
        )}
      </ul>
    </div>
  );
}
