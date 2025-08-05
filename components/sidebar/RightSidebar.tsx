'use client';
import { Box, Typography } from '@mui/material';
import Legend from './Legend';

export default function RightSidebar() {
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
        Legend
      </Typography>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Legend />
      </Box>
    </Box>
  );
}