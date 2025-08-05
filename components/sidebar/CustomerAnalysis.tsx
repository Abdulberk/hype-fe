'use client';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  SelectChangeEvent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useUIStore } from '../../lib/stores/uiStore';
import { DataType } from '../../lib/types';
import { TRADE_AREA_PERCENTAGES } from '../../lib/constants';

export default function CustomerAnalysis() {
  const { customerAnalysis, setCustomerAnalysis } = useUIStore();

  const handleDataTypeChange = (event: SelectChangeEvent<DataType>) => {
    setCustomerAnalysis({ 
      dataType: event.target.value as DataType,
      // Reset trade area percentages when switching data types
      tradeAreaPercentages: event.target.value === 'tradeArea' 
        ? customerAnalysis.tradeAreaPercentages 
        : []
    });
  };

  const handleTradeAreaPercentageChange = (percentage: number) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const currentPercentages = customerAnalysis.tradeAreaPercentages;
    
    if (event.target.checked) {
      setCustomerAnalysis({
        tradeAreaPercentages: [...currentPercentages, percentage].sort((a, b) => a - b)
      });
    } else {
      setCustomerAnalysis({
        tradeAreaPercentages: currentPercentages.filter(p => p !== percentage)
      });
    }
  };

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerAnalysis({ isVisible: event.target.checked });
  };

  return (
    <Accordion defaultExpanded sx={{ mb: 1 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="customer-analysis-content"
        id="customer-analysis-header"
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Customer Analysis
        </Typography>
      </AccordionSummary>
      
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Data Type Selection */}
          <FormControl fullWidth size="small">
            <InputLabel id="data-type-select-label">Data Type</InputLabel>
            <Select
              labelId="data-type-select-label"
              value={customerAnalysis.dataType}
              onChange={handleDataTypeChange}
              label="Data Type"
            >
              <MenuItem value="tradeArea">Trade Area</MenuItem>
              <MenuItem value="homeZipcodes">Home Zipcodes</MenuItem>
            </Select>
          </FormControl>

          {/* Trade Area Percentage Options */}
          {customerAnalysis.dataType === 'tradeArea' && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Trade Area Percentages
              </Typography>
              <FormGroup>
                {TRADE_AREA_PERCENTAGES.map((percentage) => (
                  <FormControlLabel
                    key={percentage}
                    control={
                      <Checkbox
                        checked={customerAnalysis.tradeAreaPercentages.includes(percentage)}
                        onChange={handleTradeAreaPercentageChange(percentage)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {percentage}% Trade Area
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Visibility Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={customerAnalysis.isVisible}
                onChange={handleVisibilityChange}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                {customerAnalysis.isVisible 
                  ? `Hide ${customerAnalysis.dataType === 'tradeArea' ? 'Trade Areas' : 'Home Zipcodes'}` 
                  : `Show ${customerAnalysis.dataType === 'tradeArea' ? 'Trade Areas' : 'Home Zipcodes'}`
                }
              </Typography>
            }
          />

          {/* Info Text */}
          <Typography variant="caption" color="text.secondary">
            {customerAnalysis.dataType === 'tradeArea'
              ? 'Select trade area percentages to visualize customer catchment areas. Multiple areas can be shown simultaneously.'
              : 'View home zipcode data showing customer origin distribution. Only one place can be selected at a time.'
            }
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}