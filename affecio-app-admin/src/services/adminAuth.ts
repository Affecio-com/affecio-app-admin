import { apiClient } from "@/config/api";
import type { AdminSession, AdminUser } from "@/types/admin";
import type { ApiResponse } from "@/types/api";

export type LoginResult = AdminSession | { requiresMfa: true; adminId: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiResponse<LoginResult>>("/admin/auth/login", {
    email,
    password,
  });
  return data.data;
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await apiClient.get<ApiResponse<AdminUser>>("/admin/auth/me");
  return data.data;
}

export async function verifyMfa(code: string, adminId: string): Promise<AdminSession> {
  const { data } = await apiClient.post<ApiResponse<AdminSession>>("/admin/auth/mfa", {
    code,
    adminId,
  });
  return data.data;
}
