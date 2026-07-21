import { CROPS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const statusStyle = {
  sano: "bg-emerald-50 text-emerald-800 border-emerald-200",
  riesgo: "bg-amber-50 text-amber-900 border-amber-200",
  infectado: "bg-red-50 text-red-800 border-red-200",
};

export default function CultivosPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Lotes</p>
        <h1 className="font-display text-3xl text-forest mt-1">Mis cultivos</h1>
        <p className="text-sm text-ink/60 mt-1">Estado sanitario y etapa de crecimiento por lote.</p>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {CROPS.map((c) => (
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
            <p className="text-xs text-ink/50 mt-1">{c.hectares} ha · {c.stage}</p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ink/50">Salud</span>
                <span className="font-medium">{c.health}%</span>
              </div>
              <div className="h-2 rounded-full bg-sand overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    c.health >= 85 ? "bg-leaf" : c.health >= 70 ? "bg-amber-500" : "bg-red-600"
                  )}
                  style={{ width: `${c.health}%` }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
