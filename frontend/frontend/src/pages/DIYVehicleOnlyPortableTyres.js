import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  Grid
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYVehicleOnlyPortableTyres = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frontLeft, setFrontLeft] = useState('');
  const [frontRight, setFrontRight] = useState('');
  const [rearLeft, setRearLeft] = useState('');
  const [rearRight, setRearRight] = useState('');

  const handleContinue = () => {
    const state = location.state || {};

    const tyreWeigh = {
      frontLeft: frontLeft ? Number(frontLeft) : null,
      frontRight: frontRight ? Number(frontRight) : null,
      rearLeft: rearLeft ? Number(rearLeft) : null,
      rearRight: rearRight ? Number(rearRight) : null
    };

    const nextState = {
      ...state,
      tyreWeigh,
      startAtPayment: true
    };

    navigate('/diy-weigh', { state: nextState });
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Vehicle Only
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Portable Scales - Individual Tyre Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Weigh Vehicle
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            Drive each tyre of vehicle onto portable scale
          </Typography>

          <Grid container spacing={3} sx={{ maxWidth: 600 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Front Left Tyre"
                value={frontLeft}
                onChange={(e) => setFrontLeft(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <Typography variant="body2">kg</Typography> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Front Right Tyre"
                value={frontRight}
                onChange={(e) => setFrontRight(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <Typography variant="body2">kg</Typography> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Rear Left Tyre"
                value={rearLeft}
                onChange={(e) => setRearLeft(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <Typography variant="body2">kg</Typography> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Rear Right Tyre"
                value={rearRight}
                onChange={(e) => setRearRight(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <Typography variant="body2">kg</Typography> }}
              />
            </Grid>
          </Grid>

          <Typography
            variant="caption"
            sx={{ mt: 3, mb: 4 }}
          >
            Note: If your vehicle has a dual rear axle, combine the individual rear-axle tyre loads and enter the total value.
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
            >
              Save and Continue
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyPortableTyres;
