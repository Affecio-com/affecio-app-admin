export type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

export interface ServiceComponent {
  id: string;
  name: string;
  status: ServiceStatus;
  description?: string;
  updatedAt?: string;
}

export interface ServiceGroup {
  id: string;
  name: string;
  uptimePercent: number;
  components: ServiceComponent[];
}

export interface ServiceHealthEvent {
  id: string;
  componentId: string;
  status: ServiceStatus;
  message: string;
  createdAt: string;
  createdBy: string;
}

export interface ServiceHealthSnapshot {
  overallStatus: ServiceStatus;
  headline: string;
  subheadline: string;
  lastUpdated: string;
  periodLabel: string;
  groups: ServiceGroup[];
  events?: ServiceHealthEvent[];
}

export interface AdminApiHealth {
  status: string;
  uptime: number;
  timestamp: string;
}
