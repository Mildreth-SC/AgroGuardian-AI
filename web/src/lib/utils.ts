import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function riskColor(level: string) {
  const n = level.toLowerCase();
  if (n.includes("critico") || n.includes("alto")) return "text-red-700 bg-red-50 border-red-200";
  if (n.includes("medio")) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-emerald-800 bg-emerald-50 border-emerald-200";
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
