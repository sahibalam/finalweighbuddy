import React, { useState, useEffect } from 'react';
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

const DIYVehicleOnlyWeighbridgeConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rego, setRego] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [vin, setVin] = useState('');
  const [frontAxleLoading, setFrontAxleLoading] = useState('');
  const [rearAxleLoading, setRearAxleLoading] = useState('');
  const [gvm, setGvm] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [passengersFront, setPassengersFront] = useState('');
  const [passengersRear, setPassengersRear] = useState('');

  // On mount, hydrate fields from the rego lookup (registry / weigh history / Info-Agent)
  useEffect(() => {
    const stateData = location.state || {};
    const vehicle = stateData.vehicleFromLookup || {};
    const preWeigh = stateData.preWeigh || {};

    console.log('DIYVehicleOnlyWeighbridgeConfirm preWeigh:', preWeigh);

    if (stateData.rego) setRego(stateData.rego.toUpperCase());
    if (stateData.state) setState(stateData.state.toUpperCase());
    if (stateData.vin) setVin(stateData.vin.toUpperCase());

    // Vehicle description from make/model/year/variant
    if (vehicle.make || vehicle.model || vehicle.year || vehicle.variant) {
      const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant]
        .filter(Boolean)
        .map(String);
      setDescription(parts.join(' '));
    }

    if (vehicle.vin && !stateData.vin) {
      setVin(String(vehicle.vin).toUpperCase());
    }

    // Populate axle loading and GVM from lookup data (Info-Agent / registry),
    // not from the DIY axle weighing screen. This screen is about the
    // manufacturer ratings rather than the measured values.
    if (vehicle.fawr != null) {
      setFrontAxleLoading(String(vehicle.fawr));
    }
    if (vehicle.rawr != null) {
      setRearAxleLoading(String(vehicle.rawr));
    }
    if (vehicle.gvm != null) {
      setGvm(String(vehicle.gvm));
    }

    if (preWeigh.fuelLevel != null) {
      setFuelLevel(String(preWeigh.fuelLevel));
    }
    if (preWeigh.passengersFront != null) {
      setPassengersFront(String(preWeigh.passengersFront));
    }
    if (preWeigh.passengersRear != null) {
      setPassengersRear(String(preWeigh.passengersRear));
    }
  }, [location.state]);

  const handleConfirm = () => {
    // Navigate to the Weigh Results screen for this special flow, passing
    // through the key values so it can apply the detailed report equation:
    // Front Axle Unhitched - GVM Unhitched = Rear Axle Unhitched
    navigate('/vehicle-only-weighbridge-results', {
      state: {
        rego,
        state,
        description,
        vin,
        // Capacity (manufacturer / Info-Agent ratings)
        frontAxleCapacity: frontAxleLoading,
        rearAxleCapacity: rearAxleLoading,
        gvmCapacity: gvm,
        // Measured values from DIY axle weigh screen
        measuredFrontAxle: (location.state?.axleWeigh && location.state.axleWeigh.frontAxle) || '',
        measuredGvm: (location.state?.axleWeigh && location.state.axleWeigh.gvm) || '',
        fuelLevel,
        passengersFront,
        passengersRear
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
            Vehicle Only
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Weighbridge - In Ground - Individual Axle Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Confirm Vehicle Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rego Number"
                value={rego}
                onChange={(e) => setRego(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VIN Number"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Front Axle Loading"
                value={frontAxleLoading}
                onChange={(e) => setFrontAxleLoading(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rear Axle Loading"
                value={rearAxleLoading}
                onChange={(e) => setRearAxleLoading(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gross Vehicle Mass (GVM)"
                value={gvm}
                onChange={(e) => setGvm(e.target.value)}
              />
            </Grid>
          </Grid>
          {/* Information box about modified vehicles / missing data */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              border: '1px solid',
              borderColor: 'grey.400',
              borderRadius: 1,
              minHeight: 120
            }}
          >
            <Typography variant="body2" gutterBottom>
              Has the vehicle been modified? Some data missing? Let&apos;s fill it in.
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              How to Find Your Vehicle&apos;s Weigh Capacities:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Owner&apos;s Manual: Look under &quot;Towing a Trailer&quot; for Axle Group Loadings, GVM, GCM, BTC, and TBM.
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              Online Search: Find your vehicle&apos;s make, model, and year brochure (PDF)  the data is usually near the back.
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              How to find if you vehicle has been modified: Check for modification plates, modification sticker with new ratings.
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Bottom action bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => { /* TODO: open image upload dialog for modified vehicles */ }}
            >
              Upload Image for modified vehicles
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
            >
              Confirm Data is Correct
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyWeighbridgeConfirm;
