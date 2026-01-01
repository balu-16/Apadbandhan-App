import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import type { AxiosResponse } from 'axios';
import type { PaginatedResponse, Meta } from '../services/api';

interface UseInfiniteListOptions<T> {
  queryKey: string[];
  fetchFn: (params: { page: number; limit: number; search?: string }) => Promise<AxiosResponse<PaginatedResponse<T> | T[]>>;
  limit?: number;
  search?: string;
  enabled?: boolean;
  extraParams?: Record<string, unknown>;
}

interface UseInfiniteListResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  onEndReached: () => void;
  totalCount: number;
}

function isPaginatedResponse<T>(response: PaginatedResponse<T> | T[]): response is PaginatedResponse<T> {
  return (
    response !== null &&
    typeof response === 'object' &&
    'data' in response &&
    'meta' in response &&
    Array.isArray((response as PaginatedResponse<T>).data)
  );
}

export function useInfiniteList<T>({
  queryKey,
  fetchFn,
  limit = 20,
  search = '',
  enabled = true,
  extraParams = {},
}: UseInfiniteListOptions<T>): UseInfiniteListResult<T> {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...queryKey, { limit, search, ...extraParams }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchFn({ page: pageParam, limit, search, ...extraParams });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (isPaginatedResponse(lastPage)) {
        const { page, lastPage: totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      }
      return undefined;
    },
    enabled,
  });

  const flattenedData = useMemo(() => {
    if (!data?.pages) return [];
    
    return data.pages.flatMap((page) => {
      if (isPaginatedResponse(page)) {
        return page.data;
      }
      if (Array.isArray(page)) {
        return page;
      }
      return [];
    });
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data?.pages?.length) return 0;
    const lastPage = data.pages[data.pages.length - 1];
    if (isPaginatedResponse(lastPage)) {
      return lastPage.meta.total;
    }
    return flattenedData.length;
  }, [data, flattenedData.length]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    data: flattenedData,
    isLoading,
    isError,
    error: error as Error | null,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    refetch,
    onEndReached,
    totalCount,
  };
}

export function useAllItems<T>({
  queryKey,
  fetchFn,
  search = '',
  enabled = true,
  extraParams = {},
}: Omit<UseInfiniteListOptions<T>, 'limit'>): UseInfiniteListResult<T> {
  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...queryKey, 'all', { search, ...extraParams }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchFn({ page: pageParam, limit: 100, search, ...extraParams });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (isPaginatedResponse(lastPage)) {
        const { page, lastPage: totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      }
      return undefined;
    },
    enabled,
  });

  const flattenedData = useMemo(() => {
    if (!data?.pages) return [];
    
    return data.pages.flatMap((page) => {
      if (isPaginatedResponse(page)) {
        return page.data;
      }
      if (Array.isArray(page)) {
        return page;
      }
      return [];
    });
  }, [data]);

  const totalCount = useMemo(() => {
    if (!data?.pages?.length) return 0;
    const lastPage = data.pages[data.pages.length - 1];
    if (isPaginatedResponse(lastPage)) {
      return lastPage.meta.total;
    }
    return flattenedData.length;
  }, [data, flattenedData.length]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    data: flattenedData,
    isLoading,
    isError,
    error: error as Error | null,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    refetch,
    onEndReached,
    totalCount,
  };
}
