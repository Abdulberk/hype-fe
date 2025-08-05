'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, CircularProgress, Fade, Slide, IconButton, Tooltip, Select, MenuItem, FormControl } from '@mui/material';
import {
  MyLocation,
  Public,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  FullscreenExit,
  GpsFixed,
  Layers,
  RotateLeft
} from '@mui/icons-material';
import Map, { useMap } from 'react-map-gl';
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
import type { TransformedCompetitor, TransformedTradeArea, TransformedHomeZipcodes, TransformedPlace } from '../../lib/types/api';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MapContainer() {
  // Map style state - must be at the top level before any conditional returns
  const [mapStyle, setMapStyle] = useState(MAPBOX_STYLE);

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
  const viewportCompetitorsQuery = useViewportCompetitors(
    placeAnalysis.radius,
    placeAnalysis.industries.length > 0 ? placeAnalysis.industries : undefined,
    undefined, // No limit - get all competitors in radius
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
    
    let filtered = competitors;
    
    // Additional client-side radius filtering for safety (in case backend doesn't filter properly)
    if (competitorLoadingMode === 'viewport' && placeAnalysis.radius > 0) {
      filtered = filtered.filter((competitor: TransformedCompetitor) => {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (competitor.latitude - myPlace.latitude) * Math.PI / 180;
        const dLon = (competitor.longitude - myPlace.longitude) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(myPlace.latitude * Math.PI / 180) * Math.cos(competitor.latitude * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        
        return distance <= placeAnalysis.radius;
      });
    }
    
    // Additional industry filtering if needed (API handles most of this)
    if (placeAnalysis.industries.length > 0) {
      filtered = filterCompetitorsByIndustries(filtered, placeAnalysis.industries);
    }
    
    return filtered;
  }, [competitors, myPlace, placeAnalysis, competitorLoadingMode]);

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
      radiusScale: 8,
      radiusMinPixels: 8, // Minimum pixel size artırıldı
      radiusMaxPixels: 25, // Maximum pixel size artırıldı
      lineWidthMinPixels: 2,
      getPosition: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => d.position,
      getRadius: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        
        if (d.isMyPlace) {
          // MyPlace: Daha büyük ve her zoom'da görünür
          return isSelected ? 20 : 16;
        } else {
          return isSelected ? 12 : 8; // Competitors: normal boyut
        }
      },
      getFillColor: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const pid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[pid];
        const hasTooltipOpen = tooltip && tooltip.object && (
          ('id' in tooltip.object && tooltip.object.id === pid) ||
          ('pid' in tooltip.object && tooltip.object.pid === pid)
        );
        
        let baseColor;
        if (isSelected) {
          baseColor = '#FFD700'; // Bright gold/yellow for all selected pins
        } else if (d.isMyPlace) {
          // MyPlace: Always bright green - never fades
          baseColor = '#4CAF50'; // Bright green, more visible
        } else {
          baseColor = COLOR_SCHEME.competitor; // Blue for unselected competitors
        }
        
        // Convert hex to RGB with higher alpha for MyPlace
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // MyPlace gets full opacity, others get normal
        let alpha = d.isMyPlace ? 255 : 200;
        
        // Highlight pin with open tooltip
        if (hasTooltipOpen) {
          alpha = 255; // Full opacity for tooltip-active pin
        }
        
        return [r, g, b, alpha];
      },
      getLineColor: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const currentPid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[currentPid];
        
        // Debug tooltip detection
        let hasTooltipOpen = false;
        if (tooltip && tooltip.object) {
          const tooltipPid = 'pid' in tooltip.object ? tooltip.object.pid :
                            'id' in tooltip.object ? tooltip.object.id : null;
          hasTooltipOpen = tooltipPid === currentPid;
        }
        
        // Priority: Tooltip highlighting ALWAYS comes first, then selection state
        if (hasTooltipOpen) {
          // RED border for tooltip-active pin - HIGHEST priority
          return [255, 0, 0, 255]; // Pure red for clear tooltip indication
        } else if (isSelected) {
          return [255, 140, 0, 255]; // Orange border for selected pins
        } else {
          return [255, 255, 255, 255]; // White border for normal pins
        }
      },
      getLineWidth: (d: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }) => {
        const currentPid = d.isMyPlace ? (d as Place).id : (d as Competitor).pid;
        const isSelected = !!selectedPlaces[currentPid];
        
        // Check tooltip state
        let hasTooltipOpen = false;
        if (tooltip && tooltip.object) {
          const tooltipPid = 'pid' in tooltip.object ? tooltip.object.pid :
                            'id' in tooltip.object ? tooltip.object.id : null;
          hasTooltipOpen = tooltipPid === currentPid;
        }
        
        // Priority: Tooltip highlighting ALWAYS comes first, then selection state
        if (hasTooltipOpen) {
          // THICK border for tooltip-active pin - HIGHEST priority
          return d.isMyPlace ? 8 : 6; // Extra thick for clear indication
        } else if (d.isMyPlace) {
          // MyPlace: Always thick border for visibility
          return isSelected ? 4 : 3;
        } else {
          return isSelected ? 3 : 2; // Normal thickness for competitors
        }
      },
      onClick: (info: { object?: (Competitor | Place) & { isMyPlace: boolean; position: [number, number] }; x: number; y: number }) => {
        if (info.object) {
          // Only show tooltip on click - no automatic selection
          setTooltip({
            object: info.object,
            x: info.x,
            y: info.y
          });
        }
      }
    });
  }, [myPlace, filteredCompetitors, placeAnalysis.isVisible, selectedPlaces, tooltip, setTooltip, togglePlaceSelection]);

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
        onClick={(info) => {
          // Close tooltip if clicking on empty space (no object)
          if (!info.object) {
            setTooltip(null);
          }
        }}
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={mapStyle}
        />
      </DeckGL>

      {/* Map Controls */}
      <MapControls
        mapViewState={mapViewState}
        setMapViewState={setMapViewState}
        myPlace={myPlace || null}
        competitorLoadingMode={competitorLoadingMode}
        setCompetitorLoadingMode={setCompetitorLoadingMode}
        mapStyle={mapStyle}
        setMapStyle={setMapStyle}
      />
      
      {tooltip && <PlaceTooltip tooltip={tooltip} />}
      
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

