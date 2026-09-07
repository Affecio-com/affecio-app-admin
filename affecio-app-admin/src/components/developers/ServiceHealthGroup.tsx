"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ServiceGroup } from "@/types/service-health";
import { StatusIndicator, UptimeBar } from "@/components/developers/StatusIndicator";
import { cn } from "@/lib/utils";

interface ServiceHealthGroupProps {
  group: ServiceGroup;
  defaultOpen?: boolean;
}

export function ServiceHealthGroup({ group, defaultOpen = false }: ServiceHealthGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
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
            <span className="text-sm tabular-nums text-emerald-400">{group.uptimePercent}% uptime</span>
          </div>
          <p className="mt-0.5 text-xs text-affecio-muted">
            {componentCount} component{componentCount === 1 ? "" : "s"}
          </p>
          <UptimeBar percent={group.uptimePercent} className="mt-3 max-w-md" />
        </div>
      </button>

      {open ? (
        <ul className="border-t border-affecio-border bg-affecio-bg/40 px-5 py-2">
          {group.components.map((component) => (
            <li
              key={component.id}
              className="flex items-start justify-between gap-4 border-b border-affecio-border py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-affecio-text">{component.name}</p>
                {component.description ? (
                  <p className="mt-0.5 text-xs text-affecio-muted">{component.description}</p>
                ) : null}
              </div>
              <StatusIndicator status={component.status} size="sm" showLabel />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
