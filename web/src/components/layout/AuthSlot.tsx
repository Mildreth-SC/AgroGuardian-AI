"use client";

import dynamic from "next/dynamic";

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const ClerkAuth = dynamic(() => import("./ClerkAuth"), { ssr: false });

export function AuthSlot() {
  if (!hasClerk) {
    return <p className="text-[11px] text-cream/45">Demo local · auth opcional</p>;
  }
  return <ClerkAuth />;
}
