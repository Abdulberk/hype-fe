 import { useQuery, useQueries, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { TradeAreaAPI } from '../../services/apiService';
import type { TransformedTradeArea } from '../../types/api';

/**
 * Hook to get all trade areas for a place (30%, 50%, 70%)
 */
export const useTradeAreasQuery = (
  placeId: string,
  options?: Omit<UseQueryOptions<TransformedTradeArea[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['trade-areas', placeId],
    queryFn: async () => {
      try {
        return await TradeAreaAPI.getByPlace(placeId);
      } catch (error: unknown) {
        // If trade areas not found (404), return empty array instead of throwing
        const httpError = error as { status?: number; response?: { status?: number } };
        if (httpError?.status === 404 || httpError?.response?.status === 404) {
          console.log(`No trade areas found for place ${placeId}`);
          return [];
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!placeId,
    retry: (failureCount, error: unknown) => {
      // Don't retry for 404 errors (not found)
      const httpError = error as { status?: number; response?: { status?: number } };
      if (httpError?.status === 404 || httpError?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
};

/**
 * Hook to get specific trade area percentage for a place
 */
export const useTradeAreaByPercentageQuery = (
  placeId: string,
  percentage: 30 | 50 | 70,
  options?: Omit<UseQueryOptions<TransformedTradeArea>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['trade-areas', placeId, percentage],
    queryFn: () => TradeAreaAPI.getByPlaceAndPercentage(placeId, percentage),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!(placeId && percentage),
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get available trade area percentages for a place
 */
export const useTradeAreaPercentagesQuery = (
  placeId: string,
  options?: Omit<UseQueryOptions<number[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['trade-areas', placeId, 'percentages'],
    queryFn: () => TradeAreaAPI.getAvailablePercentages(placeId),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!placeId,
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get trade area statistics
 */
export const useTradeAreaStatsQuery = (
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['trade-areas', 'stats'],
    queryFn: TradeAreaAPI.getStats,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    ...options,
  });
};

/**
 * Bulk hook to get trade areas for multiple places (for multi-selection)
 */
export const useMultipleTradeAreasQuery = (placeIds: string[]) => {
  return useQueries({
    queries: placeIds.map((placeId) => ({
      queryKey: ['trade-areas', placeId],
      queryFn: async () => {
        try {
          return await TradeAreaAPI.getByPlace(placeId);
        } catch (error: unknown) {
          // If trade areas not found (404), return empty array instead of throwing
          const httpError = error as { status?: number; response?: { status?: number } };
          if (httpError?.status === 404 || httpError?.response?.status === 404) {
            console.log(`No trade areas found for place ${placeId}`);
            return [];
          }
          throw error;
        }
      },
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      enabled: !!placeId,
      retry: (failureCount: number, error: unknown) => {
        // Don't retry for 404 errors (not found)
        const httpError = error as { status?: number; response?: { status?: number } };
        if (httpError?.status === 404 || httpError?.response?.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    })),
  });
};

/**
 * Custom hook for filtered trade areas based on selected percentages
 */
export const useFilteredTradeAreas = (
  placeId: string,
  selectedPercentages: number[] = [30, 50, 70]
) => {
  const { data: allTradeAreas, ...queryResult } = useTradeAreasQuery(placeId);

  const filteredTradeAreas = allTradeAreas?.filter((area) =>
    selectedPercentages.includes(area.trade_area)
  ) || [];

  return {
    data: filteredTradeAreas,
    ...queryResult,
  };
};

/**
 * Hook for on-demand trade area loading when place is selected
 */
export const useOnDemandTradeAreas = (selectedPlaceIds: string[]) => {
  const queries = useMultipleTradeAreasQuery(selectedPlaceIds);
  
  // Combine all trade areas from multiple places
  const allTradeAreas = queries
    .filter(query => query.data)
    .flatMap(query => query.data || []);
    
  const isLoading = queries.some(query => query.isLoading);
  
  // Only consider it an error if it's not a 404 (not found)
  const isError = queries.some(query => {
    if (!query.isError) return false;
    const httpError = query.error as { status?: number; response?: { status?: number } };
    // Don't consider 404 as error - it's expected for some places
    return !(httpError?.status === 404 || httpError?.response?.status === 404);
  });
  
  const errors = queries
    .filter(query => {
      if (!query.error) return false;
      const httpError = query.error as { status?: number; response?: { status?: number } };
      // Don't include 404 errors in the error list
      return !(httpError?.status === 404 || httpError?.response?.status === 404);
    })
    .map(query => query.error);

  // Track places without trade areas for UI feedback
  const placesWithoutTradeAreas = queries
    .filter(query => {
      if (!query.error) return false;
      const httpError = query.error as { status?: number; response?: { status?: number } };
      return httpError?.status === 404 || httpError?.response?.status === 404;
    })
    .map((query, index) => selectedPlaceIds[index])
    .filter(Boolean);

  return {
    data: allTradeAreas,
    isLoading,
    isError,
    errors,
    queries,
    placesWithoutTradeAreas, // New field to track places without data
  };
};

/**
 * Prefetch trade areas for a place (for optimistic loading)
 */
export const usePrefetchTradeAreas = () => {
  const queryClient = useQueryClient();

  const prefetchTradeAreas = (placeId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['trade-areas', placeId],
      queryFn: () => TradeAreaAPI.getByPlace(placeId),
      staleTime: 1000 * 60 * 30,
    });
  };

  return { prefetchTradeAreas };
};