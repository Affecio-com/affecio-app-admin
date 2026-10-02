import { adminV1Client, apiClient } from "@/config/api";
import type { AdminRole } from "@/types/admin";

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface PendingAdminInvite {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string; email: string };
}

export interface InviteAdminInput {
  email: string;
  name: string;
  role: AdminRole;
}

export interface InviteAdminResult {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: string;
  createdAt: string;
  emailSent: boolean;
  emailError?: string;
  acceptUrl?: string;
}

export interface InvitePreview {
  email: string;
  name: string;
  role: AdminRole;
  expiresAt: string;
}

export async function getAdminUsers(): Promise<{
  admins: AdminAccount[];
  pendingInvites: PendingAdminInvite[];
}> {
  const { data } = await adminV1Client.get<{
    data: AdminAccount[];
    pendingInvites: PendingAdminInvite[];
  }>("/admin-users");
  return { admins: data.data, pendingInvites: data.pendingInvites ?? [] };
}

export async function inviteAdminUser(input: InviteAdminInput): Promise<InviteAdminResult> {
  const { data } = await adminV1Client.post<{ data: InviteAdminResult; message?: string }>(
    "/admin-users",
    input,
  );
  return data.data;
}

export async function resendAdminInvite(inviteId: string): Promise<InviteAdminResult> {
  const { data } = await adminV1Client.post<{ data: InviteAdminResult }>(`/admin-users/invites/${inviteId}/resend`);
  return data.data;
}

export async function revokeAdminInvite(inviteId: string): Promise<void> {
  await adminV1Client.delete(`/admin-users/invites/${inviteId}`);
}

export async function removeAdminUser(adminId: string): Promise<void> {
  await adminV1Client.delete(`/admin-users/${adminId}`);
}

export async function getAdminInvite(token: string): Promise<InvitePreview> {
  const { data } = await apiClient.get<{ data: InvitePreview }>(`/admin/auth/invite/${token}`);
  return data.data;
}

export async function acceptAdminInvite(token: string, password: string): Promise<void> {
  await apiClient.post("/admin/auth/invite/accept", { token, password });
}
