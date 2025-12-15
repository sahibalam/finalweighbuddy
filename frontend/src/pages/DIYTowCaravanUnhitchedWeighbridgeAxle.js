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

const DIYTowCaravanUnhitchedWeighbridgeAxle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [frontAxle, setFrontAxle] = useState('');
  const [gvm, setGvm] = useState('');

  const handleContinue = () => {
    const state = location.state || {};

    const axleWeigh = {
      frontAxle: frontAxle ? Number(frontAxle) : null,
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
            Tow Vehicle and Caravan/Trailer
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Weighbridge - In Ground - Individual Axle Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Weigh Unhitched Tow Vehicle (Car Only)
          </Typography>

          <Typography variant="body2" sx={{ mb: 4 }}>
            Ensure Caravan/Trailer is disconnected/unhitched.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 260 }}
            >
              Drive front axle of unhitched vehicle onto Weighbridge
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
              sx={{ minWidth: 260 }}
            >
              Drive whole vehicle unhitched onto Weighbridge
            </Typography>
            <TextField
              value={gvm}
              onChange={(e) => setGvm(e.target.value)}
              placeholder="Unhitched GVM"
              sx={{ width: 200, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

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

export default DIYTowCaravanUnhitchedWeighbridgeAxle;
