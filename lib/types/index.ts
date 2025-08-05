// Base geographic types
export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Polygon {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][];
}

// Place data types
export interface Place {
  id: string;
  name: string;
  street_address: string;
  city: string;
  state: string;
  logo: string | null;
  longitude: number;
  latitude: number;
  industry: string;
  isTradeAreaAvailable: boolean;
  isHomeZipcodesAvailable: boolean;
}

export interface Competitor {
  pid: string;
  name: string;
  street_address: string;
  city: string;
  region: string;
  logo: string | null;
  latitude: number;
  longitude: number;
  sub_category: string;
  trade_area_activity: boolean;
  home_locations_activity: boolean;
  distance: number;
}

// Trade area types
export interface TradeArea {
  pid: string;
  polygon: string; // JSON string of Polygon
  trade_area: number; // 30, 50, or 70
}

export interface ParsedTradeArea {
  pid: string;
  polygon: Polygon;
  trade_area: number;
}

// Home zipcodes types
export interface ZipcodeLocation {
  [zipcode: string]: string; // zipcode -> percentage as string
}

export interface HomeZipcodes {
  pid: string;
  locations: ZipcodeLocation[];
}

export interface Zipcode {
  id: string;
  polygon: Polygon;
}

// UI state types
export type DataType = 'tradeArea' | 'homeZipcodes';

export interface PlaceAnalysisFilters {
  radius: number;
  industries: string[];
  isVisible: boolean;
}

export interface CustomerAnalysisFilters {
  dataType: DataType;
  tradeAreaPercentages: number[]; // 30, 50, 70
  isVisible: boolean;
}

export interface MapViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Legend types
export interface LegendItem {
  color: string;
  label: string;
  value: number | string;
}

export interface PercentileRange {
  min: number;
  max: number;
  color: string;
  label: string;
}

// Layer visibility state
export interface LayerVisibility {
  places: boolean;
  tradeAreas: { [pid: string]: boolean };
  homeZipcodes: string | null; // pid of selected place, null if none
}

// Selected place state
export interface SelectedPlace {
  place: Competitor | Place;
  showTradeArea: boolean;
  showHomeZipcodes: boolean;
}

// Tooltip data
export interface TooltipData {
  object: Competitor | Place;
  x: number;
  y: number;
}

// Color schemes
export interface ColorScheme {
  tradeArea30: string;
  tradeArea50: string;
  tradeArea70: string;
  homeZipcodes: string[];
  myPlace: string;
  competitor: string;
}

// Store types
export interface DataStore {
  myPlace: Place | null;
  competitors: Competitor[];
  tradeAreas: ParsedTradeArea[];
  homeZipcodes: HomeZipcodes[];
  zipcodes: Zipcode[];
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  loadPlaceData: (pid: string) => Promise<void>;
  loadZipcodesData: () => Promise<void>;
}

export interface UIStore {
  placeAnalysis: PlaceAnalysisFilters;
  customerAnalysis: CustomerAnalysisFilters;
  layerVisibility: LayerVisibility;
  selectedPlaces: { [pid: string]: SelectedPlace };
  tooltip: TooltipData | null;
  mapViewState: MapViewState;
  competitorLoadingMode: 'viewport' | 'all';
  setPlaceAnalysis: (filters: Partial<PlaceAnalysisFilters>) => void;
  setCustomerAnalysis: (filters: Partial<CustomerAnalysisFilters>) => void;
  setLayerVisibility: (visibility: Partial<LayerVisibility>) => void;
  togglePlaceSelection: (place: Competitor | Place) => void;
  setTooltip: (tooltip: TooltipData | null) => void;
  setMapViewState: (viewState: MapViewState) => void;
  setCompetitorLoadingMode: (mode: 'viewport' | 'all') => void;
}