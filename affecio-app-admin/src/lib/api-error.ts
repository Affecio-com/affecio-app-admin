import axios from "axios";
import { resolveAdminApiBaseUrl } from "@/config/env";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (error.response?.status === 404) {
      return `API route not found at ${resolveAdminApiBaseUrl()}. Check NEXT_PUBLIC_ADMIN_API_URL and redeploy the admin API.`;
    }
    if (error.code === "ERR_NETWORK") {
      return `Cannot reach the admin API at ${resolveAdminApiBaseUrl()}. Check that the server is up and CORS allows this app.`;
    }
    if (error.response && error.response.status >= 500) {
      return `${fallback} (server error ${error.response.status}). Check the admin API logs.`;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
