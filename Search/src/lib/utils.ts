import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge"; // ✅ Correct package

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
