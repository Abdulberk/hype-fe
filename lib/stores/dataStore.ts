import { create } from 'zustand';

/**
 * Simplified Data Store for React Query Integration
 *
 * This store now focuses on local UI state management rather than data fetching.
 * Server state is handled by React Query hooks, while this store manages:
 * - Loading states for complex operations
 * - Error handling for UI-specific errors
 * - Local data transformations and computed values
 * - Cache for derived data that doesn't need to be refetched
 */

interface DataStoreState {
  // Local UI loading states (separate from React Query loading states)
  isInitializing: boolean;
  isBulkOperationInProgress: boolean;
  
  // UI-specific errors (separate from API errors handled by React Query)
  localError: string | null;
  
  // Computed/derived data cache
  computedData: {
    filteredCompetitors?: unknown[];
    cachedLegendData?: unknown;
    viewportBounds?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
  
  // Actions
  setInitializing: (loading: boolean) => void;
  setBulkOperation: (inProgress: boolean) => void;
  setLocalError: (error: string | null) => void;
  updateComputedData: (key: string, data: unknown) => void;
  clearComputedData: () => void;
  updateViewportBounds: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export const useDataStore = create<DataStoreState>()((set, get) => ({
  // Initial state
  isInitializing: true,
  isBulkOperationInProgress: false,
  localError: null,
  computedData: {},
  
  // Actions
  setInitializing: (loading: boolean) => {
    set({ isInitializing: loading });
  },
  
  setBulkOperation: (inProgress: boolean) => {
    set({ isBulkOperationInProgress: inProgress });
  },
  
  setLocalError: (error: string | null) => {
    set({ localError: error });
  },
  
  updateComputedData: (key: string, data: unknown) => {
    set(state => ({
      computedData: {
        ...state.computedData,
        [key]: data
      }
    }));
  },
  
  clearComputedData: () => {
    set({ computedData: {} });
  },
  
  updateViewportBounds: (bounds: { north: number; south: number; east: number; west: number }) => {
    set(state => ({
      computedData: {
        ...state.computedData,
        viewportBounds: bounds
      }
    }));
  }
}));

/**
 * Utility functions for working with React Query data in components
 */
export const DataStoreUtils = {
  /**
   * Combine multiple React Query results into a single loading state
   */
  combineLoadingStates: (...queries: Array<{ isLoading?: boolean; isFetching?: boolean }>) => {
    return queries.some(query => query.isLoading || query.isFetching);
  },
  
  /**
   * Combine multiple React Query errors into a single error state
   */
  combineErrors: (...queries: Array<{ error?: Error | null }>) => {
    const errors = queries.filter(query => query.error).map(query => query.error!.message);
    return errors.length > 0 ? errors.join('; ') : null;
  },
  
  /**
   * Check if any React Query is in error state
   */
  hasErrors: (...queries: Array<{ isError?: boolean }>) => {
    return queries.some(query => query.isError);
  },
  
  /**
   * Get loading progress percentage based on completed queries
   */
  getLoadingProgress: (...queries: Array<{ isLoading?: boolean; isSuccess?: boolean }>) => {
    const total = queries.length;
    const completed = queries.filter(query => query.isSuccess).length;
    return total > 0 ? (completed / total) * 100 : 0;
  }
};