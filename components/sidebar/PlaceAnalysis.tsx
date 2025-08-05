'use client';
import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Switch,
  FormControlLabel,
  SelectChangeEvent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LocationOn } from '@mui/icons-material';
import { useUIStore } from '../../lib/stores/uiStore';
import { useIndustriesQuery } from '../../lib/hooks/api';

export default function PlaceAnalysis() {
  const { placeAnalysis, setPlaceAnalysis } = useUIStore();
  
  // Get industries from React Query hook
  const industriesQuery = useIndustriesQuery();
  const industries = industriesQuery.data || [];

  const handleRadiusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseFloat(event.target.value) || 0);
    setPlaceAnalysis({ radius: value });
  };

  const handleIndustryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setPlaceAnalysis({
      industries: typeof value === 'string' ? value.split(',') : value
    });
  };

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlaceAnalysis({ isVisible: event.target.checked });
  };

  return (
    <Accordion defaultExpanded sx={{ mb: 1 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="place-analysis-content"
        id="place-analysis-header"
      >
        <Typography
          variant="h6"
          sx={{
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
          Place Analysis
        </Typography>
      </AccordionSummary>
      
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Radius Filter */}
          <TextField
            fullWidth
            label="Radius (miles)"
            type="number"
            value={placeAnalysis.radius}
            onChange={handleRadiusChange}
            inputProps={{
              min: 0,
              step: 0.1
            }}
            size="small"
            variant="outlined"
          />

          {/* Industry Filter */}
          <FormControl fullWidth size="small">
            <InputLabel id="industry-select-label">Industries</InputLabel>
            <Select
              labelId="industry-select-label"
              multiple
              value={placeAnalysis.industries}
              onChange={handleIndustryChange}
              input={<OutlinedInput label="Industries" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200,
                  },
                },
              }}
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {industry}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Visibility Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={placeAnalysis.isVisible}
                onChange={handleVisibilityChange}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                {placeAnalysis.isVisible ? 'Hide Places' : 'Show Places'}
              </Typography>
            }
          />

          {/* Info Text */}
          <Typography variant="caption" color="text.secondary">
            Filter competitors around &ldquo;My Place&rdquo; by distance and industry categories.
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}