"use client";

import { MobileNav, Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-mist">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 pb-24 lg:pb-8">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
