import Link from "next/link";
import { FileText } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Documentación</p>
        <h1 className="font-display text-3xl text-forest mt-1">Reportes</h1>
        <p className="text-sm text-ink/60 mt-1">
          Cada diagnóstico genera un PDF con imagen, clima, recomendaciones y plan de seguimiento.
        </p>
      </header>

      <div className="rounded-2xl border border-forest/10 bg-cream p-6 text-center space-y-4">
        <FileText className="mx-auto h-10 w-10 text-leaf" />
        <p className="text-sm text-ink/65">
          Escanea una planta y descarga el reporte desde el resultado o desde Diagnósticos.
        </p>
        <Link
          href="/escanear"
          className="inline-flex rounded-xl bg-leaf px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark"
        >
          Crear diagnóstico
        </Link>
      </div>
    </div>
  );
}
