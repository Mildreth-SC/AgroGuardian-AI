"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStep = {
  agent: string;
  status: string;
  summary: string;
  duration_ms?: number;
};

const PIPELINE = [
  "Disease Detector",
  "Climate Agent",
  "Agronomist",
  "Report Agent",
] as const;

type Props = {
  steps: AgentStep[];
  active?: boolean;
};

export function AgentProgress({ steps, active }: Props) {
  const byAgent = new Map<string, AgentStep>();
  for (const s of steps) byAgent.set(s.agent, s);

  return (
    <div className="rounded-2xl border border-forest/10 bg-mist/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-forest">Agentes en vivo</h3>
        {active && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-leaf">
            <Loader2 className="h-3 w-3 animate-spin" />
            Procesando
          </span>
        )}
      </div>
      <ol className="space-y-2.5">
        {PIPELINE.map((name, i) => {
          const step = byAgent.get(name);
          const running = step?.status === "running";
          const done = step && step.status !== "running";
          const failed = step?.status === "error";
          return (
            <li
              key={name}
              className={cn(
                "flex gap-3 rounded-xl px-3 py-2.5 transition-colors",
                running && "bg-leaf/10",
                done && !failed && "bg-white/70",
                !step && "opacity-45"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {failed ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-leaf" />
                ) : running ? (
                  <Loader2 className="h-4 w-4 animate-spin text-leaf" />
                ) : (
                  <Circle className="h-4 w-4 text-ink/25" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    <span className="font-mono text-[10px] text-ink/35 mr-1.5">{i + 1}</span>
                    {name}
                  </p>
                  {done && step?.duration_ms != null && step.duration_ms > 0 && (
                    <span className="text-[10px] text-ink/35 tabular-nums">{step.duration_ms}ms</span>
                  )}
                </div>
                <p className="text-xs text-ink/55 mt-0.5 truncate">
                  {step?.summary || "En espera…"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
