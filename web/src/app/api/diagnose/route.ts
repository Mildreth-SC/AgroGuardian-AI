import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { persistDiagnosisArtifacts } from "@/lib/server/diagnosis-persistence";
import { runDiagnosisPipeline } from "@/lib/server/orchestrator";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ detail: "Debes subir una imagen." }, { status: 400 });
  }

  const crop = form.get("crop")?.toString() || null;
  const latRaw = form.get("lat")?.toString();
  const lonRaw = form.get("lon")?.toString();
  const farmId = form.get("farm_id")?.toString() || null;
  const cropId = form.get("crop_id")?.toString() || null;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.length < 100) {
    return NextResponse.json({ detail: "Imagen vacía o inválida." }, { status: 400 });
  }
  if (bytes.length > 12 * 1024 * 1024) {
    return NextResponse.json({ detail: "Imagen demasiado grande (máx 12MB)." }, { status: 400 });
  }

  const cfg = getConfig();
  const mime = file.type || "image/jpeg";

  try {
    let result = await runDiagnosisPipeline(cfg, bytes, {
      mime,
      cropHint: crop,
      lat: latRaw ? Number(latRaw) : null,
      lon: lonRaw ? Number(lonRaw) : null,
    });

    result = await persistDiagnosisArtifacts(cfg, userId, result, bytes, {
      farm_id: farmId,
      crop_id: cropId,
      mime,
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { detail: e instanceof Error ? e.message : "Error al analizar" },
      { status: 500 }
    );
  }
}
