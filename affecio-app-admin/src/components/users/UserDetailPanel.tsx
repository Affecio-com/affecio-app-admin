import { AffecioCard } from "@/components/affecio/AffecioCard";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import type { AppUser } from "@/types/user";

interface UserDetailPanelProps {
  user: AppUser;
}

export function UserDetailPanel({ user }: UserDetailPanelProps) {
  return (
    <AffecioCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <UserStatusBadge status={user.status} />
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>{user.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Joined</dt>
            <dd>{new Date(user.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </AffecioCard>
  );
}
