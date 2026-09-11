"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Send, Users } from "lucide-react";
import { useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { formatDateTime } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  createPushCampaign,
  getPushCampaigns,
  getPushStats,
  type PushAudience,
} from "@/services/pushNotifications";

const AUDIENCE_OPTIONS: { value: PushAudience; label: string; description: string }[] = [
  { value: "all", label: "All users", description: "Every registered app user" },
  { value: "new_users", label: "New users", description: "Signed up in the last 7 days" },
  { value: "active_users", label: "Active users", description: "Active in the last 30 days" },
];

function campaignStatusTone(status: string) {
  switch (status) {
    case "sent":
      return "success" as const;
    case "partial":
      return "warning" as const;
    case "failed":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

export default function PushNotificationsPage() {
  return (
    <RoleGate allowedRoles={["super_admin", "admin", "marketing"]}>
      <PushNotificationsContent />
    </RoleGate>
  );
}

function PushNotificationsContent() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "all" as PushAudience,
  });

  const statsQuery = useQuery({
    queryKey: ["push", "stats"],
    queryFn: getPushStats,
  });

  const campaignsQuery = useQuery({
    queryKey: ["push", "campaigns"],
    queryFn: () => getPushCampaigns({ page: 1, pageSize: 20 }),
  });

  const sendMutation = useMutation({
    mutationFn: createPushCampaign,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["push"] });
      setDialogOpen(false);
      setForm({ title: "", body: "", audience: "all" });
      setFormError("");
      setSuccessMessage(
        result.dryRun
          ? `${result.message} Target: ${result.campaign.targetCount} users.`
          : result.message,
      );
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err, "Failed to send campaign."));
    },
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    sendMutation.mutate(form);
  }

  return (
    <div>
      <PageHeader
        title="Push notifications"
        description="Send marketing promotions, product updates, and announcements to app users."
        action={
          <AffecioButton onClick={() => setDialogOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            New campaign
          </AffecioButton>
        }
      />

      {successMessage ? (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </div>
      ) : null}

      {statsQuery.data ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AffecioStatCard
            label="Total app users"
            value={statsQuery.data.totalUsers.toLocaleString()}
            icon={Users}
          />
          <AffecioStatCard
            label="Device tokens"
            value={statsQuery.data.totalTokens.toLocaleString()}
            icon={Bell}
            hint="Users with push enabled"
          />
          <AffecioStatCard
            label="Reachable users"
            value={statsQuery.data.reachableUsers.toLocaleString()}
            icon={Send}
          />
          <AffecioStatCard
            label="Campaigns sent"
            value={statsQuery.data.campaignsSent.toLocaleString()}
            icon={Bell}
          />
        </div>
      ) : null}

      <AffecioCard className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-affecio-text">How it works</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-affecio-muted">
          <li>Compose a title and message, then choose your audience segment.</li>
          <li>Notifications are delivered via Firebase Cloud Messaging when device tokens are registered.</li>
          <li>Set <code className="text-affecio-text">FCM_SERVER_KEY</code> in the admin API env to enable live delivery.</li>
          <li>Without FCM configured, campaigns are recorded in dry-run mode for testing.</li>
        </ul>
      </AffecioCard>

      <ContentPanel tabs={["Campaign history"]} showToolbar={false} showPagination={false}>
        {campaignsQuery.isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : campaignsQuery.isError ? (
          <div className="p-5">
            <ApiErrorMessage message="Failed to load campaigns." />
          </div>
        ) : !campaignsQuery.data?.data.length ? (
          <EmptyState
            title="No campaigns yet"
            description="Create your first push notification campaign to reach app users."
          />
        ) : (
          <DataTable
            data={campaignsQuery.data.data}
            columns={[
              { key: "title", header: "Title", cell: (c) => c.title },
              {
                key: "audience",
                header: "Audience",
                cell: (c) => <StatusPill label={c.audience.replace(/_/g, " ")} tone="muted" />,
              },
              {
                key: "status",
                header: "Status",
                cell: (c) => <StatusPill label={c.status} tone={campaignStatusTone(c.status)} />,
              },
              {
                key: "delivery",
                header: "Delivery",
                cell: (c) => `${c.sentCount} sent · ${c.failedCount} failed · ${c.targetCount} targeted`,
              },
              {
                key: "by",
                header: "Sent by",
                cell: (c) => c.createdBy.name,
              },
              {
                key: "when",
                header: "Created",
                cell: (c) => formatDateTime(c.createdAt),
              },
            ]}
          />
        )}
      </ContentPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New push campaign</DialogTitle>
            <DialogDescription>
              Send a promotional or update notification to app users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-affecio-muted">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Summer promo — 50% off Premium"
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-affecio-muted">Message</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Tap to see what's new in Affecio this week…"
                maxLength={500}
                rows={4}
                className="w-full rounded-md border border-affecio-border bg-affecio-input px-3 py-2 text-sm text-affecio-text placeholder:text-affecio-muted focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-affecio-muted">Audience</label>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-affecio-border p-3 transition-colors hover:bg-affecio-input"
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={form.audience === opt.value}
                      onChange={() => setForm((f) => ({ ...f, audience: opt.value }))}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-affecio-text">{opt.label}</p>
                      <p className="text-xs text-affecio-muted">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {formError ? <ApiErrorMessage message={formError} /> : null}
            <DialogFooter>
              <AffecioButton type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
                Cancel
              </AffecioButton>
              <AffecioButton type="submit" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? "Sending…" : "Send notification"}
              </AffecioButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
