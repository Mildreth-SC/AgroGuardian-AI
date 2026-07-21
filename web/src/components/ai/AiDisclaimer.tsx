import { ShieldAlert } from "lucide-react";

type Props = {
  compact?: boolean;
};

export function AiDisclaimer({ compact }: Props) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-[11px] leading-relaxed text-amber-950"
          : "rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-950"
      }
    >
      <p className="flex items-start gap-2 font-medium">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Supervisión humana requerida
      </p>
      <p className={compact ? "mt-1 pl-6" : "mt-1.5 pl-6"}>
        Las recomendaciones de IA son orientativas y citan clima, imagen e historial de finca. No
        sustituyen la visita de un agrónomo o extensionista del MAG. Confirma tratamientos críticos
        (fitosanitarios, dosis, cosecha) con un técnico antes de aplicarlos.
      </p>
    </div>
  );
}
