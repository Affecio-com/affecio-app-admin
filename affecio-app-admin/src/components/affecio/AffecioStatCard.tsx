interface AffecioStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function AffecioStatCard({ label, value, hint }: AffecioStatCardProps) {
  return (
    <div className="rounded-xl border border-affecio-border bg-affecio-surface p-6">
      <p className="text-sm text-affecio-muted">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-affecio-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-affecio-muted">{hint}</p> : null}
    </div>
  );
}
