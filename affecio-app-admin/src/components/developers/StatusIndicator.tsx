import type { ServiceStatus } from "@/types/service-health";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ServiceStatus,
  { label: string; dot: string; ring: string; text: string }
> = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  partial_outage: {
    label: "Partial outage",
    dot: "bg-orange-500",
    ring: "ring-orange-500/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  major_outage: {
    label: "Major outage",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    text: "text-red-700 dark:text-red-400",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-sky-500",
    ring: "ring-sky-500/30",
    text: "text-sky-700 dark:text-sky-400",
  },
};

export function getStatusConfig(status: ServiceStatus) {
  return statusConfig[status];
}

interface StatusIndicatorProps {
  status: ServiceStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = getStatusConfig(status);
  const dotSize = size === "lg" ? "h-3.5 w-3.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn("rounded-full ring-4", dotSize, config.dot, config.ring)}
        aria-hidden
      />
      {showLabel ? <span className={cn("text-sm font-medium", config.text)}>{config.label}</span> : null}
    </span>
  );
}

interface UptimeBarProps {
  percent: number;
  className?: string;
}

export function UptimeBar({ percent, className }: UptimeBarProps) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-affecio-input", className)}>
      <div
        className="h-full rounded-full bg-emerald-500/80 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
