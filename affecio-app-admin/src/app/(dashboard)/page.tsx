import { AffecioStatCard } from "@/components/affecio/AffecioStatCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Overview" description="Key metrics across the Affecio platform." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AffecioStatCard label="Total users" value="—" />
        <AffecioStatCard label="Active users" value="—" />
        <AffecioStatCard label="Pending verifications" value="—" />
        <AffecioStatCard label="Open reports" value="—" />
      </div>
    </div>
  );
}
