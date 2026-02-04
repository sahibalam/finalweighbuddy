import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  MenuItem
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const DIYTowCaravanWeighbridgeCaravanRego = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [rego, setRego] = useState('');
  const [state, setState] = useState('');
  const [vin, setVin] = useState('');

  const handleContinue = async () => {
    const baseState = location.state || {};

    let lookupCaravan = null;
    let lookupSource = null;
    let caravanMasterId = null;

    if (rego) {
      try {
        const response = await axios.get(`/api/caravans/by-plate/${encodeURIComponent(rego)}`, {
          params: state ? { state } : {},
        });

        if (response.data?.success && response.data?.found) {
          lookupCaravan = response.data.data?.masterCaravan || null;
          lookupSource = response.data.data?.source || null;
          caravanMasterId = response.data.data?.masterCaravan?._id || null;
        }
      } catch (e) {
        // Silent fallback to manual entry
        lookupCaravan = null;
        lookupSource = null;
        caravanMasterId = null;
      }
    }

    navigate('/tow-caravan-weighbridge-caravan-confirm', {
      state: {
        ...baseState,
        caravanRego: rego,
        caravanState: state,
        caravanVin: vin
        ,
        caravanFromLookup: lookupCaravan,
        caravanLookupSource: lookupSource,
        caravanMasterId
      }
    });
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
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Enter Caravan/Trailer Registration
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Enter Rego Number"
              value={rego}
              onChange={(e) => setRego(e.target.value)}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Select State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              select
            >
              {STATES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Enter VIN Number - Optional"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
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

export default DIYTowCaravanWeighbridgeCaravanRego;
