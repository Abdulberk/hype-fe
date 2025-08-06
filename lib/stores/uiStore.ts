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
      
     
      if (newCustomerAnalysis.dataType === 'homeZipcodes' && newCustomerAnalysis.isVisible) {
     
        updatedLayerVisibility.tradeAreas = {};
        
     
        updatedLayerVisibility.homeZipcodes = MY_PLACE_ID;
   
        const myPlacePlaceholder: Place = {
          id: MY_PLACE_ID,
          name: 'MyPlace',
          street_address: '',
          city: '',
          state: '',
          logo: null,
          latitude: 0,
          longitude: 0,
          industry: '',
          isTradeAreaAvailable: true,
          isHomeZipcodesAvailable: true,
          hasTradeArea: true,
          hasHomeZipcodes: true,
        };
        
       
        return {
          customerAnalysis: newCustomerAnalysis,
          selectedPlaces: {
            [MY_PLACE_ID]: {
              place: myPlacePlaceholder, 
              showTradeArea: false,
              showHomeZipcodes: true
            }
          },
          layerVisibility: updatedLayerVisibility
        };
      } else {
       
        const updatedSelectedPlaces = { ...state.selectedPlaces };
        
        Object.entries(state.selectedPlaces).forEach(([pid, selectedPlace]) => {
          const showTradeArea = newCustomerAnalysis.dataType === 'tradeArea' && newCustomerAnalysis.isVisible;
          const showHomeZipcodes = newCustomerAnalysis.dataType === 'homeZipcodes' && newCustomerAnalysis.isVisible;
          
        
          updatedSelectedPlaces[pid] = {
            ...selectedPlace,
            showTradeArea,
            showHomeZipcodes
          };
          
       
          if (showTradeArea) {
            updatedLayerVisibility.tradeAreas = {
              ...updatedLayerVisibility.tradeAreas,
              [pid]: true
            };
          } else {
            delete updatedLayerVisibility.tradeAreas[pid];
          }
          
          if (showHomeZipcodes) {
        
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
      
        const newSelected = { ...state.selectedPlaces };
        delete newSelected[pid];
        
     
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
      
        const showTradeArea = state.customerAnalysis.dataType === 'tradeArea' && state.customerAnalysis.isVisible;
        const showHomeZipcodes = state.customerAnalysis.dataType === 'homeZipcodes' && state.customerAnalysis.isVisible;
        
        const newSelected: SelectedPlace = {
          place,
          showTradeArea,
          showHomeZipcodes
        };
        
       
        const newLayerVisibility = { ...state.layerVisibility };
        
        if (showTradeArea) {
          newLayerVisibility.tradeAreas = {
            ...newLayerVisibility.tradeAreas,
            [pid]: true
          };
        }
        
        if (showHomeZipcodes) {
         
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


export const useFilteredPlaces = () => {
  const { placeAnalysis } = useUIStore();

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
