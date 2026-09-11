"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { SUPPORT_PLAYBOOK } from "@/config/support-playbook";

const SLA_ROWS = [
  { priority: "Urgent", window: "1 hour", examples: "Active harassment, account takeover, underage report" },
  { priority: "High", window: "4 hours", examples: "Can’t log in, payment failed, verification stuck" },
  { priority: "Medium", window: "24 hours", examples: "Matching, profile, how-to" },
  { priority: "Low", window: "48 hours", examples: "Feedback and feature requests" },
];

export default function SupportPlaybookPage() {
  return (
    <RoleGate allowedRoles={["super_admin", "admin", "support"]}>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Support playbook"
          description="Operating manual for Affecio customer support: complaints, live chat, SLAs, and when to escalate."
          action={
            <Link href="/support" className="text-sm text-affecio-muted hover:text-affecio-text">
              ← Inbox
            </Link>
          }
        />
        <AffecioCard className="mb-4">
          <h2 className="text-base font-semibold tracking-tight">First-response SLA</h2>
          <p className="mt-1 text-sm text-affecio-muted">
            Clock starts when the ticket is created. If you will miss it, tell the member and leave an internal note.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-affecio-border text-xs uppercase tracking-wide text-affecio-muted">
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 pr-4 font-medium">First reply</th>
                  <th className="pb-2 font-medium">Typical cases</th>
                </tr>
              </thead>
              <tbody>
                {SLA_ROWS.map((row) => (
                  <tr key={row.priority} className="border-b border-affecio-border last:border-0">
                    <td className="py-2 pr-4 font-medium">{row.priority}</td>
                    <td className="py-2 pr-4">{row.window}</td>
                    <td className="py-2 text-affecio-muted">{row.examples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AffecioCard>
        <div className="space-y-4">
          {SUPPORT_PLAYBOOK.map((section) => (
            <AffecioCard key={section.title}>
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-4 w-4 text-affecio-muted" />
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{section.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-affecio-muted">{section.body}</p>
                </div>
              </div>
            </AffecioCard>
          ))}
        </div>
      </div>
    </RoleGate>
  );
}
