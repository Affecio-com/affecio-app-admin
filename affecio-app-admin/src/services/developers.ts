import { adminV1Client } from "@/config/api";
import { getMockServiceHealthSnapshot } from "@/config/service-health-mock";
import type { AdminApiHealth, ServiceHealthSnapshot } from "@/types/service-health";

export async function getAdminApiHealth(): Promise<AdminApiHealth> {
  const { data } = await adminV1Client.get<{ data: AdminApiHealth }>("/developers/health");
  return data.data;
}

/** Returns placeholder platform status. Swap implementation when status API is ready. */
export async function getServiceHealthSnapshot(): Promise<ServiceHealthSnapshot> {
  const snapshot = getMockServiceHealthSnapshot();

  try {
    const adminHealth = await getAdminApiHealth();
    const adminGroup = snapshot.groups.find((g) => g.id === "admin-api");
    const restComponent = adminGroup?.components.find((c) => c.id === "admin-rest");
    if (restComponent && adminHealth.status === "ok") {
      restComponent.description = `Uptime ${formatUptime(adminHealth.uptime)} · Checked ${new Date(adminHealth.timestamp).toLocaleTimeString()}`;
    }
    snapshot.lastUpdated = adminHealth.timestamp;
  } catch {
    // Mock data only when API unreachable
  }

  return snapshot;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
