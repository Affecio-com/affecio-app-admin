import { apiClient, adminV1Client } from "@/config/api";
import type { ServiceHealthSnapshot, ServiceStatus } from "@/types/service-health";

export async function getServiceHealthSnapshot(): Promise<ServiceHealthSnapshot> {
  const { data } = await apiClient.get<{ data: ServiceHealthSnapshot }>("/status");
  return data.data;
}

export async function updateServiceComponent(
  componentId: string,
  input: { status: ServiceStatus; message: string },
): Promise<ServiceHealthSnapshot> {
  const { data } = await adminV1Client.patch<{ data: ServiceHealthSnapshot }>(
    `/developers/status/components/${componentId}`,
    input,
  );
  return data.data;
}
