import { useQuery, useQueries, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { ZipcodeAPI } from '../../services/apiService';
import type { TransformedZipcode, ApiZipcode } from '../../types/api';

/**
 * Hook to get multiple zipcodes by IDs (bulk operation)
 */
export const useZipcodesBulkQuery = (
  zipcodes: string[],
  options?: Omit<UseQueryOptions<TransformedZipcode[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['zipcodes', 'bulk', zipcodes.sort()],
    queryFn: () => ZipcodeAPI.getBulk(zipcodes),
    staleTime: 1000 * 60 * 60, // 1 hour - zipcode polygons don't change
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: zipcodes.length > 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
};

/**
 * Hook to get a single zipcode by ID
 */
export const useZipcodeByIdQuery = (
  zipcodeId: string,
  options?: Omit<UseQueryOptions<TransformedZipcode>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['zipcodes', zipcodeId],
    queryFn: () => ZipcodeAPI.getById(zipcodeId),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!zipcodeId,
    retry: 2,
    ...options,
  });
};

/**
 * Hook to search zipcodes by prefix
 */
export const useZipcodeSearchQuery = (
  prefix: string,
  limit: number = 20,
  options?: Omit<UseQueryOptions<ApiZipcode[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['zipcodes', 'search', prefix, limit],
    queryFn: () => ZipcodeAPI.searchByPrefix(prefix, limit),
    staleTime: 1000 * 60 * 10, // 10 minutes for search results
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!(prefix && prefix.length >= 2),
    retry: 1,
    ...options,
  });
};

/**
 * Hook to get zipcode statistics
 */
export const useZipcodeStatsQuery = (
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['zipcodes', 'stats'],
    queryFn: ZipcodeAPI.getStats,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get multiple individual zipcodes (for when we need individual queries)
 */
export const useMultipleZipcodesQuery = (zipcodeIds: string[]) => {
  return useQueries({
    queries: zipcodeIds.map((zipcodeId) => ({
      queryKey: ['zipcodes', zipcodeId],
      queryFn: () => ZipcodeAPI.getById(zipcodeId),
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: !!zipcodeId,
      retry: 2,
    })),
  });
};

/**
 * Custom hook for batched zipcode loading (optimizes bulk requests)
 */
export const useBatchedZipcodes = (zipcodeIds: string[], batchSize: number = 50) => {
  // Split zipcode IDs into batches
  const batches = [];
  for (let i = 0; i < zipcodeIds.length; i += batchSize) {
    batches.push(zipcodeIds.slice(i, i + batchSize));
  }

  const batchQueries = useQueries({
    queries: batches.map((batch, index) => ({
      queryKey: ['zipcodes', 'batch', index, batch.sort()],
      queryFn: () => ZipcodeAPI.getBulk(batch),
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      enabled: batch.length > 0,
      retry: 2,
    })),
  });

  // Combine all batch results
  const allZipcodes = batchQueries
    .filter(query => query.data)
    .flatMap(query => query.data || []);
    
  const isLoading = batchQueries.some(query => query.isLoading);
  const isError = batchQueries.some(query => query.isError);
  const errors = batchQueries
    .filter(query => query.error)
    .map(query => query.error);

  return {
    data: allZipcodes,
    isLoading,
    isError,
    errors,
    queries: batchQueries,
  };
};

/**
 * Hook for progressive zipcode loading (load as needed based on viewport)
 */
export const useProgressiveZipcodes = (
  requiredZipcodeIds: string[],
  loadedZipcodeIds: string[] = []
) => {
  // Only load zipcodes that haven't been loaded yet
  const unloadedZipcodes = requiredZipcodeIds.filter(id => !loadedZipcodeIds.includes(id));
  
  return useZipcodesBulkQuery(unloadedZipcodes, {
    enabled: unloadedZipcodes.length > 0,
  });
};

/**
 * Prefetch zipcodes (for optimistic loading)
 */
export const usePrefetchZipcodes = () => {
  const queryClient = useQueryClient();

  const prefetchZipcodesBulk = (zipcodes: string[]) => {
    if (zipcodes.length === 0) return;
    
    queryClient.prefetchQuery({
      queryKey: ['zipcodes', 'bulk', zipcodes.sort()],
      queryFn: () => ZipcodeAPI.getBulk(zipcodes),
      staleTime: 1000 * 60 * 60,
    });
  };

  const prefetchZipcodeById = (zipcodeId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['zipcodes', zipcodeId],
      queryFn: () => ZipcodeAPI.getById(zipcodeId),
      staleTime: 1000 * 60 * 60,
    });
  };

  const prefetchZipcodeSearch = (prefix: string, limit: number = 20) => {
    if (prefix.length < 2) return;
    
    queryClient.prefetchQuery({
      queryKey: ['zipcodes', 'search', prefix, limit],
      queryFn: () => ZipcodeAPI.searchByPrefix(prefix, limit),
      staleTime: 1000 * 60 * 10,
    });
  };

  return { 
    prefetchZipcodesBulk,
    prefetchZipcodeById,
    prefetchZipcodeSearch
  };
};

/**
 * Hook for smart zipcode loading based on home zipcode data
 */
export const useSmartZipcodeLoader = (homeZipcodeIds: string[], priority: 'all' | 'top' | 'visible' = 'visible') => {
  // Different loading strategies based on priority
  const zipcodeIdsToLoad = (() => {
    switch (priority) {
      case 'all':
        return homeZipcodeIds;
      case 'top':
        return homeZipcodeIds.slice(0, 20); // Top 20 zipcodes
      case 'visible':
      default:
        return homeZipcodeIds.slice(0, 10); // Top 10 for initial view
    }
  })();

  return useZipcodesBulkQuery(zipcodeIdsToLoad, {
    enabled: zipcodeIdsToLoad.length > 0,
  });
};

/**
 * Hook to manage zipcode cache invalidation
 */
export const useZipcodeCache = () => {
  const queryClient = useQueryClient();

  const invalidateZipcode = (zipcodeId: string) => {
    queryClient.invalidateQueries({ queryKey: ['zipcodes', zipcodeId] });
  };

  const invalidateZipcodesBulk = (zipcodes: string[]) => {
    queryClient.invalidateQueries({ queryKey: ['zipcodes', 'bulk', zipcodes.sort()] });
  };

  const invalidateAllZipcodes = () => {
    queryClient.invalidateQueries({ queryKey: ['zipcodes'] });
  };

  const clearZipcodeCache = () => {
    queryClient.removeQueries({ queryKey: ['zipcodes'] });
  };

  return {
    invalidateZipcode,
    invalidateZipcodesBulk,
    invalidateAllZipcodes,
    clearZipcodeCache,
  };
};