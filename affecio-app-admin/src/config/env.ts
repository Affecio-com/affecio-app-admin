const LOCAL_ADMIN_API = "http://localhost:4001/api";

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
 * Production browser always uses same-origin `/api` unless NEXT_PUBLIC points at a real remote API.
 */
export function resolveAdminApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();

  if (typeof window !== "undefined") {
    const onLocal = isLocalHost(window.location.hostname);
    if (onLocal) {
      return normalizeBaseUrl(configured ?? LOCAL_ADMIN_API);
    }
    if (configured && !isLocalApiUrl(configured)) {
      return normalizeBaseUrl(configured);
    }
    return "/api";
  }

  const bound = process.env.ADMIN_API_URL?.trim();
  if (bound) {
    const root = normalizeBaseUrl(bound);
    return root.endsWith("/api") ? root : `${root}/api`;
  }

  if (configured && !isLocalApiUrl(configured)) {
    return normalizeBaseUrl(configured);
  }

  if (process.env.VERCEL === "1") {
    return "/api";
  }

  return normalizeBaseUrl(configured ?? LOCAL_ADMIN_API);
}

export const env = {
  get apiUrl() {
    return resolveAdminApiBaseUrl();
  },
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Affecio Admin",
} as const;
