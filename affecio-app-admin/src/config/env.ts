const LOCAL_ADMIN_API = "http://localhost:4001/api";
const PRODUCTION_ADMIN_API = "https://affecio-app-admin.onrender.com/api";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isLocalApiUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

/**
 * Admin API base URL including the `/api` path segment.
 * - Local UI (localhost): NEXT_PUBLIC_ADMIN_API_URL or http://localhost:4001/api
 * - Deployed UI (Vercel): NEXT_PUBLIC_ADMIN_API_URL or the Render API URL.
 *   A localhost value is ignored on deployed hosts so a stale build can't point at a dev machine.
 */
export function resolveAdminApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();

  const onLocalHost =
    typeof window !== "undefined"
      ? isLocalHost(window.location.hostname)
      : process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production";

  if (onLocalHost) {
    return normalizeBaseUrl(configured ?? LOCAL_ADMIN_API);
  }

  if (configured && !isLocalApiUrl(configured)) {
    return normalizeBaseUrl(configured);
  }

  return PRODUCTION_ADMIN_API;
}

export const env = {
  get apiUrl() {
    return resolveAdminApiBaseUrl();
  },
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Affecio Admin",
} as const;
