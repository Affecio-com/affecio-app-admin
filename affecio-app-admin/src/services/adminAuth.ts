import { apiClient } from "@/config/api";
import type { AdminSession, AdminUser } from "@/types/admin";
import type { ApiResponse } from "@/types/api";

export type LoginResult = AdminSession | { requiresMfa: true; mfaToken: string };

export interface MfaStatus {
  enabled: boolean;
  pending: boolean;
}

export interface MfaSetupPayload {
  secret: string;
  otpauthUrl: string;
}

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

export async function updateProfile(name: string): Promise<AdminUser> {
  const { data } = await apiClient.patch<ApiResponse<AdminUser>>("/admin/auth/me", { name });
  return data.data;
}

export async function uploadAdminPhoto(input: {
  contentType: string;
  dataBase64: string;
}): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiResponse<AdminUser>>("/admin/auth/me/photo", input);
  return data.data;
}

export async function removeAdminPhoto(): Promise<AdminUser> {
  const { data } = await apiClient.delete<ApiResponse<AdminUser>>("/admin/auth/me/photo");
  return data.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post("/admin/auth/change-password", { currentPassword, newPassword });
}

export async function verifyMfa(code: string, mfaToken: string): Promise<AdminSession> {
  const { data } = await apiClient.post<ApiResponse<AdminSession>>("/admin/auth/mfa", {
    code,
    mfaToken,
  });
  return data.data;
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const { data } = await apiClient.get<ApiResponse<MfaStatus>>("/admin/auth/mfa/status");
  return data.data;
}

export async function setupMfa(): Promise<MfaSetupPayload> {
  const { data } = await apiClient.post<ApiResponse<MfaSetupPayload>>("/admin/auth/mfa/setup");
  return data.data;
}

export async function enableMfa(code: string): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiResponse<AdminUser>>("/admin/auth/mfa/enable", { code });
  return data.data;
}

export async function disableMfa(password: string, code: string): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiResponse<AdminUser>>("/admin/auth/mfa/disable", {
    password,
    code,
  });
  return data.data;
}

export async function cancelMfaSetup(): Promise<void> {
  await apiClient.post("/admin/auth/mfa/cancel-setup");
}

export async function logout(): Promise<void> {
  await apiClient.post("/admin/auth/logout");
}
