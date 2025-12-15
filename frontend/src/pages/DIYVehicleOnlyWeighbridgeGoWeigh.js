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

const DIYVehicleOnlyWeighbridgeGoWeigh = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frontAxle, setFrontAxle] = useState('');
  const [rearAxle, setRearAxle] = useState('');
  const [gvm, setGvm] = useState('');

  const methodSelection = location.state?.methodSelection || 'Weighbridge - goweigh';

  const handleContinue = () => {
    const state = location.state || {};

    const axleWeigh = {
      frontAxle: frontAxle ? Number(frontAxle) : null,
      rearAxle: rearAxle ? Number(rearAxle) : null,
      gvm: gvm ? Number(gvm) : null
    };

    const nextState = {
      ...state,
      axleWeigh,
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
            {methodSelection}
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Weigh Vehicle
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            Follow the Go Weigh procedure and enter the values from the weighbridge ticket.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 180 }}
            >
              Front Axle
            </Typography>
            <TextField
              value={frontAxle}
              onChange={(e) => setFrontAxle(e.target.value)}
              placeholder="Front Axle"
              sx={{ width: 200, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 180 }}
            >
              Rear Axle
            </Typography>
            <TextField
              value={rearAxle}
              onChange={(e) => setRearAxle(e.target.value)}
              placeholder="Rear Axle"
              sx={{ width: 200, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 180 }}
            >
              Car Weight (GVM)
            </Typography>
            <TextField
              value={gvm}
              onChange={(e) => setGvm(e.target.value)}
              placeholder="GVM"
              sx={{ width: 200, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{ mb: 4 }}
          >
            Note: If your vehicle has a dual rear axle, combine the individual rear-axle tyre loads and enter the total value.
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
            >
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyWeighbridgeGoWeigh;
