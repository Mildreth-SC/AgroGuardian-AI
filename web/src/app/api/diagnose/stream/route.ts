import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { persistDiagnosisArtifacts } from "@/lib/server/diagnosis-persistence";
import { runDiagnosisPipeline } from "@/lib/server/orchestrator";
import type { AgentTrace } from "@/types/api";

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return new Response(sse("error", { detail: "Debes subir una imagen." }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const crop = form.get("crop")?.toString() || null;
  const latRaw = form.get("lat")?.toString();
  const lonRaw = form.get("lon")?.toString();
  const farmId = form.get("farm_id")?.toString() || null;
  const cropId = form.get("crop_id")?.toString() || null;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.length < 100) {
    return new Response(sse("error", { detail: "Imagen vacía o inválida." }), {
      status: 400,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const cfg = getConfig();
  const mime = file.type || "image/jpeg";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(enc.encode(sse(event, data)));
      };

      try {
        let result = await runDiagnosisPipeline(cfg, bytes, {
          mime,
          cropHint: crop,
          lat: latRaw ? Number(latRaw) : null,
          lon: lonRaw ? Number(lonRaw) : null,
          onProgress: (trace: AgentTrace) => send("progress", trace),
        });

        send("progress", {
          agent: "Report Agent",
          status: "working",
          summary: "Generando PDF y guardando reporte…",
          duration_ms: 0,
        });

        result = await persistDiagnosisArtifacts(cfg, userId, result, bytes, {
          farm_id: farmId,
          crop_id: cropId,
          mime,
        });

        send("result", result);
      } catch (e) {
        send("error", { detail: e instanceof Error ? e.message : "Error al analizar" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
