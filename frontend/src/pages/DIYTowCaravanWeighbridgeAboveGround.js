import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYTowCaravanWeighbridgeAboveGround = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleContinue = () => {
    const state = location.state || {};

    navigate('/tow-caravan-weighbridge-above-ground-weights', {
      state: {
        ...state,
      }
    });
  };

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{ p: 4, borderRadius: 2, minHeight: '60vh', display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            WeighBuddy Compliance Check
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Weighbridge - Above Ground
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Disclaimer
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Accuracy of Weigh Data
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            When using an above-ground weighbridge with a single weighing pad, the information collected is limited and may
            be less accurate than data obtained from other weighbridge types.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            WeighBuddy recommends using either:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            • individual weigh pads (usually used by professional weighing businesses)
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            • an inground weighbridge, where the tow vehicle and trailer sit level, or
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            • a goweigh style above-ground weighbridge with split sections that capture each axle group separately
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
            • If you use a single-pad above-ground weighbridge, the only reliably accurate measurements will be GCM, ATM and
            Unhitched GVM.
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            All other measurements may be inaccurate due to the tow vehicle or caravan/trailer sitting out of level during the
            weighing process.
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={handleContinue}>
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYTowCaravanWeighbridgeAboveGround;
