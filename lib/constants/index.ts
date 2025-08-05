import { ColorScheme } from '../types';

// Color scheme for the application
export const COLOR_SCHEME: ColorScheme = {
  tradeArea30: 'rgba(255, 193, 7, 0.3)',   // Amber with low opacity (widest area)
  tradeArea50: 'rgba(255, 152, 0, 0.5)',   // Orange with medium opacity
  tradeArea70: 'rgba(255, 87, 34, 0.7)',   // Deep orange with high opacity (smallest area)
  homeZipcodes: [
    '#E3F2FD', // Very light blue (0-20 percentile)
    '#90CAF9', // Light blue (20-40 percentile)
    '#42A5F5', // Medium blue (40-60 percentile)
    '#1E88E5', // Dark blue (60-80 percentile)
    '#0D47A1'  // Very dark blue (80-100 percentile)
  ],
  myPlace: '#4CAF50',      // Green for "My Place"
  competitor: '#2196F3'     // Blue for competitors
};

// Default map view state (Colorado Springs area)
export const DEFAULT_MAP_VIEW = {
  longitude: -104.8059,
  latitude: 38.9337,
  zoom: 11,
  pitch: 0,
  bearing: 0
};

// Trade area percentages
export const TRADE_AREA_PERCENTAGES = [30, 50, 70] as const;

// Default filter values
export const DEFAULT_FILTERS = {
  placeAnalysis: {
    radius: 10, // miles
    industries: [] as string[],
    isVisible: true
  },
  customerAnalysis: {
    dataType: 'tradeArea' as const,
    tradeAreaPercentages: [30, 50, 70],
    isVisible: true
  }
};

// Map style URL
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

// Layer z-index ordering
export const LAYER_Z_INDEX = {
  HOME_ZIPCODES: 1,
  TRADE_AREAS: 2,
  PLACES: 3,
  TOOLTIP: 4
};

// Percentile ranges for legend calculation
export const PERCENTILE_RANGES = [
  { min: 0, max: 20 },
  { min: 20, max: 40 },
  { min: 40, max: 60 },
  { min: 60, max: 80 },
  { min: 80, max: 100 }
];

// Industry categories (this will be populated from data)
export const COMMON_INDUSTRIES = [
  'Investment Advice',
  'Women\'s Clothing Stores',
  'Wireless Telecommunications Carriers (except Satellite)',
  'Employment Placement Agencies',
  'Furniture Stores',
  'Flooring Contractors',
  'Limited-Service Restaurants',
  'Barber Shops',
  'Hotels (except Casino Hotels) and Motels',
  'Pharmacies and Drug Stores',
  'Fine Arts Schools',
  'Gasoline Stations with Convenience Stores',
  'Pet and Pet Supplies Stores'
];

// Animation durations
export const ANIMATION_DURATION = {
  MAP_TRANSITION: 1000,
  LAYER_FADE: 300,
  TOOLTIP_SHOW: 200
};

// Sizing constants
export const SIZING = {
  SIDEBAR_WIDTH: 320,
  LEGEND_WIDTH: 280,
  PLACE_MARKER_SIZE: 8,
  MY_PLACE_MARKER_SIZE: 12,
  MIN_POLYGON_STROKE_WIDTH: 1,
  MAX_POLYGON_STROKE_WIDTH: 3
};