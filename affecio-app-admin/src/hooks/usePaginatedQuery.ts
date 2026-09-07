"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/api";

interface UsePaginatedQueryOptions<T> {
  queryKey: string;
  fetcher: (params: { page: number; pageSize: number; search?: string }) => Promise<PaginatedResponse<T>>;
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
}

export function usePaginatedQuery<T>({
  queryKey,
  fetcher,
  page = 1,
  pageSize = 20,
  search,
  enabled = true,
}: UsePaginatedQueryOptions<T>) {
  return useQuery({
    queryKey: [queryKey, page, pageSize, search],
    queryFn: () => fetcher({ page, pageSize, search }),
    enabled,
  });
}
