import { create } from 'zustand';
import {
  UIStore,
  PlaceAnalysisFilters,
  CustomerAnalysisFilters,
  LayerVisibility,
  SelectedPlace,
  TooltipData,
  MapViewState,
  Competitor,
  Place
} from '../types';
import { DEFAULT_FILTERS, DEFAULT_MAP_VIEW } from '../constants';
import { useDataStore } from './dataStore';

export const useUIStore = create<UIStore>()((set, _get) => ({
  placeAnalysis: DEFAULT_FILTERS.placeAnalysis,
  customerAnalysis: DEFAULT_FILTERS.customerAnalysis,
  
  layerVisibility: {
    places: true,
    tradeAreas: {},
    homeZipcodes: null
  },
  
  selectedPlaces: {},
  tooltip: null,
  mapViewState: DEFAULT_MAP_VIEW,
  
  // Competitor loading mode: 'viewport' or 'all'
  competitorLoadingMode: 'viewport' as 'viewport' | 'all',

  setPlaceAnalysis: (filters: Partial<PlaceAnalysisFilters>) => {
    set(state => ({
      placeAnalysis: { ...state.placeAnalysis, ...filters }
    }));
  },

  setCustomerAnalysis: (filters: Partial<CustomerAnalysisFilters>) => {
    set(state => {
      const newCustomerAnalysis = { ...state.customerAnalysis, ...filters };
      
      // Update selected places visibility based on new customer analysis settings
      const updatedSelectedPlaces = { ...state.selectedPlaces };
      const updatedLayerVisibility = { ...state.layerVisibility };
      
      Object.entries(state.selectedPlaces).forEach(([pid, selectedPlace]) => {
        const showTradeArea = newCustomerAnalysis.dataType === 'tradeArea' && newCustomerAnalysis.isVisible;
        const showHomeZipcodes = newCustomerAnalysis.dataType === 'homeZipcodes' && newCustomerAnalysis.isVisible;
        
        // Update selected place visibility flags
        updatedSelectedPlaces[pid] = {
          ...selectedPlace,
          showTradeArea,
          showHomeZipcodes
        };
        
        // Update layer visibility accordingly
        if (showTradeArea) {
          updatedLayerVisibility.tradeAreas = {
            ...updatedLayerVisibility.tradeAreas,
            [pid]: true
          };
        } else {
          delete updatedLayerVisibility.tradeAreas[pid];
        }
        
        if (showHomeZipcodes) {
          // For home zipcodes, only one place can be shown at a time
          // Use the first selected place that supports home zipcodes
          if (!updatedLayerVisibility.homeZipcodes) {
            updatedLayerVisibility.homeZipcodes = pid;
          }
        } else if (updatedLayerVisibility.homeZipcodes === pid) {
          updatedLayerVisibility.homeZipcodes = null;
        }
      });
      
      return {
        customerAnalysis: newCustomerAnalysis,
        selectedPlaces: updatedSelectedPlaces,
        layerVisibility: updatedLayerVisibility
      };
    });
  },

  setLayerVisibility: (visibility: Partial<LayerVisibility>) => {
    set(state => ({
      layerVisibility: { ...state.layerVisibility, ...visibility }
    }));
  },

  togglePlaceSelection: (place: Competitor | Place) => {
    const dataStore = useDataStore.getState();
    
    set(state => {
      const pid = 'pid' in place ? place.pid : place.id;
      const isSelected = !!state.selectedPlaces[pid];
      
      if (isSelected) {
        // Remove from selection
        const newSelected = { ...state.selectedPlaces };
        delete newSelected[pid];
        
        // Also remove from layer visibility
        const newTradeAreas = { ...state.layerVisibility.tradeAreas };
        delete newTradeAreas[pid];
        
        const newHomeZipcodes = state.layerVisibility.homeZipcodes === pid
          ? null
          : state.layerVisibility.homeZipcodes;
        
        return {
          selectedPlaces: newSelected,
          layerVisibility: {
            ...state.layerVisibility,
            tradeAreas: newTradeAreas,
            homeZipcodes: newHomeZipcodes
          }
        };
      } else {
        // Add to selection with appropriate visibility based on current analysis mode
        const showTradeArea = state.customerAnalysis.dataType === 'tradeArea' && state.customerAnalysis.isVisible;
        const showHomeZipcodes = state.customerAnalysis.dataType === 'homeZipcodes' && state.customerAnalysis.isVisible;
        
        const newSelected: SelectedPlace = {
          place,
          showTradeArea,
          showHomeZipcodes
        };
        
        // Note: Data loading is now handled automatically by React Query hooks
        // No manual data loading needed as hooks will fetch data on-demand
        
        // Update layer visibility
        const newLayerVisibility = { ...state.layerVisibility };
        
        if (showTradeArea) {
          newLayerVisibility.tradeAreas = {
            ...newLayerVisibility.tradeAreas,
            [pid]: true
          };
        }
        
        if (showHomeZipcodes) {
          // For home zipcodes, only one place can be shown at a time
          newLayerVisibility.homeZipcodes = pid;
        }
        
        return {
          selectedPlaces: {
            ...state.selectedPlaces,
            [pid]: newSelected
          },
          layerVisibility: newLayerVisibility
        };
      }
    });
  },

  setTooltip: (tooltip: TooltipData | null) => {
    set({ tooltip });
  },

  setMapViewState: (viewState: MapViewState) => {
    set({ mapViewState: viewState });
  },

  setCompetitorLoadingMode: (mode: 'viewport' | 'all') => {
    set({ competitorLoadingMode: mode });
  }
}));

// Selector hooks for better performance
export const useFilteredPlaces = () => {
  const { placeAnalysis } = useUIStore();
  // This will be used to filter places based on radius and industries
  return placeAnalysis;
};

export const useVisibleLayers = () => {
  const { layerVisibility } = useUIStore();
  return layerVisibility;
};

export const useSelectedPlacesArray = () => {
  const { selectedPlaces } = useUIStore();
  return Object.values(selectedPlaces);
};