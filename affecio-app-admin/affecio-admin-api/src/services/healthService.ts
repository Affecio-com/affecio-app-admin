import type { ServiceHealthStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const SEED: Array<{
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  sortOrder: number;
}> = [
  { id: "admin-rest", groupId: "admin-api", groupName: "Admin API", name: "Admin REST API", sortOrder: 0 },
  { id: "admin-auth", groupId: "admin-api", groupName: "Admin API", name: "Authentication", sortOrder: 1 },
  { id: "admin-ratelimit", groupId: "admin-api", groupName: "Admin API", name: "Rate limiting", sortOrder: 2 },
  { id: "admin-audit", groupId: "admin-api", groupName: "Admin API", name: "Audit logging", sortOrder: 3 },
  { id: "user-service", groupId: "mobile-api", groupName: "Mobile API", name: "User service", sortOrder: 4 },
  { id: "matching", groupId: "mobile-api", groupName: "Mobile API", name: "Matching engine", sortOrder: 5 },
  { id: "calls", groupId: "mobile-api", groupName: "Mobile API", name: "Call sessions", sortOrder: 6 },
  { id: "media", groupId: "mobile-api", groupName: "Mobile API", name: "Media uploads", sortOrder: 7 },
  { id: "push", groupId: "mobile-api", groupName: "Mobile API", name: "Push notifications", sortOrder: 8 },
  { id: "postgres", groupId: "data", groupName: "Data & infrastructure", name: "PostgreSQL", sortOrder: 9 },
  { id: "redis", groupId: "data", groupName: "Data & infrastructure", name: "Redis cache", sortOrder: 10 },
  { id: "prisma", groupId: "data", groupName: "Data & infrastructure", name: "Prisma ORM", sortOrder: 11 },
  { id: "workers", groupId: "data", groupName: "Data & infrastructure", name: "Background workers", sortOrder: 12 },
  { id: "r2", groupId: "third-party", groupName: "Third-party services", name: "Cloudflare R2", sortOrder: 13 },
  { id: "sentry", groupId: "third-party", groupName: "Third-party services", name: "Sentry", sortOrder: 14 },
  { id: "agora", groupId: "third-party", groupName: "Third-party services", name: "Agora RTC", sortOrder: 15 },
];

const HEADLINES: Record<ServiceHealthStatus, { headline: string; subheadline: string }> = {
  operational: {
    headline: "We're fully operational",
    subheadline: "We're not aware of any issues affecting Affecio systems.",
  },
  degraded: {
    headline: "Degraded performance",
    subheadline: "Some systems are slower than usual. We're investigating.",
  },
  partial_outage: {
    headline: "Partial outage",
    subheadline: "Some features are unavailable. Engineering is on it.",
  },
  major_outage: {
    headline: "Major outage",
    subheadline: "We're experiencing a significant disruption. Updates will post here.",
  },
  maintenance: {
    headline: "Scheduled maintenance",
    subheadline: "Some systems are offline for planned work.",
  },
};

function overallStatus(statuses: ServiceHealthStatus[]): ServiceHealthStatus {
  if (statuses.some((s) => s === "major_outage")) return "major_outage";
  if (statuses.some((s) => s === "partial_outage")) return "partial_outage";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  if (statuses.some((s) => s === "maintenance")) return "maintenance";
  return "operational";
}

function uptimeFor(status: ServiceHealthStatus) {
  switch (status) {
    case "operational":
      return 100;
    case "maintenance":
      return 99.5;
    case "degraded":
      return 98.2;
    case "partial_outage":
      return 94.1;
    case "major_outage":
      return 81.0;
    default:
      return 100;
  }
}

async function ensureSeeded() {
  const count = await prisma.serviceHealthComponent.count();
  if (count > 0) return;
  await prisma.serviceHealthComponent.createMany({
    data: SEED.map((item) => ({ ...item, status: "operational" as const })),
  });
}

export async function getPublicStatusSnapshot() {
  await ensureSeeded();
  const components = await prisma.serviceHealthComponent.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const events = await prisma.serviceHealthEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { createdBy: { select: { name: true, role: true } } },
  });

  const groupsMap = new Map<
    string,
    { id: string; name: string; components: typeof components }
  >();
  for (const component of components) {
    const group = groupsMap.get(component.groupId) ?? {
      id: component.groupId,
      name: component.groupName,
      components: [],
    };
    group.components.push(component);
    groupsMap.set(component.groupId, group);
  }

  const groups = [...groupsMap.values()].map((group) => {
    const avg =
      group.components.reduce((sum, c) => sum + uptimeFor(c.status), 0) / Math.max(group.components.length, 1);
    return {
      id: group.id,
      name: group.name,
      uptimePercent: Math.round(avg * 100) / 100,
      components: group.components.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        description: c.description ?? undefined,
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  });

  const overall = overallStatus(components.map((c) => c.status));
  const copy = HEADLINES[overall];
  const latest = components.reduce(
    (max, c) => (c.updatedAt > max ? c.updatedAt : max),
    new Date(0),
  );

  return {
    overallStatus: overall,
    headline: copy.headline,
    subheadline: copy.subheadline,
    lastUpdated: latest.toISOString(),
    periodLabel: "Live status",
    groups,
    events: events.map((e) => ({
      id: e.id,
      componentId: e.componentId,
      status: e.status,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
      createdBy: e.createdBy?.name ?? "System",
    })),
  };
}

export async function updateComponentStatus(input: {
  componentId: string;
  status: ServiceHealthStatus;
  message: string;
  adminId: string;
}) {
  await ensureSeeded();
  const component = await prisma.serviceHealthComponent.findUnique({
    where: { id: input.componentId },
  });
  if (!component) return null;

  await prisma.serviceHealthComponent.update({
    where: { id: input.componentId },
    data: {
      status: input.status,
      description: input.message,
    },
  });

  await prisma.serviceHealthEvent.create({
    data: {
      componentId: input.componentId,
      status: input.status,
      message: input.message,
      createdById: input.adminId,
    },
  });

  return getPublicStatusSnapshot();
}
