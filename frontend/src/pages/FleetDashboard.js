import React from 'react';
import { Box, Typography } from '@mui/material';

const FleetDashboard = () => {
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        pt: 8,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 500 }}>
        Welcome Fleet Manager
      </Typography>
    </Box>
  );
};

export default FleetDashboard;
