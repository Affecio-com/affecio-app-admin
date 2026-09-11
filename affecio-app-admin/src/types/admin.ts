export type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "developer"
  | "marketing";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface AdminSession {
  admin: AdminUser;
  accessToken: string;
  refreshToken?: string;
}
