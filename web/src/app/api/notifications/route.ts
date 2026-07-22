import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/server/auth";
import { getConfig } from "@/lib/server/config";
import { getCaseStore, isDbMissingError } from "@/lib/server/demo-data";
import {
  buildFollowUpNotifications,
  getAdminClient,
  listDetections,
  listNotifications,
  markAllNotificationsRead,
} from "@/lib/server/supabase-admin";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const memoryCases = [...getCaseStore().values()];
  const cfg = getConfig();
  const client = getAdminClient(cfg);

  if (!client) {
    const items = buildFollowUpNotifications(memoryCases);
    return NextResponse.json({ items, unread: items.length, mode: "demo" });
  }

  try {
    const [stored, dbCases] = await Promise.all([
      listNotifications(client, userId),
      listDetections(client, userId),
    ]);
    const cases = dbCases.length ? dbCases : memoryCases;
    const followUps = buildFollowUpNotifications(cases);
    const items = [...followUps, ...stored].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const unread = items.filter((n) => !n.read).length;
    return NextResponse.json({ items, unread, mode: "supabase" });
  } catch (e) {
    if (isDbMissingError(e)) {
      const items = buildFollowUpNotifications(memoryCases);
      return NextResponse.json({ items, unread: items.length, mode: "demo-fallback" });
    }
    const items = buildFollowUpNotifications(memoryCases);
    return NextResponse.json({ items, unread: items.length, mode: "fallback" });
  }
}

export async function PATCH() {
  const { userId, error } = await requireUserId();
  if (error || !userId) return error!;

  const cfg = getConfig();
  const client = getAdminClient(cfg);
  if (!client) return NextResponse.json({ ok: true, mode: "demo" });

  try {
    await markAllNotificationsRead(client, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isDbMissingError(e)) return NextResponse.json({ ok: true, mode: "demo-fallback" });
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
