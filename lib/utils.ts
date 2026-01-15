import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes an image URL to prevent duplicate base URLs.
 * - If URL is already absolute (starts with http:// or https://), returns as-is
 * - If URL is relative, prepends the API base URL
 * - Returns null for empty/null/undefined inputs
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Already an absolute URL - return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative URL - prepend the API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://armapi.qubyt.codes";

  // Remove /api/v1 suffix if present (we want the base domain for images)
  const imageBaseUrl = baseUrl.replace(/\/api\/v\d+$/, "");

  // Ensure proper path joining (handle leading slash)
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${imageBaseUrl}${normalizedPath}`;
}
