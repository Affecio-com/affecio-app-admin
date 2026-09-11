"use client";

import { cn } from "@/lib/utils";

interface TablePaginationProps {
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function TablePagination({
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-affecio-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-affecio-muted">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          {pages.map((pageNumber) => {
            const isActive = pageNumber === page;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange?.(pageNumber)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-affecio-text text-affecio-bg"
                    : "text-affecio-muted hover:bg-affecio-input hover:text-affecio-text",
                )}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
