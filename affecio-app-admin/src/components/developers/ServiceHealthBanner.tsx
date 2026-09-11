import type { ServiceHealthSnapshot } from "@/types/service-health";
import { StatusIndicator } from "@/components/developers/StatusIndicator";

interface ServiceHealthBannerProps {
  snapshot: ServiceHealthSnapshot;
}

export function ServiceHealthBanner({ snapshot }: ServiceHealthBannerProps) {
  return (
    <div className="rounded-lg border border-affecio-border bg-affecio-surface px-6 py-8 text-center">
      <div className="flex justify-center">
        <StatusIndicator status={snapshot.overallStatus} size="lg" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-affecio-text">{snapshot.headline}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-affecio-muted">{snapshot.subheadline}</p>
    </div>
  );
}
