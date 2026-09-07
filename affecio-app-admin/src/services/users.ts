import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { AppUser, AppUserDetail } from "@/types/user";

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<AppUser>> {
  const { data } = await adminV1Client.get<PaginatedResponse<AppUser>>("/users", { params });
  return data;
}

export async function getUser(id: string): Promise<AppUserDetail> {
  const { data } = await adminV1Client.get<{ data: AppUserDetail }>(`/users/${id}`);
  return data.data;
}
