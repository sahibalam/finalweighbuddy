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

const DIYTowCaravanWeighbridgeGoWeigh = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // First Weigh (Unhitched)
  const [frontUnhitched, setFrontUnhitched] = useState('');
  const [rearUnhitched, setRearUnhitched] = useState('');
  const [trailerAtm, setTrailerAtm] = useState('');

  // Second Weigh (Hitched)
  const [frontHitched, setFrontHitched] = useState('');
  const [rearHitched, setRearHitched] = useState('');
  const [trailerGtm, setTrailerGtm] = useState('');

  // Summary
  const [gcm, setGcm] = useState('');
  const [tbm, setTbm] = useState('');

  const handleContinue = () => {
    const state = location.state || {};

    const goweighData = {
      firstWeigh: {
        frontUnhitched: frontUnhitched ? Number(frontUnhitched) : null,
        rearUnhitched: rearUnhitched ? Number(rearUnhitched) : null,
        trailerAtm: trailerAtm ? Number(trailerAtm) : null
      },
      secondWeigh: {
        frontHitched: frontHitched ? Number(frontHitched) : null,
        rearHitched: rearHitched ? Number(rearHitched) : null,
        trailerGtm: trailerGtm ? Number(trailerGtm) : null
      },
      summary: {
        gcm: gcm ? Number(gcm) : null,
        tbm: tbm ? Number(tbm) : null
      }
    };

    try {
      window.sessionStorage.setItem('weighbuddy_diy_tow_goweigh', JSON.stringify(goweighData));
    } catch (e) {
      // ignore storage errors
    }

    navigate('/diy-weigh', {
      state: {
        ...state,
        goweighData,
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
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Weighbridge - goweigh
          </Typography>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Follow the goweigh Procedure
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            First Weigh (Unhitched)
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Tow Vehicle Unhitched
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: 180 }}>Front Axle Unhitched</Typography>
            <TextField
              value={frontUnhitched}
              onChange={(e) => setFrontUnhitched(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform A)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ minWidth: 180 }}>Rear Axle Unhitched</Typography>
            <TextField
              value={rearUnhitched}
              onChange={(e) => setRearUnhitched(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform B)</Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Caravan/Trailer Unhitched
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ minWidth: 180 }}>Caravan / Trailer ATM</Typography>
            <TextField
              value={trailerAtm}
              onChange={(e) => setTrailerAtm(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform C)</Typography>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Second Weigh (Hitched)
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Tow Vehicle Hitched
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: 180 }}>Front Axle Hitched</Typography>
            <TextField
              value={frontHitched}
              onChange={(e) => setFrontHitched(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform A)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ minWidth: 180 }}>Rear Axle Hitched</Typography>
            <TextField
              value={rearHitched}
              onChange={(e) => setRearHitched(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform B)</Typography>
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }}>
            Caravan/Trailer Hitched
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ minWidth: 180 }}>Caravan/Trailer GTM</Typography>
            <TextField
              value={trailerGtm}
              onChange={(e) => setTrailerGtm(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg (Platform C)</Typography>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Towing Weights Summary
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: 180 }}>Total Combination Weight (GCM)</Typography>
            <TextField
              value={gcm}
              onChange={(e) => setGcm(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ minWidth: 180 }}>Tow Ball Mass (TBM)</Typography>
            <TextField
              value={tbm}
              onChange={(e) => setTbm(e.target.value)}
              sx={{ width: 140, mr: 1 }}
            />
            <Typography>kg</Typography>
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

export default DIYTowCaravanWeighbridgeGoWeigh;
