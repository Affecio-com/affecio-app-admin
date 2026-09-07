import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (error.response?.status === 404) {
      return "API route not found. Restart the admin API server (npm run dev in affecio-admin-api).";
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the admin API. Ensure it is running on port 4001.";
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
