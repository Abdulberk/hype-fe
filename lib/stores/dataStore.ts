import { create } from 'zustand';


interface DataStoreState {

  isInitializing: boolean;
  isBulkOperationInProgress: boolean;
  

  localError: string | null;
  

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
  

  setInitializing: (loading: boolean) => void;
  setBulkOperation: (inProgress: boolean) => void;
  setLocalError: (error: string | null) => void;
  updateComputedData: (key: string, data: unknown) => void;
  clearComputedData: () => void;
  updateViewportBounds: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export const useDataStore = create<DataStoreState>()((set, get) => ({

  isInitializing: true,
  isBulkOperationInProgress: false,
  localError: null,
  computedData: {},
  
 
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


export const DataStoreUtils = {
 
  combineLoadingStates: (...queries: Array<{ isLoading?: boolean; isFetching?: boolean }>) => {
    return queries.some(query => query.isLoading || query.isFetching);
  },
  
 
  combineErrors: (...queries: Array<{ error?: Error | null }>) => {
    const errors = queries.filter(query => query.error).map(query => query.error!.message);
    return errors.length > 0 ? errors.join('; ') : null;
  },
  
  
  hasErrors: (...queries: Array<{ isError?: boolean }>) => {
    return queries.some(query => query.isError);
  },
  
 
  getLoadingProgress: (...queries: Array<{ isLoading?: boolean; isSuccess?: boolean }>) => {
    const total = queries.length;
    const completed = queries.filter(query => query.isSuccess).length;
    return total > 0 ? (completed / total) * 100 : 0;
  }
};
