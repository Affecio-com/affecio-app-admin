const ACCESS_KEY = "affecio_admin_token";
const REFRESH_KEY = "affecio_admin_refresh";
const SESSION_STARTED_KEY = "affecio_admin_session_started";
const SESSION_COOKIE = "affecio_admin_session";

function expireCookie(name: string) {
  if (typeof document === "undefined") return;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${name}=; path=/; expires=${expires}`;
  document.cookie = `${name}=; path=/; expires=${expires}; samesite=lax`;
  document.cookie = `${name}=; path=/; expires=${expires}; samesite=strict`;
}

function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${60 * 60 * 12}; samesite=strict`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getSessionStartedAt(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_STARTED_KEY);
}

export function ensureSessionCookie(): void {
  if (typeof document === "undefined") return;
  setSessionCookie();
}

export function setStoredToken(token: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore quota / private mode */
  }
  expireCookie(ACCESS_KEY);
  setSessionCookie();
  sessionStorage.setItem(ACCESS_KEY, token);
  if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
  if (!sessionStorage.getItem(SESSION_STARTED_KEY)) {
    sessionStorage.setItem(SESSION_STARTED_KEY, new Date().toISOString());
  }
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(SESSION_STARTED_KEY);
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
  expireCookie(ACCESS_KEY);
  expireCookie(SESSION_COOKIE);
}
