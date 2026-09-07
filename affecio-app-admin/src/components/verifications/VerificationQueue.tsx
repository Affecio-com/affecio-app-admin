import { EmptyState } from "@/components/shared/EmptyState";
import type { VerificationItem } from "@/services/verifications";

interface VerificationQueueProps {
  items: VerificationItem[];
}

export function VerificationQueue({ items }: VerificationQueueProps) {
  if (items.length === 0) {
    return <EmptyState title="Queue is empty" description="No pending verifications right now." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">User {item.userId}</p>
              <p className="text-sm text-muted-foreground">{item.status}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(item.submittedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
