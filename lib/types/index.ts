// Base geographic types
export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface Polygon {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][];
}

// Base location entity
interface BaseLocationEntity {
  name: string;
  street_address: string;
  city: string;
  logo: string | null;
  longitude: number;
  latitude: number;
}

// Data availability interface
interface DataAvailability {
  hasTradeArea: boolean;
  hasHomeZipcodes: boolean;
}

// Place data types
export interface Place extends BaseLocationEntity, DataAvailability {
  id: string;
  state: string;
  industry: string;
  isTradeAreaAvailable: boolean;
  isHomeZipcodesAvailable: boolean;
  hasTradeArea: boolean;
  hasHomeZipcodes: boolean;
}

export interface Competitor extends BaseLocationEntity, DataAvailability {
  pid: string;
  region: string;
  sub_category: string;
  trade_area_activity: boolean;
  home_locations_activity: boolean;
  distance: number;
  hasTradeArea: boolean;
  hasHomeZipcodes: boolean;
}

// Union type for location entities
export type LocationEntity = Place | Competitor;

// Type guards
export const isPlace = (entity: LocationEntity): entity is Place => 'id' in entity;
export const isCompetitor = (entity: LocationEntity): entity is Competitor => 'pid' in entity;

// Utility functions
export const getEntityId = (entity: LocationEntity): string =>
  isPlace(entity) ? entity.id : entity.pid;

export const getEntityState = (entity: LocationEntity): string =>
  isPlace(entity) ? entity.state : entity.region;

export const getEntityCategory = (entity: LocationEntity): string =>
  isPlace(entity) ? entity.industry : entity.sub_category;

export const getEntityDataAvailability = (entity: LocationEntity): DataAvailability => ({
  hasTradeArea: isPlace(entity) ? entity.isTradeAreaAvailable : entity.trade_area_activity,
  hasHomeZipcodes: isPlace(entity) ? entity.isHomeZipcodesAvailable : entity.home_locations_activity,
});

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