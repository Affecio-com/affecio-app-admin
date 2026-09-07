import type { LucideIcon } from "lucide-react";

interface AffecioStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}

export function AffecioStatCard({ label, value, hint, icon: Icon }: AffecioStatCardProps) {
  return (
    <div className="rounded-lg border border-affecio-border bg-affecio-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-affecio-muted">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-affecio-muted" /> : null}
      </div>
      <p className="mt-3 font-mondwest text-2xl font-semibold text-affecio-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-affecio-muted">{hint}</p> : null}
    </div>
  );
}
