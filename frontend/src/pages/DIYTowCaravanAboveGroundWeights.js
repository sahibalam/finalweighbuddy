import React, { useState } from 'react';
import { Box, Paper, Typography, Container, TextField, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYTowCaravanAboveGroundWeights = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [gcm, setGcm] = useState('');
  const [atm, setAtm] = useState('');
  const [gvmUnhitched, setGvmUnhitched] = useState('');

  const handleContinue = () => {
    const baseState = location.state || {};

    const axleWeigh = {
      gcm: gcm ? Number(gcm) : null,
      caravanAtm: atm ? Number(atm) : null,
      gvmUnhitched: gvmUnhitched ? Number(gvmUnhitched) : null
    };

    navigate('/diy-weigh', {
      state: {
        ...baseState,
        axleWeigh,
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
            Tow Vehicle and Caravan/Trailer
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Weighbridge - Above Ground
          </Typography>

          {/* SECTION 1: GCM */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Weigh Tow Vehicle Hitched to Caravan/Trailer First
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Drive whole vehicle and caravan/trailer onto the weighbridge.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              GCM
            </Typography>
            <TextField
              value={gcm}
              onChange={(e) => setGcm(e.target.value)}
              placeholder="GCM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          {/* SECTION 2: ATM */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Disconnect Caravan/Trailer
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Disconnect caravan/trailer and drive tow vehicle off the weighbridge.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              ATM
            </Typography>
            <TextField
              value={atm}
              onChange={(e) => setAtm(e.target.value)}
              placeholder="ATM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          {/* SECTION 3: GVM Unhitched */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Drive vehicle and caravan/trailer off Weighbridge and disconnect caravan/trailer
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Drive tow vehicle only onto the weighbridge unhitched.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              GVM Unhitched
            </Typography>
            <TextField
              value={gvmUnhitched}
              onChange={(e) => setGvmUnhitched(e.target.value)}
              placeholder="GVM Unhitched"
              sx={{ width: 160, mr: 1 }}
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
            <Button variant="contained" color="primary" onClick={handleContinue}>
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYTowCaravanAboveGroundWeights;