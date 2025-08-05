import axios, { type AxiosResponse, type AxiosError } from 'axios';
import type {
  ApiPlace,
  ApiCompetitor,
  ApiTradeArea,
  ApiHomeZipcode,
  ApiZipcode,
  ApiHomeZipcodeAnalysis,
  CompetitorNearParams,
  HomeZipcodesParams,
  ZipcodesBulkRequest,
  TransformedPlace,
  TransformedCompetitor,
  TransformedTradeArea,
  TransformedZipcode,
  TransformedHomeZipcodes,
} from '../types/api';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hype-api.vercel.app/api/v1';
const MY_PLACE_ID = 'c660833d-77f0-4bfa-b8f9-4ac38f43ef6a';

// Validation check for API base URL
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('⚠️  NEXT_PUBLIC_API_BASE_URL not found in environment variables, using fallback URL');
}

// Axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    throw error;
  }
);

// Transform functions to convert API types to existing frontend types
export const transformPlace = (apiPlace: ApiPlace): TransformedPlace => ({
  id: apiPlace.place_id,
  name: apiPlace.name,
  street_address: apiPlace.street_address,
  city: apiPlace.city,
  state: apiPlace.state,
  logo: apiPlace.logo,
  longitude: apiPlace.location.coordinates[0],
  latitude: apiPlace.location.coordinates[1],
  industry: apiPlace.industry,
  isTradeAreaAvailable: apiPlace.isTradeAreaAvailable,
  isHomeZipcodesAvailable: apiPlace.isHomeZipcodesAvailable,
});

export const transformCompetitor = (apiCompetitor: ApiCompetitor): TransformedCompetitor => ({
  pid: apiCompetitor.place_id,
  name: apiCompetitor.name,
  street_address: apiCompetitor.street_address,
  city: apiCompetitor.city,
  region: apiCompetitor.region,
  logo: apiCompetitor.logo,
  latitude: apiCompetitor.location.coordinates[1],
  longitude: apiCompetitor.location.coordinates[0],
  sub_category: apiCompetitor.sub_category,
  trade_area_activity: apiCompetitor.trade_area_activity,
  home_locations_activity: apiCompetitor.home_locations_activity,
  distance: apiCompetitor.distance,
});

export const transformTradeArea = (apiTradeArea: ApiTradeArea): TransformedTradeArea => ({
  pid: apiTradeArea.place_id,
  polygon: apiTradeArea.polygon,
  trade_area: apiTradeArea.trade_area_percentage,
});

export const transformZipcode = (apiZipcode: ApiZipcode): TransformedZipcode => ({
  id: apiZipcode.zipcode_id,
  polygon: apiZipcode.polygon,
});

export const transformHomeZipcodes = (
  placeId: string,
  homeZipcodes: ApiHomeZipcode[]
): TransformedHomeZipcodes => ({
  pid: placeId,
  locations: homeZipcodes.map((hz) => ({ [hz.zipcode]: hz.percentage.toString() })),
});

// API Service Classes
export class PlaceAPI {
  /**
   * Get my place (main store location)
   */
  static async getMyPlace(): Promise<TransformedPlace> {
    const { data } = await apiClient.get<ApiPlace>(`/places/${MY_PLACE_ID}`);
    return transformPlace(data);
  }

  /**
   * Get place by ID
   */
  static async getPlaceById(placeId: string): Promise<TransformedPlace> {
    const { data } = await apiClient.get<ApiPlace>(`/places/${placeId}`);
    return transformPlace(data);
  }
}

export class CompetitorAPI {
  /**
   * Get all competitors (for "Load All" mode)
   * No limit parameter - fetches all ~1997 competitors
   */
  static async getAll(): Promise<TransformedCompetitor[]> {
    const { data } = await apiClient.get('/competitors');
    
    // Handle API response structure: { data: [...], total: 1997, pagination: null }
    const competitorsArray = Array.isArray(data) ? data : (data.data || data.competitors || []);
    
    if (!Array.isArray(competitorsArray)) {
      console.error('❌ Competitors API returned unexpected format:', data);
      throw new Error('Invalid competitors data format from API');
    }
    
    return competitorsArray.map(transformCompetitor);
  }

  /**
   * Get competitors near MyPlace with radius and industry filters only
   * (viewport-based loading - backend uses fixed MyPlace location)
   */
  static async getNearby(params: { radius: number; industries?: string[]; limit?: number }): Promise<TransformedCompetitor[]> {
    // Transform industries array to comma-separated string for backend
    const queryParams: Record<string, string | number> = {
      radius: params.radius
    };
    
    // Add industries as comma-separated string if provided
    if (params.industries && params.industries.length > 0) {
      queryParams.industries = params.industries.join(',');
    }
    
    // Add limit if provided
    if (params.limit && params.limit > 0) {
      queryParams.limit = params.limit;
    }
    
    const { data } = await apiClient.get<ApiCompetitor[]>('/competitors/near', {
      params: queryParams
    });
    return data.map(transformCompetitor);
  }

