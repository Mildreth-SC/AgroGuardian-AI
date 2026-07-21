import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Providers } from "@/providers/query-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgroGuardian AI — Tu agrónomo inteligente",
  description:
    "Detección temprana de plagas y sanidad vegetal para agricultores de Manabí. Foto → diagnóstico → recomendaciones.",
  applicationName: "AgroGuardian AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1B4332",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
