import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { PlaceAPI } from '../../services/apiService';
import type { TransformedPlace } from '../../types/api';

/**
 * Hook to get the main place (My Place)
 */
export const usePlaceQuery = (options?: Omit<UseQueryOptions<TransformedPlace>, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: ['place', 'my-place'],
    queryFn: PlaceAPI.getMyPlace,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

/**
 * Hook to get a place by ID
 */
export const usePlaceByIdQuery = (
  placeId: string,
  options?: Omit<UseQueryOptions<TransformedPlace>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['place', placeId],
    queryFn: () => PlaceAPI.getPlaceById(placeId),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    enabled: !!placeId,
    retry: 3,
    ...options,
  });
};