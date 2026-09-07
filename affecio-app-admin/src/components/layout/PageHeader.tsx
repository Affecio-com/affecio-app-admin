import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  centered?: boolean;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  centered = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:items-center",
        className,
      )}
    >
      <div className={cn(centered && "text-center sm:text-left")}>
        <h1 className="font-mondwest text-3xl font-semibold tracking-tight text-affecio-text">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm text-affecio-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}
