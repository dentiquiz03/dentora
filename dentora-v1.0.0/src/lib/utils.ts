import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number | null | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export function formatDuration(seconds: number | null | undefined) {
  const total = Math.max(0, seconds ?? 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins ? `${mins}m ${secs}s` : `${secs}s`;
}
