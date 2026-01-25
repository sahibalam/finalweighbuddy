import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYTowCaravanPortableTyresVCI02 = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [frontLeft, setFrontLeft] = useState('');
  const [frontRight, setFrontRight] = useState('');
  const [rearLeft, setRearLeft] = useState('');
  const [rearRight, setRearRight] = useState('');

  const handleContinue = () => {
    const baseState = location.state || {};

    const vci02 = {
      unhitchedWeigh: {
        frontLeft: frontLeft ? Number(frontLeft) : null,
        frontRight: frontRight ? Number(frontRight) : null,
        rearLeft: rearLeft ? Number(rearLeft) : null,
        rearRight: rearRight ? Number(rearRight) : null
      }
    };

    navigate('/diy-weigh', {
      state: {
        ...baseState,
        vci02,
        startAtPayment: true
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
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Portable Scales - Individual Tyre Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 3 }}
          >
            Disconnect Caravan/Trailer - Weigh Unhitched Tow Vehicle
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 2, columnGap: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ minWidth: 110 }}>Front Left Tyre</Typography>
              <TextField
                value={frontLeft}
                onChange={(e) => setFrontLeft(e.target.value)}
                sx={{ width: 140, mr: 1 }}
              />
              <Typography>kg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ minWidth: 110 }}>Front Right Tyre</Typography>
              <TextField
                value={frontRight}
                onChange={(e) => setFrontRight(e.target.value)}
                sx={{ width: 140, mr: 1 }}
              />
              <Typography>kg</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', rowGap: 2, columnGap: 4, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ minWidth: 110 }}>Rear Left Tyre</Typography>
              <TextField
                value={rearLeft}
                onChange={(e) => setRearLeft(e.target.value)}
                sx={{ width: 140, mr: 1 }}
              />
              <Typography>kg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ minWidth: 110 }}>Rear Right Tyre</Typography>
              <TextField
                value={rearRight}
                onChange={(e) => setRearRight(e.target.value)}
                sx={{ width: 140, mr: 1 }}
              />
              <Typography>kg</Typography>
            </Box>
          </Box>

          <Typography variant="caption" sx={{ mb: 3 }}>
            Note: If your tow vehicle has a dual rear axle, combine the individual rear-axle tyre loads and
            enter the total value.
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

export default DIYTowCaravanPortableTyresVCI02;