  /**
   * Get all available industries for filtering
   */
  static async getIndustries(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>('/competitors/industries');
    return data;
  }

  /**
   * Get competitors by place ID
   */
  static async getByPlaceId(placeId: string): Promise<TransformedCompetitor[]> {
    const { data } = await apiClient.get<ApiCompetitor[]>(`/competitors/place/${placeId}`);
    return data.map(transformCompetitor);
  }

  /**
   * Get competitor statistics
   */
  static async getStats() {
    const { data } = await apiClient.get('/competitors/stats');
    return data;
  }
}

export class TradeAreaAPI {
  /**
   * Get all trade areas for a place (30%, 50%, 70%)
   */
  static async getByPlace(placeId: string): Promise<TransformedTradeArea[]> {
    const { data } = await apiClient.get<ApiTradeArea[]>(`/trade-areas/${placeId}`);
    return data.map(transformTradeArea);
  }

  /**
   * Get specific trade area percentage for a place
   */
  static async getByPlaceAndPercentage(
    placeId: string,
    percentage: 30 | 50 | 70
  ): Promise<TransformedTradeArea> {
    const { data } = await apiClient.get<ApiTradeArea>(`/trade-areas/${placeId}/${percentage}`);
    return transformTradeArea(data);
  }

  /**
   * Get available trade area percentages for a place
   */
  static async getAvailablePercentages(placeId: string): Promise<number[]> {
    const { data } = await apiClient.get<number[]>(`/trade-areas/${placeId}/percentages`);
    return data;
  }

  /**
   * Get trade area statistics
   */
  static async getStats() {
    const { data } = await apiClient.get('/trade-areas/stats');
    return data;
  }
}

export class HomeZipcodeAPI {
  /**
   * Get home zipcodes for a place with optional filtering
   */
  static async getByPlace(
    placeId: string,
    params?: HomeZipcodesParams
  ): Promise<TransformedHomeZipcodes> {
    const { data } = await apiClient.get<ApiHomeZipcode[]>(`/home-zipcodes/${placeId}`, { params });
    return transformHomeZipcodes(placeId, data);
  }

  /**
   * Get top N home zipcodes for a place
   */
  static async getTopZipcodes(placeId: string, topN: number): Promise<ApiHomeZipcode[]> {
    const { data } = await apiClient.get<ApiHomeZipcode[]>(`/home-zipcodes/${placeId}/top/${topN}`);
    return data;
  }

  /**
   * Get percentile analysis for a place's home zipcodes
   */
  static async getAnalysis(placeId: string): Promise<ApiHomeZipcodeAnalysis> {
    const { data } = await apiClient.get<ApiHomeZipcodeAnalysis>(`/home-zipcodes/${placeId}/analysis`);
    return data;
  }

  /**
   * Get home zipcode statistics
   */
  static async getStats() {
    const { data } = await apiClient.get('/home-zipcodes/stats');
    return data;
  }
}

export class ZipcodeAPI {
  /**
   * Get multiple zipcodes by IDs (bulk operation)
   */
  static async getBulk(zipcodes: string[]): Promise<TransformedZipcode[]> {
    const { data } = await apiClient.post<ApiZipcode[]>('/zipcodes/bulk', { zipcodes });
    return data.map(transformZipcode);
  }

  /**
   * Get zipcode by ID
   */
  static async getById(zipcodeId: string): Promise<TransformedZipcode> {
    const { data } = await apiClient.get<ApiZipcode>(`/zipcodes/${zipcodeId}`);
    return transformZipcode(data);
  }

  /**
   * Search zipcodes by prefix
   */
  static async searchByPrefix(prefix: string, limit = 20): Promise<ApiZipcode[]> {
    const { data } = await apiClient.get<ApiZipcode[]>(`/zipcodes/search/${prefix}`, {
      params: { limit },
    });
    return data;
  }

  /**
   * Get zipcode statistics
   */
  static async getStats() {
    const { data } = await apiClient.get('/zipcodes/stats');
    return data;
  }
}

// Utility functions for API integration
export const APIUtils = {
  /**
   * Check if a place has trade area data
   */
  hasTradeAreaData: (placeId: string): Promise<boolean> =>
    TradeAreaAPI.getAvailablePercentages(placeId).then((percentages) => percentages.length > 0),

  /**
   * Get viewport bounds for competitor loading
   */
  getViewportParams: (
    centerLng: number,
    centerLat: number,
    radius: number,
    industries?: string[]
  ): CompetitorNearParams => ({
    longitude: centerLng,
    latitude: centerLat,
    radius,
    limit: 100,
    industries,
  }),

  /**
   * Extract unique zipcode IDs from home zipcode data
   */
  extractZipcodeIds: (homeZipcodes: TransformedHomeZipcodes): string[] =>
    homeZipcodes.locations.flatMap((location) => Object.keys(location)),
};