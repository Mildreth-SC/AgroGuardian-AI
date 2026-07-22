"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { updateRecommendation } from "@/lib/api";
import type { DiagnosisResult } from "@/lib/api";
import { cn } from "@/lib/utils";

export function RecommendationsChecklist({
  recommendations,
  onChange,
}: {
  recommendations: DiagnosisResult["recommendations"];
  onChange?: (recs: DiagnosisResult["recommendations"]) => void;
}) {
  const [recs, setRecs] = useState(recommendations);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = async (idx: number) => {
    const rec = recs[idx];
    const next = !rec.completed;
    const updated = recs.map((r, i) => (i === idx ? { ...r, completed: next } : r));
    setRecs(updated);
    onChange?.(updated);

    if (!rec.id) return;
    setBusyId(rec.id);
    try {
      await updateRecommendation(rec.id, next);
    } catch {
      const rollback = recs.map((r, i) => (i === idx ? { ...r, completed: !next } : r));
      setRecs(rollback);
      onChange?.(rollback);
    } finally {
      setBusyId(null);
    }
  };

  const done = recs.filter((r) => r.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-forest">Plan de acción</h3>
        <span className="text-xs text-ink/45">
          {done}/{recs.length} completadas
        </span>
      </div>
      <ul className="space-y-2">
        {recs.map((r, idx) => (
          <li
            key={r.id ?? idx}
            className={cn(
              "rounded-xl border px-3 py-2.5 transition-colors",
              r.completed ? "border-leaf/30 bg-leaf/5 opacity-75" : "border-forest/10 bg-mist/60"
            )}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void toggle(idx)}
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                  r.completed
                    ? "border-leaf bg-leaf text-white"
                    : "border-forest/20 bg-white hover:border-leaf"
                )}
                aria-label={r.completed ? "Marcar pendiente" : "Marcar completada"}
              >
                {r.completed ? <Check className="h-3 w-3" /> : null}
              </button>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={cn("text-sm font-medium", r.completed && "line-through")}>
                    {r.title}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-ink/40">{r.timeframe}</span>
                </span>
                <span className="text-xs text-ink/60 mt-0.5 block">{r.detail}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
