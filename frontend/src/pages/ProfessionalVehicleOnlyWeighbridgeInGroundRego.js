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

const ProfessionalVehicleOnlyWeighbridgeInGroundRego = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rego, setRego] = useState('');
  const [state, setState] = useState('');
  const [vin, setVin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';
  const axleWeigh = location.state?.axleWeigh || null;
  const preWeigh = location.state?.preWeigh || null;

  const handleContinue = async () => {
    setError('');

    if (!rego && !vin) {
      setError('Please enter either a Rego Number or a VIN Number.');
      return;
    }

    try {
      setLoading(true);

      let lookupVehicle = null;
      let lookupSource = null;
      let lookupCaravan = null;
      let caravanLookupSource = null;
      let caravanMasterId = null;

      if (rego) {
        if (weighingSelection === 'caravan_only_registered') {
          const response = await axios.get(`/api/caravans/by-plate/${encodeURIComponent(rego)}`, {
            params: state ? { state } : {},
          });

          console.log('🔎 caravan lookup response (in-ground)', response.data);

          if (response.data?.success && response.data?.found) {
            lookupCaravan = response.data.data?.masterCaravan || null;
            caravanLookupSource = response.data.data?.source || null;
            caravanMasterId = response.data.data?.masterCaravan?._id || null;

            console.log('✅ caravanFromLookup (in-ground)', lookupCaravan);
          }
        } else {
          const response = await axios.get(`/api/vehicles/by-plate/${encodeURIComponent(rego)}`, {
            params: state ? { state } : {}
          });

          if (response.data?.success && response.data?.found) {
            lookupVehicle = response.data.data?.masterVehicle || null;
            lookupSource = response.data.data?.source || null;
          }
        }
      }

      if (weighingSelection === 'caravan_only_registered') {
        if (!lookupCaravan) {
          setError('Caravan not found in database. Please fill details manually on the next screen.');
        }
      } else if (!lookupVehicle) {
        setError('Vehicle not found in database or Info-Agent. Please fill details manually on the next screen.');
      }

      navigate('/professional-vehicle-only-weighbridge-in-ground-confirm', {
        state: {
          rego,
          state,
          vin,
          vehicleFromLookup: lookupVehicle,
          lookupSource,
          caravanFromLookup: lookupCaravan,
          caravanLookupSource,
          caravanMasterId,
          axleWeigh,
          weighingSelection,
          preWeigh,
        }
      });
    } catch (err) {
      console.error('Error looking up vehicle by plate (professional in-ground):', err);

      if (err.response?.status === 404) {
        setError(
          weighingSelection === 'caravan_only_registered'
            ? 'Caravan not found in database. Please fill details manually on the next screen.'
            : 'Vehicle not found in database or Info-Agent. Please fill details manually on the next screen.'
        );
        navigate('/professional-vehicle-only-weighbridge-in-ground-confirm', {
          state: {
            rego,
            state,
            vin,
            vehicleFromLookup: null,
            lookupSource: null,
            caravanFromLookup: null,
            caravanLookupSource: null,
            caravanMasterId: null,
            axleWeigh,
            weighingSelection,
            preWeigh,
          }
        });
      } else {
        const message = err.response?.data?.message || 'Failed to lookup vehicle. Please try again or enter details manually.';
        setError(message);
      }
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
            {weighingSelection === 'tow_vehicle_and_caravan'
              ? 'Tow Vehicle and Caravan / Trailer'
              : weighingSelection === 'caravan_only_registered'
                ? 'Caravan Trailer Only (registered)'
                : 'Vehicle Only'}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Weighbridge - In Ground - Individual Axle Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            {weighingSelection === 'caravan_only_registered'
              ? 'Enter Caravan Trailer Registration'
              : 'Enter Vehicle Registration'}
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
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
              disabled={loading}
            >
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfessionalVehicleOnlyWeighbridgeInGroundRego;
