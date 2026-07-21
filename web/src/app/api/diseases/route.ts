import { NextResponse } from "next/server";
import { DISEASE_CATALOG } from "@/lib/diseases";

export async function GET() {
  return NextResponse.json(DISEASE_CATALOG);
}
