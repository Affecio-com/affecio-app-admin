import axios, { type AxiosInstance } from "axios";
import { env } from "@/config/env";
import { getStoredToken } from "@/lib/auth-storage";

export const ADMIN_API_BASE_URL = env.apiUrl;

export function createAdminApiClient(prefix = ""): AxiosInstance {
  const client = axios.create({
    baseURL: `${ADMIN_API_BASE_URL}${prefix}`,
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
    (error) => {
      if (error.response?.status === 401 && typeof window !== "undefined") {
        const path = window.location.pathname;
        if (!path.startsWith("/login") && !path.startsWith("/mfa")) {
          window.location.href = "/login";
        }
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
