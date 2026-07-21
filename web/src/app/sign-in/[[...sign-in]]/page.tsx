import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="grid min-h-dvh place-items-center bg-mist px-4">
        <p className="max-w-md text-center text-sm text-ink/70">
          Clerk no está configurado. Agrega <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> en{" "}
          <code>web/.env.local</code> para habilitar autenticación.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-4">
      <SignIn />
    </div>
  );
}
