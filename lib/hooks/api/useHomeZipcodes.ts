import { useQuery, useQueries, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { HomeZipcodeAPI } from '../../services/apiService';
import type { TransformedHomeZipcodes, ApiHomeZipcode, ApiHomeZipcodeAnalysis, HomeZipcodesParams } from '../../types/api';

/**
 * Hook to get all home zipcodes for a place
 */
export const useHomeZipcodesQuery = (
  placeId: string,
  params?: HomeZipcodesParams,
  options?: Omit<UseQueryOptions<TransformedHomeZipcodes>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['home-zipcodes', placeId, params],
    queryFn: () => HomeZipcodeAPI.getByPlace(placeId, params),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!placeId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    ...options,
  });
};

/**
 * Hook to get top N home zipcodes for a place
 */
export const useTopHomeZipcodesQuery = (
  placeId: string,
  topN: number = 10,
  options?: Omit<UseQueryOptions<ApiHomeZipcode[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['home-zipcodes', placeId, 'top', topN],
    queryFn: () => HomeZipcodeAPI.getTopZipcodes(placeId, topN),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!(placeId && topN > 0),
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get home zipcode analysis (percentiles)
 */
export const useHomeZipcodeAnalysisQuery = (
  placeId: string,
  options?: Omit<UseQueryOptions<ApiHomeZipcodeAnalysis>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['home-zipcodes', placeId, 'analysis'],
    queryFn: () => HomeZipcodeAPI.getAnalysis(placeId),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!placeId,
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get home zipcode statistics
 */
export const useHomeZipcodeStatsQuery = (
  options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['home-zipcodes', 'stats'],
    queryFn: HomeZipcodeAPI.getStats,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    ...options,
  });
};

/**
 * Bulk hook to get home zipcodes for multiple places
 */
export const useMultipleHomeZipcodesQuery = (placeIds: string[]) => {
  return useQueries({
    queries: placeIds.map((placeId) => ({
      queryKey: ['home-zipcodes', placeId],
      queryFn: () => HomeZipcodeAPI.getByPlace(placeId),
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      enabled: !!placeId,
      retry: 2,
    })),
  });
};

/**
 * Custom hook for filtered home zipcodes based on percentage threshold
 */
export const useFilteredHomeZipcodes = (
  placeId: string,
  minPercentage: number = 0,
  maxPercentage?: number,
  params?: HomeZipcodesParams
) => {
  const { data: homeZipcodesData, ...queryResult } = useHomeZipcodesQuery(placeId, params);

  const filteredLocations = homeZipcodesData?.locations?.filter((location) => {
    const percentage = parseFloat(Object.values(location)[0] || '0');
    if (percentage < minPercentage) return false;
    if (maxPercentage !== undefined && percentage > maxPercentage) return false;
    return true;
  }) || [];

  return {
    data: homeZipcodesData ? { ...homeZipcodesData, locations: filteredLocations } : undefined,
    ...queryResult,
  };
};

/**
 * Hook for on-demand home zipcode loading when place is selected
 */
export const useOnDemandHomeZipcodes = (selectedPlaceIds: string[]) => {
  const queries = useMultipleHomeZipcodesQuery(selectedPlaceIds);
  
  // Combine all home zipcodes from multiple places
  const allHomeZipcodes = queries
    .filter(query => query.data)
    .map(query => query.data!);
    
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);
  const errors = queries
    .filter(query => query.error)
    .map(query => query.error);

  return {
    data: allHomeZipcodes,
    isLoading,
    isError,
    errors,
    queries,
  };
};

/**
 * Prefetch home zipcodes for a place (for optimistic loading)
 */
export const usePrefetchHomeZipcodes = () => {
  const queryClient = useQueryClient();

  const prefetchHomeZipcodes = (placeId: string, params?: HomeZipcodesParams) => {
    queryClient.prefetchQuery({
      queryKey: ['home-zipcodes', placeId, params],
      queryFn: () => HomeZipcodeAPI.getByPlace(placeId, params),
      staleTime: 1000 * 60 * 30,
    });
  };

  const prefetchTopHomeZipcodes = (placeId: string, topN: number = 10) => {
    queryClient.prefetchQuery({
      queryKey: ['home-zipcodes', placeId, 'top', topN],
      queryFn: () => HomeZipcodeAPI.getTopZipcodes(placeId, topN),
      staleTime: 1000 * 60 * 30,
    });
  };

  const prefetchAnalysis = (placeId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['home-zipcodes', placeId, 'analysis'],
      queryFn: () => HomeZipcodeAPI.getAnalysis(placeId),
      staleTime: 1000 * 60 * 60,
    });
  };

  return {
    prefetchHomeZipcodes,
    prefetchTopHomeZipcodes,
    prefetchAnalysis
  };
};