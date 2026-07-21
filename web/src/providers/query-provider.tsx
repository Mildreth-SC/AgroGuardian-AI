"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const tree = (
    <QueryClientProvider client={client}>
      {children}
      <PwaRegister />
    </QueryClientProvider>
  );

  if (!clerkKey) return tree;

  return (
    <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/dashboard">
      {tree}
    </ClerkProvider>
  );
}
