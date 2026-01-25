import React, { useState } from 'react';
import { Box, Paper, Typography, Container, TextField, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYCaravanOnlyWeighbridgeGoWeigh = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [caravanHitchedGtm, setCaravanHitchedGtm] = useState('');
  const [caravanUnhitchedAtm, setCaravanUnhitchedAtm] = useState('');
  const [towballMass, setTowballMass] = useState('');

  const handleContinue = () => {
    const baseState = location.state || {};

    const axleWeigh = {
      caravanHitchedGtm: caravanHitchedGtm ? Number(caravanHitchedGtm) : null,
      caravanUnhitchedAtm: caravanUnhitchedAtm ? Number(caravanUnhitchedAtm) : null,
      towballMass: towballMass ? Number(towballMass) : null
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
            Caravan / Trailer Only (registered)
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Weighbridge - goweigh
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Follow goweigh weigh process
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              Caravan / Trailer Hitched
            </Typography>
            <TextField
              value={caravanHitchedGtm}
              onChange={(e) => setCaravanHitchedGtm(e.target.value)}
              placeholder="GTM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              Caravan / Trailer Unhitched
            </Typography>
            <TextField
              value={caravanUnhitchedAtm}
              onChange={(e) => setCaravanUnhitchedAtm(e.target.value)}
              placeholder="ATM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              Towball Mass
            </Typography>
            <TextField
              value={towballMass}
              onChange={(e) => setTowballMass(e.target.value)}
              placeholder="TBM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 4 }}>
            PRO Tip: Make sure no one is standing on the weighbridge.
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

export default DIYCaravanOnlyWeighbridgeGoWeigh;
