export type UserStatus = "active" | "suspended" | "banned" | "pending";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  verified: boolean;
  createdAt: string;
  lastActiveAt?: string;
}
