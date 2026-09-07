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

export async function getAdminUsers(): Promise<AdminAccount[]> {
  const { data } = await adminV1Client.get<{ data: AdminAccount[] }>("/admin-users");
  return data.data;
}
