"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppUserCell } from "@/components/users/AppUserCell";
import { AffecioCard } from "@/components/affecio/AffecioCard";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { DataTable } from "@/components/shared/DataTable";
import { StatusPill, callStatusTone, accountStatusTone, activityStatusTone, reportStatusTone, verificationStatusTone } from "@/components/shared/StatusPill";
import type { AppUserDetail, UserMediaItem } from "@/types/user";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Ban, Flag, Heart, ImageIcon, Phone, Repeat, Shield, UserCheck } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { enforceRoles, hasRole } from "@/config/access";
import { setUserMediaHidden } from "@/services/users";

function DetailField({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1 border-b border-affecio-border py-3 sm:grid-cols-3 sm:gap-4", className)}>
      <dt className="text-sm text-affecio-muted">{label}</dt>
      <dd
        className={cn(
          "text-sm text-affecio-text sm:col-span-2 sm:text-right",
          mono && "break-all font-mono text-xs",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <AffecioCard>
      <h2 className="text-base font-semibold tracking-tight text-affecio-text">{title}</h2>
      {description ? <p className="mt-1 text-sm text-affecio-muted">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </AffecioCard>
  );
}

function UserLink({ user }: { user: { id: string; name: string; profilePhotoUrl?: string | null } }) {
  return <AppUserCell user={user} />;
}

function formatLocation(location: unknown): string {
  if (!location) return "—";
  if (typeof location === "string") return location;
  try {
    return JSON.stringify(location, null, 2);
  } catch {
    return String(location);
  }
}

function formatList(values: string[] | null | undefined): string {
  if (!values?.length) return "—";
  return values.join(", ");
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

interface UserDetailViewProps {
  user: AppUserDetail;
}

function MediaHideButton({ userId, item }: { userId: string; item: UserMediaItem }) {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const canHide = hasRole(admin?.role, enforceRoles);
  const hidden = item.status === "HIDDEN";

  const mutation = useMutation({
    mutationFn: () => setUserMediaHidden(userId, item.id, !hidden),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["user", userId], updated);
    },
  });

  if (!canHide || item.status === "PENDING") return null;

  return (
    <AffecioButton
      variant="secondary"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {hidden ? "Restore to profile" : "Hide from profile"}
    </AffecioButton>
  );
}

export function UserDetailView({ user }: UserDetailViewProps) {
  const age = Math.floor(
    (Date.now() - new Date(user.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AffecioStatCard label="Profile complete" value={`${user.profileCompleteness}%`} icon={UserCheck} />
        <AffecioStatCard label="Open reports" value={user.reportsSummary.openAsTarget} icon={Flag} />
        <AffecioStatCard label="Matches" value={user.stats.matchesCount} icon={Heart} />
        <AffecioStatCard label="Media" value={user.stats.mediaCount} icon={ImageIcon} />
      </div>

      <DetailSection title="Account & moderation">
        <dl>
          <DetailField
            label="Account status"
            value={<StatusPill label={user.accountStatus} tone={accountStatusTone(user.accountStatus)} />}
          />
          <DetailField
            label="Activity status"
            value={
              <StatusPill label={user.activityStatus} tone={activityStatusTone(user.activityStatus)} />
            }
          />
          <DetailField
            label="Verification"
            value={
              <StatusPill
                label={user.verificationStatus}
                tone={verificationStatusTone(user.verificationStatus)}
              />
            }
          />
          <DetailField label="Status reason" value={user.statusReason} />
          <DetailField label="Admin notes" value={user.adminNotes} />
          <DetailField
            label="Status changed"
            value={user.statusChangedAt ? formatDateTime(user.statusChangedAt) : "—"}
          />
          <DetailField label="Last app activity" value={formatDateTime(user.updatedAt)} />
          <DetailField
            label="Push devices"
            value={user.pushTokens.length ? `${user.pushTokens.length} registered` : "None"}
          />
        </dl>
      </DetailSection>

      <DetailSection
        title="Case history"
        description="Trust & Safety and support actions on this account."
      >
        {(user.caseHistory ?? []).length === 0 ? (
          <p className="text-sm text-affecio-muted">No enforcement actions or case notes yet.</p>
        ) : (
          <DataTable
            data={user.caseHistory ?? []}
            columns={[
              {
                key: "action",
                header: "Action",
                cell: (item) => <StatusPill label={item.action} />,
              },
              {
                key: "reason",
                header: "Reason",
                cell: (item) => item.reason ?? "—",
              },
              {
                key: "admin",
                header: "By",
                cell: (item) => `${item.admin.name} · ${item.admin.role.replace(/_/g, " ")}`,
              },
              {
                key: "when",
                header: "When",
                cell: (item) => formatDateTime(item.createdAt),
              },
            ]}
          />
        )}
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection title="Report summary">
          <dl>
            <DetailField label="Reports against user" value={user.reportsSummary.totalAsTarget} />
            <DetailField label="Open reports" value={user.reportsSummary.openAsTarget} />
            <DetailField label="Reports filed by user" value={user.reportsSummary.filedByUser} />
          </dl>
        </DetailSection>

        <DetailSection title="Media & verification summary">
          <dl>
            <DetailField label="Total media" value={user.mediaSummary.total} />
            <DetailField label="Confirmed / pending" value={`${user.mediaSummary.confirmed} / ${user.mediaSummary.pending}`} />
            <DetailField label="Profile photo" value={user.mediaSummary.hasProfilePhoto ? "Yes" : "No"} />
            <DetailField label="Intro video" value={user.mediaSummary.hasIntroVideo ? "Yes" : "No"} />
            <DetailField label="ID verified" value={user.mediaSummary.isVerified ? "Yes" : "No"} />
          </dl>
        </DetailSection>
      </div>

      <DetailSection
        title="Reports against this user"
        description={`${user.reportsAsTarget.length} report(s) on record.`}
      >
        {user.reportsAsTarget.length === 0 ? (
          <p className="text-sm text-affecio-muted">No reports filed against this user.</p>
        ) : (
          <DataTable
            data={user.reportsAsTarget}
            columns={[
              { key: "type", header: "Type", cell: (r) => <StatusPill label={r.type} tone="muted" /> },
              {
                key: "status",
                header: "Status",
                cell: (r) => <StatusPill label={r.status} tone={reportStatusTone(r.status)} />,
              },
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              {
                key: "reporter",
                header: "Reporter",
                cell: (r) => <AppUserCell user={r.reporter} fallbackId={r.reporterId} />,
              },
              { key: "when", header: "Filed", cell: (r) => formatDateTime(r.createdAt) },
            ]}
          />
        )}
      </DetailSection>

      <DetailSection
        title="Reports filed by this user"
        description={`${user.reportsFiled.length} report(s) they submitted.`}
      >
        {user.reportsFiled.length === 0 ? (
          <p className="text-sm text-affecio-muted">This member has not filed any reports.</p>
        ) : (
          <DataTable
            data={user.reportsFiled}
            columns={[
              { key: "type", header: "Type", cell: (r) => <StatusPill label={r.type} tone="muted" /> },
              {
                key: "status",
                header: "Status",
                cell: (r) => <StatusPill label={r.status} tone={reportStatusTone(r.status)} />,
              },
              { key: "reason", header: "Reason", cell: (r) => r.reason },
              {
                key: "target",
                header: "Reported",
                cell: (r) => <AppUserCell user={r.target} fallbackId={r.targetId} />,
              },
              { key: "when", header: "Filed", cell: (r) => formatDateTime(r.createdAt) },
            ]}
          />
        )}
      </DetailSection>

      <DetailSection title="Verification history">
        {user.verifications.length === 0 ? (
          <p className="text-sm text-affecio-muted">No verification submissions.</p>
        ) : (
          <DataTable
            data={user.verifications}
            columns={[
              {
                key: "status",
                header: "Status",
                cell: (v) => <StatusPill label={v.status} tone={verificationStatusTone(v.status)} />,
              },
              { key: "media", header: "Media key", cell: (v) => <span className="font-mono text-xs">{v.mediaKey}</span> },
              { key: "submitted", header: "Submitted", cell: (v) => formatDateTime(v.submittedAt) },
              { key: "reviewed", header: "Reviewed", cell: (v) => (v.reviewedAt ? formatDateTime(v.reviewedAt) : "—") },
            ]}
          />
        )}
      </DetailSection>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AffecioStatCard label="Calls" value={user.stats.callsCount} icon={Phone} />
        <AffecioStatCard label="Blocks given" value={user.stats.blocksGivenCount} icon={Ban} />
        <AffecioStatCard label="Swipes sent" value={user.stats.swipesSentCount} icon={Repeat} />
        <AffecioStatCard label="Swipes received" value={user.stats.swipesReceivedCount} icon={Shield} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection title="Identity">
          <dl>
            <DetailField label="User ID" value={user.id} mono />
            <DetailField label="Full name" value={user.name} />
            <DetailField label="Email" value={user.email} />
            <DetailField label="Phone" value={user.phoneNumber} mono />
            <DetailField label="Gender" value={user.gender} />
            <DetailField
              label="Birthday"
              value={`${formatDate(user.birthday)} (${age} yrs)`}
            />
            <DetailField label="Joined" value={formatDateTime(user.createdAt)} />
            <DetailField label="Last updated" value={formatDateTime(user.updatedAt)} />
          </dl>
        </DetailSection>

        <DetailSection title="Profile & preferences">
          <dl>
            <DetailField label="About me" value={user.aboutMe} />
            <DetailField label="Looking for" value={formatList(user.lookingFor)} />
            <DetailField label="Start conversation" value={user.startConversation} />
            <DetailField label="Comfortable with" value={user.comfortableWith} />
            <DetailField label="Custom question" value={user.customQuestion} />
            <DetailField label="Custom answer" value={user.customAnswer} />
          </dl>
        </DetailSection>
      </div>

      <DetailSection title="Location" description="Raw location data from the mobile app.">
        <pre className="overflow-x-auto rounded-lg bg-affecio-input p-4 text-xs text-affecio-text">
          {formatLocation(user.location)}
        </pre>
      </DetailSection>

      <DetailSection
        title="Media"
        description={`${user.media.length} file(s) — photos, videos, and verification uploads.`}
      >
        {user.media.length === 0 ? (
          <p className="text-sm text-affecio-muted">No media uploaded.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.media.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border border-affecio-border bg-affecio-input/40"
                >
                  {item.publicUrl && isImageMime(item.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.publicUrl}
                      alt={item.kind}
                      className="aspect-square w-full object-cover"
                    />
                  ) : item.publicUrl && isVideoMime(item.mimeType) ? (
                    <video src={item.publicUrl} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-affecio-muted">
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                  )}
                  <div className="space-y-1 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <StatusPill label={item.kind.replace(/_/g, " ")} tone="muted" />
                      <StatusPill
                        label={item.status}
                        tone={
                          item.status === "CONFIRMED"
                            ? "success"
                            : item.status === "HIDDEN"
                              ? "danger"
                              : "warning"
                        }
                      />
                    </div>
                    <p className="truncate text-affecio-muted">{item.mimeType}</p>
                    <p className="break-all font-mono text-[10px] text-affecio-muted">{item.objectKey}</p>
                    <p className="text-affecio-muted">{formatDateTime(item.createdAt)}</p>
                    {item.publicUrl ? (
                      <a
                        href={item.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="affecio-link inline-block"
                      >
                        Open file
                      </a>
                    ) : null}
                    <div className="pt-2">
                      <MediaHideButton userId={user.id} item={item} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailSection>

      <DetailSection title="Matches" description={`${user.matches.length} mutual match(es).`}>
        {user.matches.length === 0 ? (
          <p className="text-sm text-affecio-muted">No matches.</p>
        ) : (
          <DataTable
            data={user.matches}
            columns={[
              {
                key: "user",
                header: "Matched with",
                cell: (m) => <UserLink user={m.otherUser} />,
              },
              {
                key: "email",
                header: "Contact",
                cell: (m) => m.otherUser.email ?? m.otherUser.phoneNumber ?? "—",
              },
              {
                key: "created",
                header: "Matched at",
                cell: (m) => formatDateTime(m.createdAt),
              },
            ]}
          />
        )}
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection title="Swipes sent" description={`${user.swipesSent.length} shown (max 100).`}>
          {user.swipesSent.length === 0 ? (
            <p className="text-sm text-affecio-muted">No swipes sent.</p>
          ) : (
            <DataTable
              data={user.swipesSent}
              columns={[
                {
                  key: "target",
                  header: "Target",
                  cell: (s) => (s.targetUser ? <UserLink user={s.targetUser} /> : "—"),
                },
                {
                  key: "action",
                  header: "Action",
                  cell: (s) => <StatusPill label={s.action} />,
                },
                {
                  key: "when",
                  header: "When",
                  cell: (s) => formatDateTime(s.createdAt),
                },
              ]}
            />
          )}
        </DetailSection>

        <DetailSection title="Swipes received" description={`${user.swipesReceived.length} shown (max 100).`}>
          {user.swipesReceived.length === 0 ? (
            <p className="text-sm text-affecio-muted">No swipes received.</p>
          ) : (
            <DataTable
              data={user.swipesReceived}
              columns={[
                {
                  key: "from",
                  header: "From",
                  cell: (s) => (s.fromUser ? <UserLink user={s.fromUser} /> : "—"),
                },
                {
                  key: "action",
                  header: "Action",
                  cell: (s) => <StatusPill label={s.action} />,
                },
                {
                  key: "when",
                  header: "When",
                  cell: (s) => formatDateTime(s.createdAt),
                },
              ]}
            />
          )}
        </DetailSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailSection title="Blocks given">
          {user.blocksGiven.length === 0 ? (
            <p className="text-sm text-affecio-muted">Has not blocked anyone.</p>
          ) : (
            <DataTable
              data={user.blocksGiven}
              columns={[
                {
                  key: "blocked",
                  header: "Blocked user",
                  cell: (b) => (b.blockedUser ? <UserLink user={b.blockedUser} /> : "—"),
                },
                {
                  key: "when",
                  header: "When",
                  cell: (b) => formatDateTime(b.createdAt),
                },
              ]}
            />
          )}
        </DetailSection>

        <DetailSection title="Blocks received">
          {user.blocksReceived.length === 0 ? (
            <p className="text-sm text-affecio-muted">Not blocked by anyone.</p>
          ) : (
            <DataTable
              data={user.blocksReceived}
              columns={[
                {
                  key: "blocker",
                  header: "Blocked by",
                  cell: (b) => (b.blocker ? <UserLink user={b.blocker} /> : "—"),
                },
                {
                  key: "when",
                  header: "When",
                  cell: (b) => formatDateTime(b.createdAt),
                },
              ]}
            />
          )}
        </DetailSection>
      </div>

      <DetailSection title="Call sessions" description={`${user.calls.length} call(s).`}>
        {user.calls.length === 0 ? (
          <p className="text-sm text-affecio-muted">No call history.</p>
        ) : (
          <DataTable
            data={user.calls}
            columns={[
              {
                key: "other",
                header: "With",
                cell: (c) => <UserLink user={c.otherUser} />,
              },
              {
                key: "channel",
                header: "Channel",
                cell: (c) => <span className="font-mono text-xs">{c.channelName}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (c) => <StatusPill label={c.status} tone={callStatusTone(c.status)} />,
              },
              {
                key: "started",
                header: "Started",
                cell: (c) => formatDateTime(c.startedAt),
              },
              {
                key: "ended",
                header: "Ended",
                cell: (c) => (c.endedAt ? formatDateTime(c.endedAt) : "—"),
              },
            ]}
          />
        )}
      </DetailSection>

      <DetailSection title="Activity summary">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-affecio-border p-4">
            <div className="flex items-center gap-2 text-affecio-muted">
              <Repeat className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Swipes</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {user.stats.swipesSentCount} sent · {user.stats.swipesReceivedCount} received
            </p>
          </div>
          <div className="rounded-lg border border-affecio-border p-4">
            <div className="flex items-center gap-2 text-affecio-muted">
              <Shield className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Blocks</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {user.stats.blocksGivenCount} given · {user.stats.blocksReceivedCount} received
            </p>
          </div>
          <div className="rounded-lg border border-affecio-border p-4">
            <div className="flex items-center gap-2 text-affecio-muted">
              <Heart className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Matches</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{user.stats.matchesCount}</p>
          </div>
        </dl>
      </DetailSection>
    </div>
  );
}
