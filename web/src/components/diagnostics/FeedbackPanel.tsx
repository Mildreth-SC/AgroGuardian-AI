"use client";

import { useState } from "react";
import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { submitDiagnosisFeedback } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FeedbackPanel({
  detectionId,
  initial,
}: {
  detectionId: string;
  initial?: { correct: boolean | null; comment?: string | null; at?: string | null } | null;
}) {
  const [feedback, setFeedback] = useState(initial ?? null);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (correct: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const res = await submitDiagnosisFeedback(detectionId, { correct, comment: comment || undefined });
      setFeedback(res.feedback ?? { correct, comment: comment || null, at: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (feedback?.correct != null) {
    return (
      <div className="rounded-xl border border-leaf/20 bg-leaf/5 px-4 py-3 text-sm">
        <p className="font-medium text-forest">
          Gracias por tu retroalimentación — marcaste el diagnóstico como{" "}
          {feedback.correct ? "correcto" : "incorrecto"}.
        </p>
        {feedback.comment && <p className="text-xs text-ink/60 mt-1">{feedback.comment}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-forest/10 bg-mist/40 px-4 py-4 space-y-3">
      <p className="text-sm font-medium text-forest">¿El diagnóstico fue útil?</p>
      <p className="text-xs text-ink/55">
        Tu respuesta ayuda a mejorar el sistema y a validar con extensionistas.
      </p>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional (ej. el agrónomo confirmó otra enfermedad)"
        rows={2}
        className="w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm resize-none"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium",
            "border-leaf/30 bg-white hover:bg-leaf/10 text-leaf"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
          Sí, correcto
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit(false)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-4 py-2 text-sm hover:bg-mist"
        >
          <ThumbsDown className="h-4 w-4" />
          No, incorrecto
        </button>
      </div>
    </div>
  );
}
