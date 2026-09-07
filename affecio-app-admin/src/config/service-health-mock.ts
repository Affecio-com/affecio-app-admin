import type { ServiceHealthSnapshot, ServiceStatus } from "@/types/service-health";

/** Placeholder snapshot — replace with API response when live monitoring is wired. */
export function getMockServiceHealthSnapshot(): ServiceHealthSnapshot {
  const now = new Date().toISOString();
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - 3);

  const formatMonth = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", year: "numeric" });

  return {
    overallStatus: "operational",
    headline: "We're fully operational",
    subheadline: "We're not aware of any issues affecting our systems.",
    lastUpdated: now,
    periodLabel: `${formatMonth(periodStart)} – ${formatMonth(new Date())}`,
    groups: [
      {
        id: "admin-api",
        name: "Admin API",
        uptimePercent: 99.94,
        components: [
          { id: "admin-rest", name: "Admin REST API", status: "operational" },
          { id: "admin-auth", name: "Authentication", status: "operational" },
          { id: "admin-ratelimit", name: "Rate limiting", status: "operational" },
          { id: "admin-audit", name: "Audit logging", status: "operational" },
        ],
      },
      {
        id: "mobile-api",
        name: "Mobile API",
        uptimePercent: 99.87,
        components: [
          { id: "user-service", name: "User service", status: "operational" },
          { id: "matching", name: "Matching engine", status: "operational" },
          { id: "calls", name: "Call sessions", status: "operational" },
          { id: "media", name: "Media uploads", status: "operational" },
          { id: "push", name: "Push notifications", status: "operational" },
        ],
      },
      {
        id: "data",
        name: "Data & infrastructure",
        uptimePercent: 100,
        components: [
          { id: "postgres", name: "PostgreSQL", status: "operational" },
          { id: "redis", name: "Redis cache", status: "operational" },
          { id: "prisma", name: "Prisma ORM", status: "operational" },
          { id: "workers", name: "Background workers", status: "operational" },
        ],
      },
      {
        id: "third-party",
        name: "Third-party services",
        uptimePercent: 99.99,
        components: [
          { id: "r2", name: "Cloudflare R2", status: "operational" },
          { id: "sentry", name: "Sentry", status: "operational" },
          { id: "agora", name: "Agora RTC", status: "operational" },
        ],
      },
    ],
  };
}

export function deriveOverallStatus(groups: ServiceHealthSnapshot["groups"]): ServiceStatus {
  const statuses = groups.flatMap((g) => g.components.map((c) => c.status));
  if (statuses.some((s) => s === "major_outage")) return "major_outage";
  if (statuses.some((s) => s === "partial_outage")) return "partial_outage";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  if (statuses.some((s) => s === "maintenance")) return "maintenance";
  return "operational";
}
