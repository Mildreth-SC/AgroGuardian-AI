import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseById } from "@/lib/server/diagnosis-persistence";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const { id } = await ctx.params;
  const result = await getCaseById(getConfig(), userId, id);
  if (!result) {
    return NextResponse.json({ detail: "Caso no encontrado." }, { status: 404 });
  }
  return NextResponse.json(result);
}
