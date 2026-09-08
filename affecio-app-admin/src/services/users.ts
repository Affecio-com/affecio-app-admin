import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type {
  AppUser,
  AppUserDetail,
  CreateAppUserInput,
  UpdateAppUserInput,
} from "@/types/user";

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  accountStatus?: string;
  activityStatus?: string;
  hasOpenReports?: boolean;
}): Promise<PaginatedResponse<AppUser>> {
  const { data } = await adminV1Client.get<PaginatedResponse<AppUser>>("/users", { params });
  return data;
}

export async function getUser(id: string): Promise<AppUserDetail> {
  const { data } = await adminV1Client.get<{ data: AppUserDetail }>(`/users/${id}`);
  return data.data;
}

export async function createUser(input: CreateAppUserInput): Promise<AppUser> {
  const { data } = await adminV1Client.post<{ data: AppUser }>("/users", input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateAppUserInput): Promise<AppUserDetail> {
  const { data } = await adminV1Client.patch<{ data: AppUserDetail }>(`/users/${id}`, input);
  return data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await adminV1Client.delete(`/users/${id}`);
}
