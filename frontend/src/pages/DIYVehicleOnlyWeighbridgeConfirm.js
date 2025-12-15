import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  Grid,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [gcm, setGcm] = useState('');
  const [btc, setBtc] = useState('');
  const [tbm, setTbm] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [passengersFront, setPassengersFront] = useState('');
  const [passengersRear, setPassengersRear] = useState('');
  const [hasModifications, setHasModifications] = useState(false);
  const [modifiedImages, setModifiedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const methodSelection = location.state?.methodSelection || '';
  const weighingSelection = location.state?.weighingSelection || '';
  const methodLabel = methodSelection || 'Weighbridge - In Ground - Individual Axle Weights';
  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan/Trailer'
      : 'Vehicle Only';

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
    if (vehicle.gcm != null) {
      setGcm(String(vehicle.gcm));
    }
    if (vehicle.btc != null) {
      setBtc(String(vehicle.btc));
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

  const handleModifiedImageUpload = async (event) => {
    if (modifiedImages.length >= 3) {
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post('/api/uploads/compliance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.url) {
        setModifiedImages((prev) => {
          if (prev.length >= 3) return prev;
          return [...prev, response.data.url];
        });
      }
    } catch (error) {
      console.error('Modified vehicle image upload failed', error);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleConfirm = () => {
    // Navigate to the Weigh Results screen for this special flow. For the
    // Weighbridge axle method we keep the existing equation
    //   Rear = GVM - Front
    // based on two measured values. For the Portable Scales method we derive
    // Front/Rear/GVM from the four-tyre inputs using:
    //   Front Axle Unhitched + Rear Axle Unhitched = GVM Unhitched.

    const axleWeigh = location.state?.axleWeigh || null;
    const tyreWeigh = location.state?.tyreWeigh || null;

    let measuredFrontAxle = '';
    let measuredRearAxle = '';
    let measuredGvm = '';

    if (methodSelection === 'Portable Scales - Individual Tyre Weights' && tyreWeigh) {
      const frontTotal = (Number(tyreWeigh.frontLeft) || 0) + (Number(tyreWeigh.frontRight) || 0);
      const rearTotal = (Number(tyreWeigh.rearLeft) || 0) + (Number(tyreWeigh.rearRight) || 0);
      const gvmTotal = frontTotal + rearTotal;

      measuredFrontAxle = String(frontTotal);
      measuredRearAxle = String(rearTotal);
      measuredGvm = String(gvmTotal);
    } else if (axleWeigh) {
      measuredFrontAxle = axleWeigh.frontAxle != null ? String(axleWeigh.frontAxle) : '';
      measuredGvm = axleWeigh.gvm != null ? String(axleWeigh.gvm) : '';
      // Rear axle will be derived from GVM - Front in the results screen for this method.
    }

    const baseResultsState = {
      rego,
      state,
      description,
      vin,
      // Capacity (manufacturer / Info-Agent ratings)
      frontAxleCapacity: frontAxleLoading,
      rearAxleCapacity: rearAxleLoading,
      gvmCapacity: gvm,
      gcmCapacity: gcm,
      btcCapacity: btc,
      // Measured values
      measuredFrontAxle,
      measuredRearAxle,
      measuredGvm,
      fuelLevel,
      passengersFront,
      passengersRear,
      modifiedImages,
      methodSelection,
      weighingSelection
    };

    if (weighingSelection === 'tow_vehicle_and_caravan') {
      navigate('/tow-caravan-weighbridge-caravan-rego', {
        state: baseResultsState
      });
    } else {
      navigate('/vehicle-only-weighbridge-results', {
        state: baseResultsState
      });
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
            {headingLabel}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {methodLabel}
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Confirm Vehicle Details
          </Typography>

          {weighingSelection === 'tow_vehicle_and_caravan' ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Rego / State */}
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

              {/* Vehicle Description / VIN */}
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

              {/* Front / Rear Axle Loading */}
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

              {/* GVM / GCM */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gross Vehicle Mass (GVM)"
                  value={gvm}
                  onChange={(e) => setGvm(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gross Combination Mass (GCM)"
                  value={gcm}
                  onChange={(e) => setGcm(e.target.value)}
                />
              </Grid>

              {/* BTC / TBM */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Braked Towing Capacity (BTC)"
                  value={btc}
                  onChange={(e) => setBtc(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tow Ball Mass (TBM)"
                  value={tbm}
                  onChange={(e) => setTbm(e.target.value)}
                />
              </Grid>
            </Grid>
          ) : (
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
          )}
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
            <Box sx={{ maxWidth: '60%' }}>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={hasModifications}
                    onChange={(e) => setHasModifications(e.target.checked)}
                    color="primary"
                  />
                )}
                label="If the vehicle has been modified, upload images of the new compliance plate (up to 3 images)"
              />
              {hasModifications && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    component="label"
                    disabled={uploading || modifiedImages.length >= 3}
                  >
                    Upload Image for modified vehicles
                    <input
                      hidden
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleModifiedImageUpload}
                    />
                  </Button>
                  {modifiedImages.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {`Uploaded ${modifiedImages.length} of 3 images`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
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
              2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyWeighbridgeConfirm;
