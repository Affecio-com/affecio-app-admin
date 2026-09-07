export type AdminRole =
  | "super_admin"
  | "admin"
  | "moderator"
  | "support"
  | "developer";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminSession {
  admin: AdminUser;
  accessToken: string;
}
