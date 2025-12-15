import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYTowCaravanWeighbridgeInGround = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [frontAxle, setFrontAxle] = useState('');
  const [gvmHitched, setGvmHitched] = useState('');
  const [wdhUsed, setWdhUsed] = useState('');
  const [gvmHitchedWdhRelease, setGvmHitchedWdhRelease] = useState('');
  const [trailerGtm, setTrailerGtm] = useState('');

  const handleContinue = () => {
    const state = location.state || {};

    const axleWeigh = {
      frontAxle: frontAxle ? Number(frontAxle) : null,
      gvmHitched: gvmHitched ? Number(gvmHitched) : null,
      wdhUsed,
      gvmHitchedWdhRelease: gvmHitchedWdhRelease ? Number(gvmHitchedWdhRelease) : null,
      trailerGtm: trailerGtm ? Number(trailerGtm) : null
    };

    navigate('/diy-weigh', {
      state: {
        ...state,
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
            Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded
          </Typography>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Weigh Tow Vehicle Hitched to Caravan/Trailer First
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ minWidth: 200 }}>Front Axle</Typography>
            <TextField
              value={frontAxle}
              onChange={(e) => setFrontAxle(e.target.value)}
              sx={{ width: 160, mr: 1 }}
            />
            <Typography>kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ minWidth: 200 }}>GVM Hitched</Typography>
            <TextField
              value={gvmHitched}
              onChange={(e) => setGvmHitched(e.target.value)}
              sx={{ width: 160, mr: 1 }}
            />
            <Typography>kg</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ minWidth: 200 }}>Are you a Weight Distribution Hitch? (WDH)</Typography>
            <FormControl sx={{ width: 160 }}>
              <InputLabel id="wdh-label">WDH</InputLabel>
              <Select
                labelId="wdh-label"
                value={wdhUsed}
                label="WDH"
                onChange={(e) => setWdhUsed(e.target.value)}
              >
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }}>
            If YES: Release the tension on the WDH and re-weigh tow vehicle hitched to caravan/trailer.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ minWidth: 200 }}>GVM Hitched WDH Release</Typography>
            <TextField
              value={gvmHitchedWdhRelease}
              onChange={(e) => setGvmHitchedWdhRelease(e.target.value)}
              sx={{ width: 160, mr: 1 }}
            />
            <Typography>kg</Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Tow Caravan/Trailer onto Weighbridge
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ minWidth: 200 }}>Caravan/Trailer GTM</Typography>
            <TextField
              value={trailerGtm}
              onChange={(e) => setTrailerGtm(e.target.value)}
              sx={{ width: 160, mr: 1 }}
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

export default DIYTowCaravanWeighbridgeInGround;
