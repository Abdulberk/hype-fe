import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CompetitorAPI } from '../../services/apiService';
import type { TransformedCompetitor, CompetitorNearParams } from '../../types/api';

/**
 * Hook to get competitors near a location (main hook for viewport-based loading)
 */
export const useCompetitorsNearQuery = (
  params: CompetitorNearParams,
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['competitors', 'near', {
      // Round coordinates to reduce cache misses
      lng: Math.round(params.longitude * 100) / 100,
      lat: Math.round(params.latitude * 100) / 100,
      radius: params.radius,
      industries: params.industries?.sort()
    }],
    queryFn: () => CompetitorAPI.getNearby(params),
    staleTime: 1000 * 60 * 10, // 10 minutes - longer stale time
    gcTime: 1000 * 60 * 60, // 1 hour - longer garbage collection
    enabled: !!(params.longitude && params.latitude),
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
 * Custom hook for viewport-based competitor loading with smart defaults
 */
export const useViewportCompetitors = (
  longitude: number,
  latitude: number,
  radius: number = 10,
  industries?: string[],
  limit: number = 100,
  options?: Omit<UseQueryOptions<TransformedCompetitor[]>, 'queryKey' | 'queryFn'>
) => {
  const params: CompetitorNearParams = {
    longitude,
    latitude,
    radius,
    limit,
    industries,
  };

  return useCompetitorsNearQuery(params, {
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