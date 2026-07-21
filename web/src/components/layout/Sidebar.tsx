"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Leaf,
  ScanLine,
  Stethoscope,
  Map,
  FileText,
  Bot,
  Settings,
  Sprout,
} from "lucide-react";
import { AuthSlot } from "@/components/layout/AuthSlot";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cultivos", label: "Mis Cultivos", icon: Leaf },
  { href: "/escanear", label: "Escanear", icon: ScanLine },
  { href: "/diagnosticos", label: "Diagnósticos", icon: Stethoscope },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/reportes", label: "Reportes", icon: FileText },
  { href: "/asistente", label: "Asistente IA", icon: Bot },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-forest/10 bg-forest text-cream">
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf/30 ring-1 ring-leaf/40">
            <Sprout className="h-5 w-5 text-leaf-light" />
          </span>
          <div>
            <p className="font-display text-lg leading-tight tracking-tight">AgroGuardian</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-cream/60">AI</p>
          </div>
        </Link>
        <p className="mt-3 text-xs text-cream/55 leading-relaxed">Tu agrónomo inteligente 24/7</p>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-leaf text-white shadow-sm"
                  : "text-cream/75 hover:bg-white/5 hover:text-cream"
              )}
            >
              <Icon className="h-4 w-4 opacity-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 space-y-2 rounded-xl bg-white/5 p-3 text-xs text-cream/60 ring-1 ring-white/10">
        <AuthSlot />
        <p>Enfocado en sanidad vegetal · Manabí</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [
    NAV[0],
    NAV[1],
    NAV[2],
    NAV[3],
    NAV[6],
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-forest/10 bg-cream/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                  active ? "text-leaf" : "text-ink/45"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full",
                    active ? "bg-leaf/15" : ""
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.label.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
