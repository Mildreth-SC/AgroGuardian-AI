"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function NotificacionesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getNotifications()
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const open = async (n: AppNotification) => {
    if (!n.read && !n.synthetic) {
      try {
        await markNotificationRead(n.id);
      } catch {
        /* optional */
      }
    }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.href) router.push(n.href);
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* optional */
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-up">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-leaf">Alertas</p>
          <h1 className="font-display text-3xl text-forest mt-1">Notificaciones</h1>
          <p className="text-sm text-ink/60 mt-1">
            Reportes listos, seguimientos pendientes y alertas de sanidad.
          </p>
        </div>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            onClick={() => void markAll()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-3 py-2 text-xs font-medium hover:bg-mist"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas
          </button>
        )}
      </header>

      {error && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {!error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-cream px-4 py-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-leaf/50" />
          <p className="text-sm text-ink/55 mt-3">Sin notificaciones por ahora.</p>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => void open(n)}
              className={cn(
                "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
                n.read
                  ? "border-forest/8 bg-white opacity-80"
                  : "border-leaf/25 bg-leaf/5 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-forest text-sm">{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-leaf shrink-0 mt-1.5" />}
              </div>
              {n.body && <p className="text-xs text-ink/60 mt-1">{n.body}</p>}
              <p className="text-[10px] text-ink/40 mt-2">
                {format(new Date(n.created_at), "PPp", { locale: es })}
                {n.synthetic ? " · seguimiento automático" : ""}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <Link href="/escanear" className="text-sm text-leaf font-medium hover:underline">
        Escanear planta →
      </Link>
    </div>
  );
}
