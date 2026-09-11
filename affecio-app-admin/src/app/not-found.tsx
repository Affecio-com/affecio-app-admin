import Link from "next/link";
import { AffecioButton } from "@/components/affecio/AffecioButton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">404</h1>
      <p className="max-w-md text-muted-foreground">This admin page could not be found.</p>
      <AffecioButton asChild>
        <Link href="/">Back to dashboard</Link>
      </AffecioButton>
    </div>
  );
}
