import React, { useEffect, useState } from 'react';
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

const ProfessionalVehicleOnlyWeighbridgeGoWeighConfirm = () => {
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
  const [hasModifications, setHasModifications] = useState(false);
  const [modifiedImages, setModifiedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Caravan-only specific fields (mirroring ProfessionalVehicleOnlyPortableTyresConfirm)
  const [caravanMake, setCaravanMake] = useState('');
  const [caravanModel, setCaravanModel] = useState('');
  const [caravanYear, setCaravanYear] = useState('');
  const [caravanGtm, setCaravanGtm] = useState('');
  const [caravanAtm, setCaravanAtm] = useState('');
  const [caravanAxleGroups, setCaravanAxleGroups] = useState('');
  const [caravanTare, setCaravanTare] = useState('');
  const [caravanComplianceImage, setCaravanComplianceImage] = useState('');

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';

  useEffect(() => {
    const stateData = location.state || {};
    const vehicle = stateData.vehicleFromLookup || {};

    if (stateData.rego) setRego(String(stateData.rego).toUpperCase());
    if (stateData.state) setState(String(stateData.state).toUpperCase());
    if (stateData.vin) setVin(String(stateData.vin).toUpperCase());

    if (vehicle.make || vehicle.model || vehicle.year || vehicle.variant) {
      const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant]
        .filter(Boolean)
        .map(String);
      setDescription(parts.join(' '));
    }

    if (vehicle.vin && !stateData.vin) {
      setVin(String(vehicle.vin).toUpperCase());
    }

    if (vehicle.fawr != null) setFrontAxleLoading(String(vehicle.fawr));
    if (vehicle.rawr != null) setRearAxleLoading(String(vehicle.rawr));
    if (vehicle.gvm != null) setGvm(String(vehicle.gvm));
    if (vehicle.gcm != null) setGcm(String(vehicle.gcm));
    if (vehicle.btc != null) setBtc(String(vehicle.btc));
    if (vehicle.tbm != null) setTbm(String(vehicle.tbm));
  }, [location.state]);

  const handleModifiedImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post('/api/uploads/compliance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.url) {
        // For caravan-only, store a single compliance plate image.
        if (weighingSelection === 'caravan_only_registered') {
          setCaravanComplianceImage(response.data.url);
        } else {
          setModifiedImages((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, response.data.url];
          });
        }
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
    const pendingRaw = window.localStorage.getItem('weighbuddy_pendingClient');
    let pendingClient = null;

    if (pendingRaw) {
      try {
        pendingClient = JSON.parse(pendingRaw);
      } catch (e) {
        console.error('Failed to parse pending client from localStorage', e);
      }
    }

    const createDiyClient = async () => {
      if (!pendingClient || pendingClient.clientType !== 'new') return;

      try {
        setSaving(true);
        await axios.post('/api/auth/create-diy-client-from-professional', {
          firstName: pendingClient.firstName,
          lastName: pendingClient.lastName,
          email: pendingClient.email,
          phone: pendingClient.phone,
          password: pendingClient.password,
        });
      } catch (error) {
        console.error('Failed to create DIY client from professional flow', error);
      } finally {
        setSaving(false);
      }
    };

    const axleWeigh = location.state?.axleWeigh || null;
    const goweighData = location.state?.goweighData || null;

    createDiyClient().finally(() => {
      const baseState = {
        rego,
        state,
        description,
        vin,
        frontAxleCapacity: frontAxleLoading,
        rearAxleCapacity: rearAxleLoading,
        gvmCapacity: gvm,
        gcmCapacity: gcm,
        btcCapacity: btc,
        tbmCapacity: tbm,
        measuredFrontAxle: axleWeigh?.frontAxleUnhitched ?? '',
        measuredRearAxle: '',
        measuredGvm: axleWeigh?.gvmUnhitched ?? '',
        fuelLevel: '',
        passengersFront: '',
        passengersRear: '',
        modifiedImages,
        methodSelection: 'Weighbridge - goweigh',
        weighingSelection,
        axleWeigh,
        goweighData,
      };

      if (weighingSelection === 'caravan_only_registered') {
        // Caravan-only GoWeigh: go straight to results with caravan details.
        const enhancedState = {
          ...baseState,
          caravan: {
            rego,
            state,
            make: caravanMake,
            model: caravanModel,
            year: caravanYear,
            vin,
            gtm: caravanGtm,
            atm: caravanAtm,
            axleGroups: caravanAxleGroups,
            tare: caravanTare,
            complianceImage: caravanComplianceImage,
          },
        };

        navigate('/vehicle-only-weighbridge-results', {
          state: enhancedState,
        });
      } else if (weighingSelection === 'tow_vehicle_and_caravan') {
        // For tow vehicle + caravan GoWeigh, go to caravan registration next.
        navigate('/tow-caravan-weighbridge-caravan-rego', {
          state: baseState,
        });
      } else {
        // Vehicle-only GoWeigh continues straight to results.
        navigate('/vehicle-only-weighbridge-results', {
          state: baseState,
        });
      }
    });
  };

  const renderCaravanConfirmLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Caravan Trailer Only (registered)
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Weighbridge - goweigh
      </Typography>

      <Typography
        variant="h5"
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Confirm Caravan/Trailer Details
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
            label="Make"
            value={caravanMake}
            onChange={(e) => setCaravanMake(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model"
            value={caravanModel}
            onChange={(e) => setCaravanModel(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Year"
            value={caravanYear}
            onChange={(e) => setCaravanYear(e.target.value)}
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
            label="Gross Trailer Mass (GTM)"
            value={caravanGtm}
            onChange={(e) => setCaravanGtm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Aggregate Trailer Mass (ATM)"
            value={caravanAtm}
            onChange={(e) => setCaravanAtm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Axle Group Loadings"
            value={caravanAxleGroups}
            onChange={(e) => setCaravanAxleGroups(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tare Mass Weight"
            value={caravanTare}
            onChange={(e) => setCaravanTare(e.target.value)}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'grey.400',
          borderRadius: 1,
          minHeight: 80,
        }}
      >
        <Typography variant="body2" gutterBottom>
          How to Find Your Caravan / Trailer's Weigh Capacities
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 12 }}>
          Compliance plates are usually found on the drawbar, in the front tunnel box or inside the door.
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Box>
          <Button
            variant="contained"
            color="primary"
            component="label"
            disabled={uploading}
          >
            Upload Image of Caravan/Trailer Compliance Plate
            <input
              hidden
              type="file"
              accept="image/*,application/pdf"
              onChange={handleModifiedImageUpload}
            />
          </Button>
          {caravanComplianceImage && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Compliance image uploaded
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={saving}
        >
          Confirm Data is Correct
        </Button>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
            flexDirection: 'column',
          }}
        >
          {weighingSelection === 'caravan_only_registered' ? (
            renderCaravanConfirmLayout()
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {weighingSelection === 'tow_vehicle_and_caravan'
                  ? 'Tow Vehicle and Caravan / Trailer'
                  : 'Vehicle Only'}
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Weighbridge - goweigh
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Gross Combination Mass (GCM)"
                    value={gcm}
                    onChange={(e) => setGcm(e.target.value)}
                  />
                </Grid>
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

              <Box
                sx={{
                  mt: 4,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'grey.400',
                  borderRadius: 1,
                  minHeight: 120,
                }}
              >
                <Typography variant="body2" gutterBottom>
                  Has the vehicle been modified? Some data missing? Let's fill it in.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  How to Find Your Vehicle's Weigh Capacities:
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  Owner's Manual: Look under "Towing a Trailer" for Axle Group Loadings, GVM, GCM, BTC, and TBM.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  Online Search: Find your vehicle's make, model, and year brochure (PDF) – the data is usually near the back.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  How to find if your vehicle has been modified: Check for modification plates, modification sticker with new ratings.
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1 }} />

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
                  disabled={saving}
                >
                  Confirm Data is Correct
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
;

export default ProfessionalVehicleOnlyWeighbridgeGoWeighConfirm;
