"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";

export default function ClerkAuth() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button
          type="button"
          className="rounded-lg bg-leaf/40 px-2.5 py-1.5 text-xs text-cream hover:bg-leaf/60"
        >
          Entrar
        </button>
      </SignInButton>
      <Link href="/sign-up" className="text-[11px] text-cream/55 hover:text-cream">
        Registro
      </Link>
    </div>
  );
}
