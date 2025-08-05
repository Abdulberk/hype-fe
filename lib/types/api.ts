// Backend API Type Definitions
export interface ApiPlace {
  _id: string;
  place_id: string;
  name: string;
  street_address: string;
  city: string;
  state: string;
  logo: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  industry: string;
  isTradeAreaAvailable: boolean;
  isHomeZipcodesAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApiCompetitor {
  _id: string;
  place_id: string;
  name: string;
  street_address: string;
  city: string;
  region: string;
  logo: string | null;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  sub_category: string;
  trade_area_activity: boolean;
  home_locations_activity: boolean;
  distance: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApiTradeArea {
  _id: string;
  place_id: string;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  trade_area_percentage: 30 | 50 | 70;
}

export interface ApiHomeZipcode {
  zipcode: string;
  percentage: number;
}

export interface ApiZipcode {
  _id: string;
  zipcode_id: string;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface ApiHomeZipcodeAnalysis {
  totalCount: number;
  percentileGroups: Array<{
    group: number;
    range: {
      min: number;
      max: number;
    };
    count: number;
    percentage: number;
  }>;
  statistics: {
    max: number;
    min: number;
    avg: number;
  };
}

// Query Parameters
export interface CompetitorNearParams {
  longitude: number;
  latitude: number;
  radius?: number;
  limit?: number;
  industries?: string[];
}

export interface HomeZipcodesParams {
  minPercentage?: number;
  maxPercentage?: number;
  limit?: number;
}

export interface ZipcodesBulkRequest {
  zipcodes: string[];
}

// API Response wrapper
export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  error?: string;
}

// Transform functions to convert API types to existing frontend types
export interface TransformedPlace {
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

export interface TransformedCompetitor {
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

export interface TransformedTradeArea {
  pid: string;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  trade_area: number;
}

export interface TransformedZipcode {
  id: string;
  polygon: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface TransformedHomeZipcodes {
  pid: string;
  locations: Array<{ [zipcode: string]: string }>;
}