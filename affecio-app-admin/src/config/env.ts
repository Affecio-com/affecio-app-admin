export const env = {
  apiUrl: process.env.NEXT_PUBLIC_ADMIN_API_URL ?? "http://localhost:4001/api",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Affecio Admin",
} as const;
