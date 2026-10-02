const LOCAL_ADMIN_API = "http://localhost:4001/api";

/**
 * Admin API base URL including the `/api` path segment (e.g. `/api` or `http://localhost:4001/api`).
 * - Browser on Vercel: defaults to same-origin `/api` (public rewrite to affecio-admin-api).
 * - Server on Vercel: uses ADMIN_API_URL service binding when present.
 */
export function resolveAdminApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();
  if (publicUrl) {
    return publicUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    const bound = process.env.ADMIN_API_URL?.trim();
    if (bound) {
      const root = bound.replace(/\/$/, "");
      return root.endsWith("/api") ? root : `${root}/api`;
    }
  }

  if (process.env.VERCEL === "1") {
    return "/api";
  }

  return LOCAL_ADMIN_API;
}

export const env = {
  get apiUrl() {
    return resolveAdminApiBaseUrl();
  },
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Affecio Admin",
} as const;
