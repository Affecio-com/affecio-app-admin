import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { resolveAdminApiBaseUrl } from "@/config/env";
import { clearStoredToken, getStoredRefreshToken, getStoredToken, setStoredToken } from "@/lib/auth-storage";

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return Promise.resolve(null);
  refreshInFlight ??= axios
    .post<{ data: { accessToken: string } }>(`${resolveAdminApiBaseUrl()}/admin/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      setStoredToken(data.data.accessToken, refreshToken);
      return data.data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export function createAdminApiClient(prefix = ""): AxiosInstance {
  const client = axios.create({
    baseURL: `${resolveAdminApiBaseUrl()}${prefix}`,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status !== 401 || typeof window === "undefined") {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      const isAuthPage = ["/login", "/mfa", "/invite"].some((p) => path.startsWith(p));
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

      if (!isAuthPage && original && !original._retried && getStoredToken()) {
        original._retried = true;
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        }
      }

      if (!isAuthPage) {
        clearStoredToken();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/** Default client — auth at /admin/auth, v1 resources at /admin/v1 */
export const apiClient = createAdminApiClient();

/** v1-only client for resource endpoints */
export const adminV1Client = createAdminApiClient("/admin/v1");
