import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Clerk is optional. When keys are set, we still allow browsing the demo
 * without forcing login — SignIn/UserButton appear in the shell.
 */
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
