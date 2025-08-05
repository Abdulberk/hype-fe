'use client';
import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LocationOn, Map, Home } from '@mui/icons-material';
import { useUIStore } from '../../lib/stores/uiStore';
import { COLOR_SCHEME, TRADE_AREA_PERCENTAGES } from '../../lib/constants';
import { calculatePercentiles } from '../../lib/utils/dataLoader';
import { usePlaceQuery, useOnDemandHomeZipcodes } from '../../lib/hooks/api';

interface LegendItemProps {
  color: string;
  label: string;
  description?: string;
}

interface MarkerLegendItemProps {
  color: string;
  borderColor?: string;
  label: string;
  description?: string;
}

function MarkerLegendItem({ color, borderColor = 'rgba(255,255,255,1)', label, description }: MarkerLegendItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Box
        sx={{
          width: 16,
          height: 16,
          backgroundColor: color,
          border: `2px solid ${borderColor}`,
          borderRadius: '50%',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function LegendItem({ color, label, description }: LegendItemProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Box
        sx={{
          width: 16,
          height: 16,
          backgroundColor: color,
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: 1,
          flexShrink: 0,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function Legend() {
  const { customerAnalysis, layerVisibility, selectedPlaces } = useUIStore();
  
  // Get data from React Query hooks
  const myPlaceQuery = usePlaceQuery();
  
  // Get home zipcodes for places that need them
  const homeZipcodePlaceIds = layerVisibility.homeZipcodes ? [layerVisibility.homeZipcodes] : [];
  const homeZipcodesQuery = useOnDemandHomeZipcodes(homeZipcodePlaceIds);

  // Calculate percentiles for home zipcodes if needed
  const homeZipcodesPercentiles = useMemo(() => {
    if (customerAnalysis.dataType !== 'homeZipcodes' || !layerVisibility.homeZipcodes || !myPlaceQuery.data) {
      return null;
    }

    const selectedPlaceHomeZipcodes = homeZipcodesQuery.data?.find(
      hz => hz.pid === layerVisibility.homeZipcodes
    );
    
    if (!selectedPlaceHomeZipcodes) return null;

    const { percentiles } = calculatePercentiles(selectedPlaceHomeZipcodes.locations);
    return percentiles;
  }, [customerAnalysis.dataType, layerVisibility.homeZipcodes, homeZipcodesQuery.data, myPlaceQuery.data]);

  // Get visible trade area percentages
  const visibleTradeAreas = useMemo(() => {
    if (customerAnalysis.dataType !== 'tradeArea') return [];
    
    return customerAnalysis.tradeAreaPercentages.filter(percentage => 
      Object.keys(layerVisibility.tradeAreas).some(pid => 
        selectedPlaces[pid]?.showTradeArea && 
        customerAnalysis.tradeAreaPercentages.includes(percentage)
      )
    );
  }, [customerAnalysis.dataType, customerAnalysis.tradeAreaPercentages, layerVisibility.tradeAreas, selectedPlaces]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Places Legend */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: 'text.primary',
            fontSize: '1.1rem'
          }}
        >
          <Box
            sx={{
              p: 1,
              borderRadius: '50%',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LocationOn sx={{ fontSize: 22, color: 'primary.main' }} />
          </Box>
          Places
        </Typography>
        
        <Box sx={{ pl: 1 }}>
          {/* My Place - Always bright green, 16px size */}
          <MarkerLegendItem
            color="#4CAF50"
            borderColor="rgba(255,255,255,1)"
            label="My Place"
            description="Primary location (always visible)"
          />
          
          {/* Competitor - Normal state, 16px size */}
          <MarkerLegendItem
            color="#2196F3"
            borderColor="rgba(255,255,255,1)"
            label="Competitors"
            description="Nearby business locations"
          />
          
          {/* Selected state indicator, 16px size */}
          <MarkerLegendItem
            color="#FFD700"
            borderColor="rgba(255,140,0,1)"
            label="Selected Places"
            description="Click any place to select and view data"
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic', pl: 1 }}>
          Selected places show trade areas and customer data
        </Typography>
      </Paper>

      {/* Trade Areas Legend */}
      {customerAnalysis.dataType === 'tradeArea' && visibleTradeAreas.length > 0 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              color: 'text.primary',
              fontSize: '1.1rem'
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Map sx={{ fontSize: 22, color: 'primary.main' }} />
            </Box>
            Trade Areas
          </Typography>
          
          <Box sx={{ pl: 1 }}>
            {TRADE_AREA_PERCENTAGES.map(percentage => {
            if (!visibleTradeAreas.includes(percentage)) return null;
            
            let color: string;
            let description: string;
            
            switch (percentage) {
              case 30:
                color = COLOR_SCHEME.tradeArea30;
                description = 'Widest customer catchment area';
                break;
              case 50:
                color = COLOR_SCHEME.tradeArea50;
                description = 'Medium customer catchment area';
                break;
              case 70:
                color = COLOR_SCHEME.tradeArea70;
                description = 'Most concentrated customer area';
                break;
              default:
                color = COLOR_SCHEME.tradeArea50;
                description = 'Customer catchment area';
            }

            return (
              <LegendItem
                key={percentage}
                color={color}
                label={`${percentage}% Trade Area`}
                description={description}
              />
            );
            })}
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic', pl: 1 }}>
            Higher percentages = smaller, more concentrated areas where most customers come from
          </Typography>
        </Paper>
      )}

      {/* Home Zipcodes Legend */}
      {customerAnalysis.dataType === 'homeZipcodes' && homeZipcodesPercentiles && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              color: 'text.primary',
              fontSize: '1.1rem'
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: '50%',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Home sx={{ fontSize: 22, color: 'primary.main' }} />
            </Box>
            Customer Home Zipcodes
          </Typography>
          
          <Box sx={{ pl: 1 }}>
            {homeZipcodesPercentiles.map((percentile, index) => {
            const percentileRanges = [
              { min: 0, max: 20, label: 'Lowest Density', subtitle: '0-20th percentile' },
              { min: 20, max: 40, label: 'Low Density', subtitle: '20-40th percentile' },
              { min: 40, max: 60, label: 'Medium Density', subtitle: '40-60th percentile' },
              { min: 60, max: 80, label: 'High Density', subtitle: '60-80th percentile' },
              { min: 80, max: 100, label: 'Highest Density', subtitle: '80-100th percentile' }
            ];

            const range = percentileRanges[index];
            if (!range) return null;

            return (
              <LegendItem
                key={index}
                color={percentile.color}
                label={range.label}
                description={`${range.subtitle}: ${percentile.min.toFixed(1)}% - ${percentile.max.toFixed(1)}%`}
              />
            );
            })}
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontStyle: 'italic', pl: 1 }}>
            Darker colors = higher customer concentration from those ZIP code areas
          </Typography>
        </Paper>
      )}

      {/* Empty State */}
      {(!customerAnalysis.isVisible ||
        (customerAnalysis.dataType === 'tradeArea' && visibleTradeAreas.length === 0) ||
        (customerAnalysis.dataType === 'homeZipcodes' && !homeZipcodesPercentiles)) && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {!customerAnalysis.isVisible
                ? 'Customer analysis is hidden'
                : customerAnalysis.dataType === 'tradeArea'
                ? 'Select places to view trade areas'
                : 'No customer home data available'
              }
            </Typography>
            {customerAnalysis.dataType === 'tradeArea' && visibleTradeAreas.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Click any competitor or location on the map to display their trade area
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}