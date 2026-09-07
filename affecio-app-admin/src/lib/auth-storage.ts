const ADMIN_TOKEN_KEY = "affecio_admin_token";

function setTokenCookie(token: string) {
  document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
}

function clearTokenCookie() {
  document.cookie = `${ADMIN_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  setTokenCookie(token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  clearTokenCookie();
}
