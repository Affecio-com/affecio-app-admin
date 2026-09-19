import type { ReportContext, ReportStatus, ReportType } from "@prisma/client";

export type ReportDbRow = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  context: ReportContext;
  callSessionId: string | null;
  status: ReportStatus;
  type: ReportType;
  createdAt: Date;
  updatedAt: Date;
};

export function reportContextToType(context: ReportContext): ReportType {
  switch (context) {
    case "PROFILE":
      return "profile";
    case "VIDEO_CALL":
      return "user";
    default:
      return "user";
  }
}

export function resolveReportType(row: {
  type?: ReportType | null;
  context?: ReportContext;
}): ReportType {
  if (row.type) return row.type;
  return reportContextToType(row.context ?? "OTHER");
}

/** API JSON keeps legacy field names (`targetId`) for the admin UI. */
export function toReportApiShape(row: ReportDbRow) {
  return {
    id: row.id,
    type: resolveReportType(row),
    status: row.status,
    reporterId: row.reporterId,
    targetId: row.reportedId,
    reason: row.reason,
    context: row.context,
    callSessionId: row.callSessionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toUserReportItem(
  row: ReportDbRow,
  role: "target" | "filed",
  people: Map<string, unknown>,
) {
  const base = {
    id: row.id,
    type: resolveReportType(row),
    status: row.status,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
  if (role === "target") {
    return {
      ...base,
      reporterId: row.reporterId,
      reporter: people.get(row.reporterId) ?? null,
    };
  }
  return {
    ...base,
    targetId: row.reportedId,
    target: people.get(row.reportedId) ?? null,
  };
}
