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

// Import MyPlace ID constant
const MY_PLACE_ID = 'c660833d-77f0-4bfa-b8f9-4ac38f43ef6a';

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
      const updatedLayerVisibility = { ...state.layerVisibility };
      
      // Case Study Requirement: When Home Zipcodes is selected, hide all trade areas and show only MyPlace home zipcodes
      if (newCustomerAnalysis.dataType === 'homeZipcodes' && newCustomerAnalysis.isVisible) {
        // Clear all trade areas
        updatedLayerVisibility.tradeAreas = {};
        
        // Set home zipcodes to show only MyPlace
        updatedLayerVisibility.homeZipcodes = MY_PLACE_ID;
        
        // IMPORTANT: Clear all selected places and only keep MyPlace
        // This ensures only MyPlace appears selected (yellow/orange) on the map
        // Note: We'll use a minimal placeholder here - the actual MyPlace data comes from API
        const myPlacePlaceholder: Place = {
          id: MY_PLACE_ID,
          name: 'MyPlace', // This will be overridden by API data
          street_address: '',
          city: '',
          state: '',
          logo: null,
          latitude: 0, // This will be overridden by API data
          longitude: 0, // This will be overridden by API data
          industry: '',
          isTradeAreaAvailable: true,
          isHomeZipcodesAvailable: true
        };
        
        // Return state with only MyPlace selected
        return {
          customerAnalysis: newCustomerAnalysis,
          selectedPlaces: {
            [MY_PLACE_ID]: {
              place: myPlacePlaceholder, // This is just for state structure - real data comes from usePlaceQuery
              showTradeArea: false,
              showHomeZipcodes: true
            }
          },
          layerVisibility: updatedLayerVisibility
        };
      } else {
        // Normal behavior for other data types
        const updatedSelectedPlaces = { ...state.selectedPlaces };
        
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
      }
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