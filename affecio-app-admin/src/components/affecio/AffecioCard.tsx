import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AffecioCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "md" | "lg";
}

export function AffecioCard({ children, className, padding = "lg" }: AffecioCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-affecio-border bg-affecio-surface shadow-panel",
        padding === "none" && "p-0",
        padding === "md" && "p-4",
        padding === "lg" && "p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
