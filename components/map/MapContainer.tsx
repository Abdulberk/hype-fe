'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, CircularProgress, Fade, Slide } from '@mui/material';
import { MyLocation, Public } from '@mui/icons-material';
import Map from 'react-map-gl';
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import { useDataStore, DataStoreUtils } from '../../lib/stores/dataStore';
import { useUIStore } from '../../lib/stores/uiStore';
import { DEFAULT_MAP_VIEW, MAPBOX_STYLE, COLOR_SCHEME } from '../../lib/constants';
import {
  filterCompetitorsByIndustries,
  calculatePercentiles,
  getColorForValue
} from '../../lib/utils/dataLoader';
import { Competitor, Place, ParsedTradeArea, Zipcode } from '../../lib/types';
import PlaceTooltip from './PlaceTooltip';
import { usePulseLayer } from './PulseLayer';
import { useRadiusIndicator } from './RadiusIndicator';
import {
  usePlaceQuery,
  useViewportCompetitors,
  useAllCompetitorsQuery,
  useOnDemandTradeAreas,
  useOnDemandHomeZipcodes,
  useSmartZipcodeLoader
} from '../../lib/hooks/api';
import { APIUtils } from '../../lib/services/apiService';
import type { TransformedCompetitor, TransformedTradeArea, TransformedHomeZipcodes } from '../../lib/types/api';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MapContainer() {
  const {
    setInitializing,
    isInitializing,
    localError,
    updateViewportBounds,
    computedData
  } = useDataStore();
  
  const {
    placeAnalysis,
    customerAnalysis,
    layerVisibility,
    selectedPlaces,
    tooltip,
    mapViewState,
    competitorLoadingMode,
    setTooltip,
    setMapViewState,
    togglePlaceSelection,
    setCompetitorLoadingMode
  } = useUIStore();

  // React Query hooks for data fetching - use the default MY_PLACE_ID
  const myPlaceQuery = usePlaceQuery();
  
  // Get competitors based on loading mode
  const centerLng = mapViewState?.longitude || DEFAULT_MAP_VIEW.longitude;
  const centerLat = mapViewState?.latitude || DEFAULT_MAP_VIEW.latitude;
  
  const viewportCompetitorsQuery = useViewportCompetitors(
    centerLng,
    centerLat,
    placeAnalysis.radius,
    placeAnalysis.industries.length > 0 ? placeAnalysis.industries : undefined,
    100, // limit
    {
      enabled: competitorLoadingMode === 'viewport'
    }
  );
  
  const allCompetitorsQuery = useAllCompetitorsQuery({
    enabled: competitorLoadingMode === 'all'
  });
  
  // Use the appropriate query based on loading mode
  const competitorsQuery = competitorLoadingMode === 'all' ? allCompetitorsQuery : viewportCompetitorsQuery;

  // Get trade areas for selected places
  const selectedPlaceIds = Object.keys(selectedPlaces);
  const tradeAreasQuery = useOnDemandTradeAreas(selectedPlaceIds);
  
  // Handle notification for places without trade areas
  const [showNoTradeAreaAlert, setShowNoTradeAreaAlert] = useState(false);
  const [noTradeAreaMessage, setNoTradeAreaMessage] = useState('');
  
  useEffect(() => {
    if (tradeAreasQuery.placesWithoutTradeAreas && tradeAreasQuery.placesWithoutTradeAreas.length > 0) {
      const count = tradeAreasQuery.placesWithoutTradeAreas.length;
      setNoTradeAreaMessage(
        count === 1
          ? 'Trade area data not available for this location'
          : `Trade area data not available for ${count} selected locations`
      );
      setShowNoTradeAreaAlert(true);
    }
  }, [tradeAreasQuery.placesWithoutTradeAreas]);

  // Get home zipcodes for selected places that need them
  const homeZipcodePlaceIds = Object.entries(selectedPlaces)
    .filter(([, place]) => place.showHomeZipcodes)
    .map(([pid]) => pid);
  const homeZipcodesQuery = useOnDemandHomeZipcodes(homeZipcodePlaceIds);

  // Extract zipcode IDs from home zipcodes for polygon loading
  const homeZipcodeIds = useMemo(() => {
    if (!homeZipcodesQuery.data) return [];
    return homeZipcodesQuery.data.flatMap((hz: TransformedHomeZipcodes) =>
      APIUtils.extractZipcodeIds(hz)
    );
  }, [homeZipcodesQuery.data]);

  const zipcodesQuery = useSmartZipcodeLoader(homeZipcodeIds, 'visible');

  // Combined loading state - only check essential queries for initial load
  const isLoading = isInitializing || myPlaceQuery.isLoading;

  // Combined error state
  const apiError = DataStoreUtils.combineErrors(
    myPlaceQuery,
    competitorsQuery,
    { error: tradeAreasQuery.errors?.[0] || null },
    { error: homeZipcodesQuery.errors?.[0] || null },
    zipcodesQuery
  );
  const error = localError || apiError;

  // Extract data from queries with proper memoization
  const myPlace = myPlaceQuery.data;
  
  const competitors = useMemo(() => competitorsQuery.data || [], [competitorsQuery.data]);
  const tradeAreas = useMemo(() => tradeAreasQuery.data || [], [tradeAreasQuery.data]);
  const homeZipcodes = useMemo(() => homeZipcodesQuery.data || [], [homeZipcodesQuery.data]);
  const zipcodes = useMemo(() => zipcodesQuery.data || [], [zipcodesQuery.data]);

  // Handle initial loading state - set false as soon as primary data is available
  useEffect(() => {
    if (myPlaceQuery.isSuccess && isInitializing) {
      setInitializing(false);
    }
  }, [myPlaceQuery.isSuccess, isInitializing, setInitializing]);

  // Update viewport bounds for competitor loading
  useEffect(() => {
    if (mapViewState) {
      const bounds = {
        north: mapViewState.latitude + 0.1,
        south: mapViewState.latitude - 0.1,
        east: mapViewState.longitude + 0.1,
        west: mapViewState.longitude - 0.1
      };
      updateViewportBounds(bounds);
    }
  }, [mapViewState, updateViewportBounds]);

  // Filter competitors based on analysis filters (now done client-side for additional filtering)
  const filteredCompetitors = useMemo(() => {
    if (!myPlace || !placeAnalysis.isVisible) return [];
    
    // API already filters by radius and industries, but we can do additional client-side filtering
    let filtered = competitors;
    
    // Additional filtering if needed (API handles most of this)
    if (placeAnalysis.industries.length > 0) {
      filtered = filterCompetitorsByIndustries(filtered, placeAnalysis.industries);
    }
    
    return filtered;
  }, [competitors, myPlace, placeAnalysis]);

  // Create place markers layer
  const placeLayer = useMemo(() => {
    const data: Array<(Competitor | Place) & { isMyPlace: boolean; position: [number, number] }> = [];
    
    // Add "My Place" if available
    if (myPlace && placeAnalysis.isVisible) {
      data.push({
        ...myPlace,
        isMyPlace: true,
        position: [myPlace.longitude, myPlace.latitude]
      });
    }
    
    // Add filtered competitors
    filteredCompetitors.forEach((competitor: TransformedCompetitor) => {
      data.push({
        ...competitor,
        isMyPlace: false,
        position: [competitor.longitude, competitor.latitude]
      });
    });

    return new ScatterplotLayer({
      id: 'places-layer',
      data,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 6,
      radiusMaxPixels: 12,
      lineWidthMinPixels: 2,
      getPosition: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => d.position,
      getRadius: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        
        if (d.isMyPlace) {
          return isSelected ? 16 : 12; // My Place: bigger when selected
        } else {
          return isSelected ? 12 : 8; // Competitors: bigger when selected
        }
      },
      getFillColor: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        
        let baseColor;
        if (isSelected) {
          baseColor = '#FFD700'; // Bright gold/yellow for all selected pins
        } else if (d.isMyPlace) {
          baseColor = COLOR_SCHEME.myPlace; // Green for unselected My Place
        } else {
          baseColor = COLOR_SCHEME.competitor; // Blue for unselected competitors
        }
        
        // Convert hex to RGB
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return [r, g, b, 255];
      },
      getLineColor: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        
        if (isSelected) {
          return [255, 140, 0, 255]; // Dark orange border for selected pins (contrast with yellow)
        } else {
          return [255, 255, 255, 255]; // White border for normal pins
        }
      },
      getLineWidth: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        return isSelected ? 3 : 2; // Thicker border for selected pins
      },
      onHover: (info: { object?: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }; x: number; y: number }) => {
        if (info.object) {
          setTooltip({
            object: info.object,
            x: info.x,
            y: info.y
          });
        } else {
          setTooltip(null);
        }
      },
      onClick: (info: { object?: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] } }) => {
        if (info.object) {
          // Toggle place selection for trade area/home zipcodes visualization
          togglePlaceSelection(info.object);
          setTooltip(null); // Hide tooltip after click
        }
      }
    });
  }, [myPlace, filteredCompetitors, placeAnalysis.isVisible, selectedPlaces, setTooltip, togglePlaceSelection]);

  // Create pulse layer for selected pins
  const pulseLayer = usePulseLayer({
    selectedPlaces: Object.values(selectedPlaces),
    myPlace: myPlace || null,
    filteredCompetitors
  });

  // Create radius indicator layer (only show in viewport mode)
  const radiusIndicatorLayer = useRadiusIndicator({
    myPlace: myPlace || null,
    radius: placeAnalysis.radius,
    isVisible: competitorLoadingMode === 'viewport' && placeAnalysis.isVisible && !!myPlace
  });

  // Create trade area layers
  const tradeAreaLayers = useMemo(() => {
    if (customerAnalysis.dataType !== 'tradeArea' || !customerAnalysis.isVisible) {
      return [];
    }

    const layers: PolygonLayer[] = [];
    
    // Get visible trade areas from selected places
    Object.entries(selectedPlaces).forEach(([pid, selectedPlace]) => {
      if (!selectedPlace.showTradeArea) return;
      
      const placeTradeAreas = tradeAreas.filter((ta: TransformedTradeArea) => ta.pid === pid);
      
      placeTradeAreas.forEach((area: TransformedTradeArea) => {
        if (!customerAnalysis.tradeAreaPercentages.includes(area.trade_area)) return;
        
        let color: string;
        let opacity: number;
        
        switch (area.trade_area) {
          case 30:
            color = COLOR_SCHEME.tradeArea30;
            opacity = 0.3;
            break;
          case 50:
            color = COLOR_SCHEME.tradeArea50;
            opacity = 0.5;
            break;
          case 70:
            color = COLOR_SCHEME.tradeArea70;
            opacity = 0.7;
            break;
          default:
            color = COLOR_SCHEME.tradeArea50;
            opacity = 0.5;
        }

        // Convert rgba to RGB array
        const rgba = color.match(/rgba?\(([^)]+)\)/)?.[1]?.split(',').map(n => parseInt(n.trim()));
        const fillColor = rgba ? [...rgba.slice(0, 3), Math.floor(opacity * 255)] : [255, 152, 0, 128];
        
        layers.push(new PolygonLayer({
          id: `trade-area-${pid}-${area.trade_area}`,
          data: [area],
          pickable: false,
          stroked: true,
          filled: true,
          wireframe: false,
          lineWidthMinPixels: 1,
          getPolygon: (d: ParsedTradeArea) => d.polygon.coordinates[0],
          getFillColor: () => fillColor as [number, number, number, number],
          getLineColor: [255, 255, 255, 180],
          getLineWidth: 1
        }));
      });
    });

    return layers;
  }, [customerAnalysis.dataType, customerAnalysis.isVisible, customerAnalysis.tradeAreaPercentages, selectedPlaces, tradeAreas]);

  // Create home zipcodes layer
  const homeZipcodesLayer = useMemo(() => {
    if (
      customerAnalysis.dataType !== 'homeZipcodes' ||
      !customerAnalysis.isVisible ||
      !layerVisibility.homeZipcodes
    ) {
      return null;
    }

    const selectedPlaceHomeZipcodes = homeZipcodes.find(
      (hz: TransformedHomeZipcodes) => hz.pid === layerVisibility.homeZipcodes
    );
    
    if (!selectedPlaceHomeZipcodes) return null;

    const { percentiles } = calculatePercentiles(selectedPlaceHomeZipcodes.locations);
    
    // Create zipcode polygon data with colors
    const zipcodesToShow: Array<Zipcode & { percentage: number; fillColor: [number, number, number, number] }> = [];
    
    selectedPlaceHomeZipcodes.locations.forEach((location: Record<string, string>) => {
      Object.entries(location).forEach(([zipcodeId, percentageStr]) => {
        const percentage = parseFloat(String(percentageStr));
        const zipcode = zipcodes.find((z: Zipcode) => z.id === zipcodeId);
        
        if (zipcode) {
          const color = getColorForValue(percentage, percentiles);
          // Convert hex to RGB
          const hex = color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          
          zipcodesToShow.push({
            ...zipcode,
            percentage,
            fillColor: [r, g, b, 180]
          });
        }
      });
    });

    return new PolygonLayer({
      id: 'home-zipcodes-layer',
      data: zipcodesToShow,
      pickable: true,
      stroked: true,
      filled: true,
      wireframe: false,
      lineWidthMinPixels: 1,
      getPolygon: (d: Zipcode & { percentage: number; fillColor: [number, number, number, number] }) => d.polygon.coordinates[0],
      getFillColor: (d: Zipcode & { percentage: number; fillColor: [number, number, number, number] }) => d.fillColor,
      getLineColor: [255, 255, 255, 200],
      getLineWidth: 1
    });
  }, [customerAnalysis, layerVisibility.homeZipcodes, homeZipcodes, zipcodes]);

  const layers = useMemo(() => {
    const allLayers = [];
    
    // Layer ordering: bottom to top
    if (homeZipcodesLayer) {
      allLayers.push(homeZipcodesLayer); // Bottom layer
    }
    allLayers.push(...tradeAreaLayers); // Middle layers
    if (radiusIndicatorLayer) {
      allLayers.push(radiusIndicatorLayer); // Radius indicator layer
    }
    if (pulseLayer) {
      allLayers.push(pulseLayer); // Pulse effect behind pins
    }
    allLayers.push(placeLayer); // Top layer (always visible)
    
    return allLayers.filter(Boolean);
  }, [placeLayer, tradeAreaLayers, homeZipcodesLayer, pulseLayer, radiusIndicatorLayer]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
          p: 3
        }}
      >
        <Typography variant="h6" color="error">
          🚫 Unable to Load Map Data
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
          {error.includes('Network')
            ? 'Please check your internet connection and try again.'
            : 'There was a problem loading the data. This might be temporary.'}
        </Typography>
        <Typography variant="caption" color="text.disabled" textAlign="center" maxWidth={500}>
          Technical details: {error}
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry
          </button>
        </Box>
      </Box>
    );
  }

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Typography variant="h6" color="error">
          Mapbox Token Missing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <DeckGL
        initialViewState={mapViewState || DEFAULT_MAP_VIEW}
        controller={true}
        layers={layers}
        onViewStateChange={({ viewState }) => setMapViewState(viewState as typeof DEFAULT_MAP_VIEW)}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={MAPBOX_STYLE}
        />
      </DeckGL>
      
      {tooltip && <PlaceTooltip tooltip={tooltip} />}
      
      {/* Competitor Loading Mode Toggle */}
      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          padding: '8px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          Loading Mode:
        </Typography>
        <Box
          sx={{
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            padding: '2px',
          }}
        >
          <Box
            onClick={() => setCompetitorLoadingMode('viewport')}
            sx={{
              px: 2,
              py: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: competitorLoadingMode === 'viewport' ? 'primary.main' : 'transparent',
              color: competitorLoadingMode === 'viewport' ? 'white' : 'text.primary',
              fontSize: '12px',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: competitorLoadingMode === 'viewport' ? 'primary.dark' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <MyLocation sx={{ fontSize: 16, mr: 0.5 }} />
            Viewport
          </Box>
          <Box
            onClick={() => setCompetitorLoadingMode('all')}
            sx={{
              px: 2,
              py: 1,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: competitorLoadingMode === 'all' ? 'primary.main' : 'transparent',
              color: competitorLoadingMode === 'all' ? 'white' : 'text.primary',
              fontSize: '12px',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: competitorLoadingMode === 'all' ? 'primary.dark' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <Public sx={{ fontSize: 16, mr: 0.5 }} />
            All (1997)
          </Box>
        </Box>
      </Box>
      
      {/* Animated notification for places without trade area data */}
      <Slide direction="down" in={showNoTradeAreaAlert} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            maxWidth: '400px',
            width: '90%'
          }}
        >
          <Fade in={showNoTradeAreaAlert} timeout={300}>
            <Box
              sx={{
                backgroundColor: 'rgba(33, 150, 243, 0.95)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 1)',
                  transform: 'scale(1.02)'
                },
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.8 },
                  '100%': { opacity: 1 }
                },
                animation: 'pulse 2s infinite'
              }}
              onClick={() => setShowNoTradeAreaAlert(false)}
            >
              <Box
                sx={{
                  fontSize: '20px',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(5deg)' },
                    '75%': { transform: 'rotate(-5deg)' }
                  },
                  animation: 'shake 0.5s ease-in-out 2'
                }}
              >
                📍
              </Box>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                {noTradeAreaMessage}
              </Typography>
              <Box
                sx={{
                  opacity: 0.8,
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' }
                  },
                  animation: 'bounce 2s infinite'
                }}
              >
                ✕
              </Box>
            </Box>
          </Fade>
        </Box>
      </Slide>
    </Box>
  );
}