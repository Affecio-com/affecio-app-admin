import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AffecioCardProps {
  children: ReactNode;
  className?: string;
}

export function AffecioCard({ children, className }: AffecioCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-affecio-border bg-affecio-surface p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
