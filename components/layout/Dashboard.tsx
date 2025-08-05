'use client';
import { Box, Paper } from '@mui/material';
import { SIZING } from '../../lib/constants';
import LeftSidebar from '../sidebar/LeftSidebar';
import RightSidebar from '../sidebar/RightSidebar';
import MapContainer from '../map/MapContainer';

export default function Dashboard() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      {/* Left Sidebar */}
      <Paper
        elevation={2}
        sx={{
          width: SIZING.SIDEBAR_WIDTH,
          height: '100vh',
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        <LeftSidebar />
      </Paper>

      {/* Map Container */}
      <Box
        sx={{
          flex: 1,
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <MapContainer />
      </Box>

      {/* Right Sidebar */}
      <Paper
        elevation={2}
        sx={{
          width: SIZING.LEGEND_WIDTH,
          height: '100vh',
          borderRadius: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
          flexShrink: 0,
        }}
      >
        <RightSidebar />
      </Paper>
    </Box>
  );
}