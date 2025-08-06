'use client';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Visibility, VisibilityOff, LocationOn, Business } from '@mui/icons-material';
import { 
  TooltipData, 
  LocationEntity, 
  isPlace,
  getEntityId,
  getEntityState,
  getEntityCategory,
  getEntityDataAvailability
} from '../../lib/types';
import { useUIStore } from '../../lib/stores/uiStore';

interface PlaceTooltipProps {
  tooltip: TooltipData;
}

interface TooltipPosition {
  left: number;
  top: number;
}

interface EntityDisplayData {
  id: string;
  isMyPlace: boolean;
  title: string;
  category: string;
  address: string;
  hasTradeArea: boolean;
  hasHomeZipcodes: boolean;
  distance?: number;
}

const MY_PLACE_ID = 'c660833d-77f0-4bfa-b8f9-4ac38f43ef6a';

const calculateTooltipPosition = (x: number, y: number): TooltipPosition => ({
  left: Math.min(x + 15, window.innerWidth - 340),
  top: Math.max(y - 10, 10),
});

const extractEntityData = (entity: LocationEntity): EntityDisplayData => {
  const id = getEntityId(entity);
  const isMyPlace = id === MY_PLACE_ID;
  const availability = getEntityDataAvailability(entity);
  
  return {
    id,
    isMyPlace,
    title: entity.name,
    category: getEntityCategory(entity),
    address: `${entity.street_address}, ${entity.city}, ${getEntityState(entity)}`,
    hasTradeArea: availability.hasTradeArea,
    hasHomeZipcodes: availability.hasHomeZipcodes,
    distance: !isPlace(entity) ? entity.distance : undefined,
  };
};

const EntityHeader = ({ isMyPlace }: { isMyPlace: boolean }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    {isMyPlace ? <LocationOn color="secondary" /> : <Business color="primary" />}
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 600,
        color: isMyPlace ? 'secondary.main' : 'primary.main',
      }}
    >
      {isMyPlace ? 'My Place' : 'Competitor'}
    </Typography>
  </Box>
);

const EntityInfo = ({ data }: { data: EntityDisplayData }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
      {data.title}
    </Typography>
    
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      {data.address}
    </Typography>
    
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      {data.isMyPlace ? 'Industry' : 'Category'}: {data.category || 'Not specified'}
    </Typography>
    
    {data.distance !== undefined && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Distance: {data.distance.toFixed(2)} miles
      </Typography>
    )}
  </Box>
);

const ActionButton = ({ 
  label, 
  isVisible, 
  isEnabled, 
  onClick,
  errorMessage 
}: {
  label: string;
  isVisible: boolean;
  isEnabled: boolean;
  onClick: () => void;
  errorMessage?: string;
}) => {
  if (!isVisible) return null;

  return (
    <>
      <Button
        variant={isEnabled ? 'contained' : 'outlined'}
        size="small"
        fullWidth
        disabled={!isEnabled}
        onClick={onClick}
        startIcon={isEnabled ? <VisibilityOff /> : <Visibility />}
        sx={{ fontSize: '0.75rem', py: 0.5 }}
      >
        {label}
      </Button>
      {!isEnabled && errorMessage && (
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
          {errorMessage}
        </Typography>
      )}
    </>
  );
};

const DataAvailabilityBadges = ({ data }: { data: EntityDisplayData }) => (
  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {data.hasTradeArea && (
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
    
    {data.hasHomeZipcodes && (
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
);

export default function PlaceTooltip({ tooltip }: PlaceTooltipProps) {
  const { object, x, y } = tooltip;
  const { customerAnalysis, selectedPlaces, layerVisibility, togglePlaceSelection } = useUIStore();
  
  const entityData = extractEntityData(object);
  const position = calculateTooltipPosition(x, y);
  
  const isSelected = !!selectedPlaces[entityData.id];
  const isTradeAreaVisible = layerVisibility.tradeAreas[entityData.id] || false;
  const isHomeZipcodesVisible = layerVisibility.homeZipcodes === entityData.id;
  
  const showTradeAreaButton = customerAnalysis.dataType === 'tradeArea';
  const showHomeZipcodesButton = customerAnalysis.dataType === 'homeZipcodes';
  
  const handleTogglePlace = () => togglePlaceSelection(object);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        padding: 2,
        maxWidth: 320,
        pointerEvents: 'auto',
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
      <EntityHeader isMyPlace={entityData.isMyPlace} />
      <EntityInfo data={entityData} />
      
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ActionButton
          label={isTradeAreaVisible ? 'Hide Trade Area' : 'Show Trade Area'}
          isVisible={showTradeAreaButton}
          isEnabled={entityData.hasTradeArea}
          onClick={handleTogglePlace}
          errorMessage="Bu place için trade area verisi mevcut değil."
        />
        
        <ActionButton
          label={isHomeZipcodesVisible ? 'Hide Home Zipcodes' : 'Show Home Zipcodes'}
          isVisible={showHomeZipcodesButton}
          isEnabled={entityData.hasHomeZipcodes}
          onClick={handleTogglePlace}
          errorMessage="Bu place için home zipcode verisi mevcut değil."
        />
      </Box>
      
      <DataAvailabilityBadges data={entityData} />
    </Paper>
  );
}