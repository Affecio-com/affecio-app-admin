import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { signAdminToken } from "../src/lib/jwt";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4011/api";

async function main() {
  const admin = await prisma.adminUser.findFirst({
    where: { role: "super_admin" },
    select: { id: true, email: true, role: true, tokenVersion: true },
  });
  if (!admin) throw new Error("No super_admin found");

  const token = signAdminToken({ sub: admin.id, email: admin.email, role: admin.role, tv: admin.tokenVersion } as never);
  const headers = { Authorization: `Bearer ${token}` };

  const get = async (path: string) => {
    const res = await fetch(`${BASE}${path}`, { headers });
    const body = await res.text();
    let parsed: unknown = body;
    try {
      parsed = JSON.parse(body);
    } catch {
      /* not json */
    }
    return { status: res.status, body: parsed as Record<string, unknown> };
  };

  const paths = [
    "/admin/auth/me",
    "/admin/auth/mfa/status",
    "/status",
    "/admin/v1/admin-users",
    "/admin/v1/users?page=1&pageSize=5",
    "/admin/v1/users?page=abc&pageSize=-1",
    "/admin/v1/users?search=a",
    "/admin/v1/verifications?page=1&pageSize=5",
    "/admin/v1/reports?page=1&pageSize=5",
    "/admin/v1/reports?status=open",
    "/admin/v1/moderation?page=1&pageSize=5",
    "/admin/v1/matches?page=1&pageSize=5",
    "/admin/v1/calls?page=1&pageSize=5",
    "/admin/v1/blocks?page=1&pageSize=5",
    "/admin/v1/metrics/summary",
    "/admin/v1/metrics/overview",
    "/admin/v1/metrics/analytics",
    "/admin/v1/audit-logs?page=1&pageSize=5",
    "/admin/v1/support/stats",
    "/admin/v1/support/tickets?page=1&pageSize=5",
    "/admin/v1/support/escalations?page=1&pageSize=5",
    "/admin/v1/push/stats",
    "/admin/v1/push/campaigns?page=1&pageSize=5",
    "/admin/v1/developers/health",
    "/admin/v1/developers/feature-flags",
    "/admin/v1/developers/logs",
    "/admin/v1/users/not-a-real-id",
    "/admin/v1/reports/not-a-real-id",
    "/admin/v1/verifications/not-a-real-id",
    "/admin/v1/support/tickets/not-a-real-id",
    "/admin/auth/invite/not-a-real-token",
  ];

  const results: Record<string, unknown> = {};
  for (const p of paths) {
    const r = await get(p);
    const items = Array.isArray(r.body?.data) ? (r.body.data as { id?: string }[]) : null;
    results[p] = {
      status: r.status,
      keys: r.body && typeof r.body === "object" ? Object.keys(r.body) : typeof r.body,
      count: items?.length,
      message: r.status >= 400 ? r.body?.message ?? r.body : undefined,
    };
    if (items?.[0]?.id && /^\/admin\/v1\/(users|reports|verifications|support\/tickets)\?page=1/.test(p)) {
      const base = p.split("?")[0];
      const d = await get(`${base}/${items[0].id}`);
      results[`${base}/:id`] = { status: d.status, message: d.status >= 400 ? d.body?.message : undefined };
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
