import { adminV1Client } from "@/config/api";
import type { AdminRole } from "@/types/admin";

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface CreateAdminInput {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}

export async function getAdminUsers(): Promise<AdminAccount[]> {
  const { data } = await adminV1Client.get<{ data: AdminAccount[] }>("/admin-users");
  return data.data;
}

export async function createAdminUser(input: CreateAdminInput): Promise<AdminAccount> {
  const { data } = await adminV1Client.post<{ data: AdminAccount }>("/admin-users", input);
  return data.data;
}
