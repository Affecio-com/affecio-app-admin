import { cn } from "@/lib/utils";

const toneStyles = {
  default: "bg-white/8 text-affecio-text",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  muted: "bg-white/5 text-affecio-muted",
} as const;

interface StatusPillProps {
  label: string;
  tone?: keyof typeof toneStyles;
  className?: string;
}

export function StatusPill({ label, tone = "default", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        toneStyles[tone],
        className,
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function reportStatusTone(status: string): keyof typeof toneStyles {
  switch (status) {
    case "open":
      return "warning";
    case "reviewing":
      return "default";
    case "resolved":
      return "success";
    case "dismissed":
      return "muted";
    default:
      return "default";
  }
}

export function callStatusTone(status: string): keyof typeof toneStyles {
  switch (status) {
    case "active":
      return "success";
    case "ended":
      return "muted";
    default:
      return "default";
  }
}

export function accountStatusTone(status: string): keyof typeof toneStyles {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    case "banned":
      return "danger";
    default:
      return "muted";
  }
}

export function activityStatusTone(status: string): keyof typeof toneStyles {
  switch (status) {
    case "active":
      return "success";
    case "recent":
      return "default";
    case "inactive":
      return "warning";
    case "dormant":
      return "muted";
    default:
      return "muted";
  }
}

export function verificationStatusTone(status: string): keyof typeof toneStyles {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "danger";
    case "none":
      return "muted";
    default:
      return "default";
  }
}
