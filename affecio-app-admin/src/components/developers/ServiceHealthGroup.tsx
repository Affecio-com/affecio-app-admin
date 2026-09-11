"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ServiceGroup, ServiceStatus } from "@/types/service-health";
import { StatusIndicator, UptimeBar } from "@/components/developers/StatusIndicator";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUSES: ServiceStatus[] = [
  "operational",
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
];

interface ServiceHealthGroupProps {
  group: ServiceGroup;
  defaultOpen?: boolean;
  canEdit?: boolean;
  onUpdate?: (componentId: string, status: ServiceStatus, message: string) => void;
  pending?: boolean;
}

export function ServiceHealthGroup({
  group,
  defaultOpen = false,
  canEdit = false,
  onUpdate,
  pending,
}: ServiceHealthGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [drafts, setDrafts] = useState<Record<string, { status: ServiceStatus; message: string }>>({});
  const componentCount = group.components.length;

  return (
    <div className="border-b border-affecio-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-affecio-input/30"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-affecio-muted transition-transform",
            open && "rotate-180",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium text-affecio-text">{group.name}</h3>
            <span className="text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
              {group.uptimePercent}% uptime
            </span>
          </div>
          <p className="mt-0.5 text-xs text-affecio-muted">
            {componentCount} component{componentCount === 1 ? "" : "s"}
          </p>
          <UptimeBar percent={group.uptimePercent} className="mt-3 max-w-md" />
        </div>
      </button>

      {open ? (
        <ul className="border-t border-affecio-border bg-affecio-bg/40 px-5 py-2">
          {group.components.map((component) => {
            const draft = drafts[component.id] ?? {
              status: component.status,
              message: component.description ?? "",
            };
            return (
              <li
                key={component.id}
                className="border-b border-affecio-border py-3 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-affecio-text">{component.name}</p>
                    {component.description ? (
                      <p className="mt-0.5 text-xs text-affecio-muted">{component.description}</p>
                    ) : null}
                    {component.updatedAt ? (
                      <p className="mt-0.5 text-[11px] text-affecio-muted">
                        Updated {new Date(component.updatedAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <StatusIndicator status={component.status} size="sm" showLabel />
                </div>
                {canEdit ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        setDrafts((m) => ({
                          ...m,
                          [component.id]: { ...draft, status: e.target.value as ServiceStatus },
                        }))
                      }
                      className="h-9 rounded-lg border border-affecio-border bg-affecio-surface px-2 text-sm"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Public status note"
                      value={draft.message}
                      onChange={(e) =>
                        setDrafts((m) => ({
                          ...m,
                          [component.id]: { ...draft, message: e.target.value },
                        }))
                      }
                    />
                    <AffecioButton
                      disabled={pending || !draft.message.trim()}
                      onClick={() => onUpdate?.(component.id, draft.status, draft.message.trim())}
                    >
                      Publish
                    </AffecioButton>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
