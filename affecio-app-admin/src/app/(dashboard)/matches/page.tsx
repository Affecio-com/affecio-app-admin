import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MatchesPage() {
  return (
    <div>
      <PageHeader title="Matches" description="Monitor match activity and issues." />
      <EmptyState title="No match data" description="Match insights will appear here." />
    </div>
  );
}
