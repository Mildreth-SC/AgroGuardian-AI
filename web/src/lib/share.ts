export function whatsAppShare(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

export function diagnosisShareText(disease: string, crop: string, confidence: number) {
  return `🌿 AgroGuardian AI — Diagnóstico en Manabí\n\nEnfermedad: ${disease}\nCultivo: ${crop}\nConfianza: ${Math.round(confidence * 100)}%\n\nEscanea tus cultivos: https://agroguardian-ai-six.vercel.app/escanear`;
}
