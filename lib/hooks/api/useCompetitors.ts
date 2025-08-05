import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CompetitorAPI } from '../../services/apiService';
import type { TransformedCompetitor, CompetitorNearParams, ViewportCompetitorParams } from '../../types/api';

/**
 * Legacy hook for coordinate-based competitor searches (deprecated)
 * Use useViewportCompetitorsQuery instead for radius-based searches from MyPlace
 */
export const useCompetitorsNearQuery = (
  params: CompetitorNearParams & { radius: number }, // Make radius required
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  // This is a legacy hook - for new implementations use useViewportCompetitorsQuery
  console.warn('⚠️ useCompetitorsNearQuery is deprecated. Use useViewportCompetitorsQuery for radius-based searches.');
  
  return useQuery({
    queryKey: ['competitors', 'near-legacy', {
      lng: Math.round(params.longitude * 100) / 100,
      lat: Math.round(params.latitude * 100) / 100,
      radius: params.radius,
      industries: params.industries?.sort()
    }],
    queryFn: () => {
      // For legacy coordinate-based searches, we could implement a separate endpoint
      // For now, just use the viewport method (radius-only from MyPlace)
      return CompetitorAPI.getNearby({
        radius: params.radius,
        industries: params.industries,
        limit: params.limit
      });
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    enabled: !!(params.longitude && params.latitude && params.radius),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
};

/**
 * Hook to get all available industries for filtering
 */
export const useIndustriesQuery = (options?: Omit<UseQueryOptions<string[]>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['competitors', 'industries'],
    queryFn: CompetitorAPI.getIndustries,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48, // 48 hours
    retry: 3,
    ...options,
  });
};

/**
 * Hook to get competitors by place ID
 */
export const useCompetitorsByPlaceQuery = (
  placeId: string,
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['competitors', 'place', placeId],
    queryFn: () => CompetitorAPI.getByPlaceId(placeId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!placeId,
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get competitor statistics
 */
export const useCompetitorStatsQuery = (options?: Omit<UseQueryOptions<Record<string, unknown>>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['competitors', 'stats'],
    queryFn: CompetitorAPI.getStats,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    ...options,
  });
};

/**
 * Hook to get all competitors without filters (for "Load All" mode)
 * Uses the /competitors endpoint directly (no limit = all ~1997 competitors)
 */
export const useAllCompetitorsQuery = (
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['competitors', 'all'],
    queryFn: () => CompetitorAPI.getAll(),
    staleTime: 1000 * 60 * 15, // 15 minutes - longer stale time for all data
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: 'offlineFirst',
    ...options,
  });
};

/**
 * Hook for viewport-based competitor loading (radius-based from MyPlace)
 * Uses the new radius-only API that doesn't require longitude/latitude
 */
export const useViewportCompetitorsQuery = (
  params: ViewportCompetitorParams,
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['competitors', 'viewport', {
      radius: params.radius,
      industries: params.industries?.sort(),
      limit: params.limit
    }],
    queryFn: () => CompetitorAPI.getNearby(params),
    staleTime: 1000 * 60 * 15, // 15 minutes - very long stale time for viewport
    gcTime: 1000 * 60 * 60 * 2, // 2 hours - keep in memory longer
    enabled: !!(params.radius && params.radius > 0),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData, // Keep previous competitors while loading new ones
    networkMode: 'offlineFirst', // Prefer cache over network
    ...options,
  });
};

/**
 * Custom hook for viewport-based competitor loading with smart defaults
 * Updated to use radius-only parameters for MyPlace-based searches
 */
export const useViewportCompetitors = (
  radius: number = 10,
  industries?: string[],
  limit?: number, // Optional limit parameter
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  const params: ViewportCompetitorParams = {
    radius,
    industries,
    // Only include limit if it's provided and greater than 0
    ...(limit && limit > 0 ? { limit } : {})
  };

  return useViewportCompetitorsQuery(params, {
    // Aggressive caching for viewport loading
    staleTime: 1000 * 60 * 15, // 15 minutes - very long stale time for viewport
    gcTime: 1000 * 60 * 60 * 2, // 2 hours - keep in memory longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData, // Keep previous competitors while loading new ones
    networkMode: 'offlineFirst', // Prefer cache over network
    ...options, // Allow overriding defaults
  });
};