// Map Controls Component
interface MapControlsProps {
  mapViewState: typeof DEFAULT_MAP_VIEW | null;
  setMapViewState: (viewState: typeof DEFAULT_MAP_VIEW) => void;
  myPlace: TransformedPlace | null;
  competitorLoadingMode: 'viewport' | 'all';
  setCompetitorLoadingMode: (mode: 'viewport' | 'all') => void;
  mapStyle: string;
  setMapStyle: (style: string) => void;
}

function MapControls({
  mapViewState,
  setMapViewState,
  myPlace,
  competitorLoadingMode,
  setCompetitorLoadingMode,
  mapStyle,
  setMapStyle
}: MapControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapViewState) {
      setMapViewState({
        ...mapViewState,
        zoom: Math.min(mapViewState.zoom + 1, 20)
      });
    }
  };

  const handleZoomOut = () => {
    if (mapViewState) {
      setMapViewState({
        ...mapViewState,
        zoom: Math.max(mapViewState.zoom - 1, 0)
      });
    }
  };

  // Locate Me - Smooth cinematic transition to MyPlace
  const handleLocateMe = () => {
    if (!myPlace || !mapViewState) return;

    const currentView = mapViewState;
    const targetView = {
      longitude: myPlace.longitude,
      latitude: myPlace.latitude,
      zoom: 14,
      pitch: 0,
      bearing: 0
    };

    // Smooth animation parameters
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    // Easing function for smooth animation
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      // Interpolate between current and target values
      const newViewState = {
        longitude: currentView.longitude + (targetView.longitude - currentView.longitude) * easedProgress,
        latitude: currentView.latitude + (targetView.latitude - currentView.latitude) * easedProgress,
        zoom: currentView.zoom + (targetView.zoom - currentView.zoom) * easedProgress,
        pitch: currentView.pitch + (targetView.pitch - currentView.pitch) * easedProgress,
        bearing: currentView.bearing + (targetView.bearing - currentView.bearing) * easedProgress,
      };

      setMapViewState(newViewState);

      // Continue animation if not finished
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start the animation
    requestAnimationFrame(animate);
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Map styles data
  const mapStyles = [
    {
      url: 'mapbox://styles/mapbox/streets-v12',
      name: 'Streets',
      description: 'Classic street view'
    },
    {
      url: 'mapbox://styles/mapbox/satellite-streets-v12',
      name: 'Satellite',
      description: 'Real satellite imagery'
    },
    {
      url: 'mapbox://styles/mapbox/light-v11',
      name: 'Light',
      description: 'Clean & bright'
    },
    {
      url: 'mapbox://styles/mapbox/dark-v11',
      name: 'Dark',
      description: 'Night mode'
    },
    {
      url: 'mapbox://styles/mapbox/outdoors-v12',
      name: 'Outdoors',
      description: 'Topographic details'
    },
    {
      url: 'mapbox://styles/mapbox/navigation-day-v1',
      name: 'Navigation',
      description: 'GPS-style navigation'
    }
  ];

  // Handle style change
  const handleMapStyleChange = (styleUrl: string) => {
    setMapStyle(styleUrl);
  };

  // Get current style name
  const getCurrentStyleName = () => {
    const currentStyle = mapStyles.find(style => style.url === mapStyle);
    return currentStyle?.name || 'Streets';
  };

  // Reset rotation
  const handleResetRotation = () => {
    if (mapViewState) {
      setMapViewState({
        ...mapViewState,
        bearing: 0,
        pitch: 0
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <>
      {/* Top Right - Competitor Loading Mode Toggle */}
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

      {/* Top Left - Map Style Toggle */}
      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          left: '20px',
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
          Map Style:
        </Typography>
        <Box
          sx={{
            display: 'flex',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            padding: '2px',
            gap: '2px'
          }}
        >
          {mapStyles.slice(0, 4).map((style) => (
            <Box
              key={style.url}
              onClick={() => handleMapStyleChange(style.url)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: mapStyle === style.url ? 'primary.main' : 'transparent',
                color: mapStyle === style.url ? 'white' : 'text.primary',
                fontSize: '12px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: mapStyle === style.url ? 'primary.dark' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {style.name}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Bottom Right - Zoom & Navigation Controls */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Tooltip title="Zoom In" placement="left">
          <IconButton
            onClick={handleZoomIn}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out" placement="left">
          <IconButton
            onClick={handleZoomOut}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Locate Me" placement="left">
          <IconButton
            onClick={handleLocateMe}
            disabled={!myPlace}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            <GpsFixed />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bottom Left - Fullscreen Toggle */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1000
        }}
      >
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} placement="right">
          <IconButton
            onClick={handleFullscreen}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}