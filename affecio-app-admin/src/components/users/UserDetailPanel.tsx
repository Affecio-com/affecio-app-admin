import { AffecioCard } from "@/components/affecio/AffecioCard";
import type { AppUser } from "@/types/user";
import { formatDateTime } from "@/lib/format";

interface UserDetailPanelProps {
  user: AppUser;
}

export function UserDetailPanel({ user }: UserDetailPanelProps) {
  return (
    <AffecioCard>
      <div className="space-y-4">
        <div>
          <h2 className="font-mondwest text-xl font-semibold">{user.name}</h2>
          <p className="text-sm text-affecio-muted">{user.email ?? user.phoneNumber}</p>
        </div>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-affecio-muted">User ID</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
          </div>
          <div>
            <dt className="text-affecio-muted">Gender</dt>
            <dd>{user.gender}</dd>
          </div>
          <div>
            <dt className="text-affecio-muted">Joined</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </AffecioCard>
  );
}
