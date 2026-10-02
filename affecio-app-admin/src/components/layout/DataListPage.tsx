"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentPanel } from "@/components/shared/ContentPanel";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { usePaginatedQuery } from "@/hooks/usePaginatedQuery";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getApiErrorMessage } from "@/lib/api-error";
import type { PaginatedResponse } from "@/types/api";

interface DataListPageProps<T extends { id: string }> {
  title: string;
  description: string;
  action?: ReactNode;
  queryKey: string;
  fetcher: (params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
  }) => Promise<PaginatedResponse<T>>;
  columns: DataTableColumn<T>[];
  emptyTitle: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  tabs?: string[];
  statusFromTab?: (tab: string) => string | undefined;
  pageSize?: number;
  banner?: ReactNode;
}

export function DataListPage<T extends { id: string }>({
  title,
  description,
  action,
  queryKey,
  fetcher,
  columns,
  emptyTitle,
  emptyDescription,
  searchPlaceholder = "Search...",
  tabs,
  statusFromTab,
  pageSize = 20,
  banner,
}: DataListPageProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(tabs?.[0] ?? "All");
  const debouncedSearch = useDebounce(search, 300);

  const status = useMemo(() => statusFromTab?.(activeTab), [activeTab, statusFromTab]);

  const { data, isLoading, isError, error } = usePaginatedQuery({
    queryKey: `${queryKey}-${status ?? "all"}-${debouncedSearch}`,
    fetcher: (params) => fetcher({ ...params, search: debouncedSearch || undefined, status }),
    page,
    pageSize,
  });

  return (
    <div>
      <PageHeader title={title} description={description} action={action} />
      {banner}
      <ContentPanel
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={searchPlaceholder}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      >
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ApiErrorMessage
              message={getApiErrorMessage(error, "Failed to load data. Is the API running?")}
            />
          </div>
        ) : !data?.data.length ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <DataTable columns={columns} data={data.data} />
        )}
      </ContentPanel>
    </div>
  );
}
