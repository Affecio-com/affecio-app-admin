"use client";

import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/types/report";

interface ReportsTableProps {
  reports: Report[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
  return (
    <DataTable
      data={reports}
      columns={[
        {
          key: "id",
          header: "Report",
          cell: (report) => (
            <Link href={`/reports/${report.id}`} className="font-medium hover:underline">
              {report.id.slice(0, 8)}
            </Link>
          ),
        },
        { key: "type", header: "Type", cell: (report) => report.type },
        {
          key: "status",
          header: "Status",
          cell: (report) => <Badge variant="secondary">{report.status}</Badge>,
        },
        {
          key: "created",
          header: "Created",
          cell: (report) => new Date(report.createdAt).toLocaleDateString(),
        },
      ]}
    />
  );
}
