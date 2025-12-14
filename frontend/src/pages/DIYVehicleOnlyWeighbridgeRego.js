import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  MenuItem,
  Alert
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const DIYVehicleOnlyWeighbridgeRego = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rego, setRego] = useState('');
  const [state, setState] = useState('');
  const [vin, setVin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError('');

    if (!rego && !vin) {
      setError('Please enter either a Rego Number or a VIN Number.');
      return;
    }

    // If we have a rego, use the existing backend lookup which already:
    // 1) checks internal VehicleRegistry,
    // 2) checks recent Weigh records,
    // 3) falls back to Info-Agent API.
    try {
      setLoading(true);

      let lookupVehicle = null;
      let lookupSource = null;

      if (rego) {
        const response = await axios.get(`/api/vehicles/by-plate/${encodeURIComponent(rego)}`, {
          params: state ? { state } : {}
        });

        if (response.data?.success && response.data?.found) {
          lookupVehicle = response.data.data?.masterVehicle || null;
          lookupSource = response.data.data?.source || null;
        }
      }

      if (!lookupVehicle) {
        // If no registry/weigh/Info-Agent hit, still allow user to continue,
        // but show an informational message.
        setError('Vehicle not found in database or Info-Agent. Please fill details manually on the next screen.');
      }

      navigate('/vehicle-only-weighbridge-confirm', {
        state: {
          rego,
          state,
          vin,
          vehicleFromLookup: lookupVehicle,
          lookupSource,
          preWeigh: location.state?.preWeigh || null,
          axleWeigh: location.state?.axleWeigh || null
        }
      });
    } catch (err) {
      console.error('Error looking up vehicle by plate:', err);
      const message = err.response?.data?.message || 'Failed to lookup vehicle. Please try again or enter details manually.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
            Weighbridge - In Ground - Individual Axle Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Enter Vehicle Registration
          </Typography>

          {error && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

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
              select
              fullWidth
              label="Select State"
              value={state}
              onChange={(e) => setState(e.target.value)}
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
              label="Enter VIN Number - Required if no rego is entered above"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
              disabled={loading}
            >
              {loading ? 'Looking up…' : 'Save and Continue'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyWeighbridgeRego;
