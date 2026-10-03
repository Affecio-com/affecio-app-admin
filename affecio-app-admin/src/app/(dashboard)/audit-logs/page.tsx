"use client";

import { AdminUserCell } from "@/components/admin/AdminUserCell";
import { DataListPage } from "@/components/layout/DataListPage";
import { formatDateTime } from "@/lib/format";
import { getAuditLogs } from "@/services/auditLogs";

export default function AuditLogsPage() {
  return (
    <DataListPage
      title="Audit logs"
      description="Immutable record of admin actions across the platform."
      queryKey="audit-logs"
      fetcher={({ page, pageSize }) => getAuditLogs({ page, pageSize })}
      searchPlaceholder="Search logs..."
      emptyTitle="No audit entries"
      emptyDescription="Admin actions will be logged here."
      columns={[
        {
          key: "action",
          header: "Action",
          cell: (log) => log.action,
        },
        {
          key: "admin",
          header: "Admin",
          cell: (log) =>
            log.admin ? (
              <AdminUserCell admin={log.admin} />
            ) : (
              <span className="font-mono text-xs text-affecio-muted">{log.adminId}</span>
            ),
        },
        {
          key: "target",
          header: "Target",
          cell: (log) => (
            <span className="text-sm">
              {log.targetType} · <span className="font-mono text-xs">{log.targetId}</span>
            </span>
          ),
        },
        {
          key: "created",
          header: "When",
          cell: (log) => formatDateTime(log.createdAt),
        },
      ]}
    />
  );
}
