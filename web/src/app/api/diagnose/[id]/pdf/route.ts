import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import {
  findReportPath,
  getCaseById,
  loadReportPdfBytes,
} from "@/lib/server/diagnosis-persistence";
import { getAdminClient, loadScanImageBytes } from "@/lib/server/supabase-admin";
import { buildDiagnosisPdf } from "@/lib/server/pdf";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await ctx.params;
  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (client) {
    const storagePath = await findReportPath(client, userId, id);
    if (storagePath) {
      const stored = await loadReportPdfBytes(client, storagePath);
      if (stored) {
        return new NextResponse(new Uint8Array(stored), {
          headers: pdfHeaders(id),
        });
      }
    }
  }

  const result = await getCaseById(cfg, userId, id);
  if (!result) {
    return NextResponse.json({ detail: "Caso no encontrado." }, { status: 404 });
  }

  let imageBytes: Buffer | null = null;
  if (client && result.image_path) {
    imageBytes = await loadScanImageBytes(client, result.image_path);
  }

  const pdfBytes = await buildDiagnosisPdf(result, imageBytes);
  return new NextResponse(Buffer.from(pdfBytes), { headers: pdfHeaders(id) });
}

function pdfHeaders(id: string) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="agroguardian-${id.slice(0, 8)}.pdf"`,
    "Cache-Control": "private, max-age=3600",
  };
}
