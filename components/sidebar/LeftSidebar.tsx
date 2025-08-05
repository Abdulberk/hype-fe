'use client';
import { Box, Typography } from '@mui/material';
import PlaceAnalysis from './PlaceAnalysis';
import CustomerAnalysis from './CustomerAnalysis';

export default function LeftSidebar() {
  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          fontWeight: 600,
          color: 'primary.main'
        }}
      >
        Filters & Controls
      </Typography>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <PlaceAnalysis />
        <CustomerAnalysis />
      </Box>
    </Box>
  );
}