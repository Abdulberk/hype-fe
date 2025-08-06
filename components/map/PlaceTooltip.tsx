'use client';
import { Paper, Typography, Box, Button, Tooltip } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { TooltipData, Competitor, Place } from '../../lib/types';
import { useUIStore } from '../../lib/stores/uiStore';

// Import MyPlace ID constant for simple comparison
const MY_PLACE_ID = 'c660833d-77f0-4bfa-b8f9-4ac38f43ef6a';

interface PlaceTooltipProps {
  tooltip: TooltipData;
}

export default function PlaceTooltip({ tooltip }: PlaceTooltipProps) {
  const { object, x, y } = tooltip;
  const { customerAnalysis, selectedPlaces, layerVisibility, togglePlaceSelection } = useUIStore();
  
  // Simple approach: just check if the ID matches MY_PLACE_ID
  const pid = 'id' in object ? object.id : (object as Competitor).pid;
  const isMyPlace = pid === MY_PLACE_ID;
  const isSelected = !!selectedPlaces[pid];
  
  // Check data availability - different fields for MyPlace vs Competitors
  const hasTradeAreaData = isMyPlace
    ? (object as Place).isTradeAreaAvailable
    : (object as Competitor).trade_area_activity;
  const hasHomeZipcodesData = isMyPlace
    ? (object as Place).isHomeZipcodesAvailable
    : (object as Competitor).home_locations_activity;
  
  // Check current visibility state
  const isTradeAreaVisible = layerVisibility.tradeAreas[pid] || false;
  const isHomeZipcodesVisible = layerVisibility.homeZipcodes === pid;
  
  // Determine which buttons to show based on customer analysis data type
  const showTradeAreaButton = customerAnalysis.dataType === 'tradeArea';
  const showHomeZipcodesButton = customerAnalysis.dataType === 'homeZipcodes';
  
  const handleTogglePlace = () => {
    togglePlaceSelection(object);
  };
  
  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        left: Math.min(x + 15, window.innerWidth - 340), // Prevent overflow on right edge
        top: Math.max(y - 10, 10), // Prevent overflow on top edge
        padding: 2,
        maxWidth: 320,
        pointerEvents: 'auto', // Enable pointer events for buttons
        zIndex: 1000,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transform: 'scale(1)',
        animation: 'tooltipFadeIn 0.2s ease-out forwards',
        '@keyframes tooltipFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.85) translateY(10px)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1) translateY(0)',
          },
        },
      }}
    >
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: isMyPlace ? 'secondary.main' : 'primary.main',
            mb: 1
          }}
        >
          {isMyPlace ? '🏠 My Place' : '🏢 Competitor'}
        </Typography>
        
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          {object.name}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {object.street_address}, {object.city}, {'state' in object ? object.state : (object as Competitor).region}
        </Typography>
        
        {/* Show industry/category */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {isMyPlace
            ? `Industry: ${(object as Place).industry || 'Not specified'}`
            : `Category: ${(object as Competitor).sub_category || 'Not specified'}`
          }
        </Typography>
        
        {/* Show distance for competitors */}
        {!isMyPlace && 'distance' in object && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Distance: {object.distance.toFixed(2)} miles
          </Typography>
        )}
        
        {/* Action Buttons */}
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Trade Area Button */}
          {showTradeAreaButton && (
            <>
              <Button
                variant={isTradeAreaVisible ? 'contained' : 'outlined'}
                size="small"
                fullWidth
                disabled={!hasTradeAreaData}
                onClick={handleTogglePlace}
                startIcon={isTradeAreaVisible ? <VisibilityOff /> : <Visibility />}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5
                }}
              >
                {isTradeAreaVisible ? 'Hide Trade Area' : 'Show Trade Area'}
              </Button>
              {!hasTradeAreaData && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    fontSize: '0.7rem',
                    mt: -0.5,
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}
                >
                  Bu place için trade area verisi mevcut değil.
                </Typography>
              )}
            </>
          )}
          
          {/* Home Zipcodes Button */}
          {showHomeZipcodesButton && (
            <>
              <Button
                variant={isHomeZipcodesVisible ? 'contained' : 'outlined'}
                size="small"
                fullWidth
                disabled={!hasHomeZipcodesData}
                onClick={handleTogglePlace}
                startIcon={isHomeZipcodesVisible ? <VisibilityOff /> : <Visibility />}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5
                }}
              >
                {isHomeZipcodesVisible ? 'Hide Home Zipcodes' : 'Show Home Zipcodes'}
              </Button>
              {!hasHomeZipcodesData && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    fontSize: '0.7rem',
                    mt: -0.5,
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}
                >
                  Bu place için home zipcode verisi mevcut değil.
                </Typography>
              )}
            </>
          )}
        </Box>
        
        {/* Data availability indicators */}
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {hasTradeAreaData && (
            <Typography
              variant="caption"
              sx={{
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.7rem'
              }}
            >
              Trade Area Available
            </Typography>
          )}
          
          {hasHomeZipcodesData && (
            <Typography
              variant="caption"
              sx={{
                backgroundColor: 'secondary.light',
                color: 'secondary.contrastText',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.7rem'
              }}
            >
              Home Locations Available
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}