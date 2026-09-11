import type { LucideIcon } from "lucide-react";

interface AffecioStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
}

export function AffecioStatCard({ label, value, hint, icon: Icon }: AffecioStatCardProps) {
  return (
    <div className="rounded-xl border border-affecio-border bg-affecio-surface p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-affecio-muted">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-affecio-muted" /> : null}
      </div>
      <p className="mt-3 text-[28px] font-semibold tracking-tight text-affecio-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-affecio-muted">{hint}</p> : null}
    </div>
  );
}
