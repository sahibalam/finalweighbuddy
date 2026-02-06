import React from 'react';
import { Box, Typography } from '@mui/material';

const FleetAssetManagement = () => {
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
        Asset Management
      </Typography>
    </Box>
  );
};

export default FleetAssetManagement;
