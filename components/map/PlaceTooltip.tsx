'use client';
import { Paper, Typography, Box } from '@mui/material';
import { TooltipData, Competitor, Place } from '../../lib/types';

interface PlaceTooltipProps {
  tooltip: TooltipData;
}

export default function PlaceTooltip({ tooltip }: PlaceTooltipProps) {
  const { object, x, y } = tooltip;
  
  // Determine if this is "My Place" or a competitor
  const isMyPlace = 'id' in object || object.name === 'Starbucks'; // My place has 'id', competitors have 'pid'
  
  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        left: x + 10,
        top: y - 10,
        padding: 2,
        maxWidth: 300,
        pointerEvents: 'none',
        zIndex: 1000,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transform: 'scale(0.95)',
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
          {isMyPlace ? '📍 My Place' : '🏢 Competitor'}
        </Typography>
        
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          {object.name}
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {object.street_address}, {object.city}, {'state' in object ? object.state : (object as Competitor).region}
        </Typography>
        
        {/* Show industry/category */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {isMyPlace
            ? `Industry: ${(object as Place).industry}`
            : `Category: ${(object as Competitor).sub_category}`
          }
        </Typography>
        
        {/* Show distance for competitors */}
        {!isMyPlace && 'distance' in object && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Distance: {object.distance.toFixed(2)} miles
          </Typography>
        )}
        
        {/* Show data availability indicators */}
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          {((isMyPlace && (object as Place).isTradeAreaAvailable) ||
            (!isMyPlace && (object as Competitor).trade_area_activity)) && (
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
              Trade Area
            </Typography>
          )}
          
          {((isMyPlace && (object as Place).isHomeZipcodesAvailable) ||
            (!isMyPlace && (object as Competitor).home_locations_activity)) && (
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
              Home Locations
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}