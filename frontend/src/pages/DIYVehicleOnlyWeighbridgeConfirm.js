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
  FormControlLabel,
  Dialog,
  DialogContent
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DIYVehicleOnlyWeighbridgeConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState({});
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
  const [modifiedImagePreviews, setModifiedImagePreviews] = useState([]);
  const [modifiedPreviewOpen, setModifiedPreviewOpen] = useState(false);
  const [modifiedPreviewIndex, setModifiedPreviewIndex] = useState(0);
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

  useEffect(() => {
    return () => {
      setModifiedImagePreviews((prev) => {
        (Array.isArray(prev) ? prev : []).forEach((p) => {
          if (p?.localUrl) URL.revokeObjectURL(p.localUrl);
        });
        return prev;
      });
    };
  }, []);

  const validate = () => {
    const nextErrors = {};

    const isEmpty = (v) => String(v || '').trim() === '';

    if (isEmpty(rego)) nextErrors.rego = 'Rego Number is required';
    if (isEmpty(state)) nextErrors.state = 'State is required';
    if (isEmpty(description)) nextErrors.description = 'Vehicle Description is required';

    // VIN is optional

    if (isEmpty(frontAxleLoading)) nextErrors.frontAxleLoading = 'Front Axle Loading is required';
    if (isEmpty(rearAxleLoading)) nextErrors.rearAxleLoading = 'Rear Axle Loading is required';
    if (isEmpty(gvm)) nextErrors.gvm = 'Gross Vehicle Mass (GVM) is required';

    // These fields are only shown/used for tow vehicle + caravan selection.
    if (weighingSelection === 'tow_vehicle_and_caravan') {
      if (isEmpty(gcm)) nextErrors.gcm = 'Gross Combination Mass (GCM) is required';
      if (isEmpty(btc)) nextErrors.btc = 'Braked Towing Capacity (BTC) is required';
      if (isEmpty(tbm)) nextErrors.tbm = 'Tow Ball Mass (TBM) is required';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleModifiedImageUpload = async (event) => {
    try {
      setUploading(true);

      if (modifiedImages.length >= 3) return;
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      const remainingSlots = Math.max(0, 3 - modifiedImages.length);
      const files = Array.from(fileList).slice(0, remainingSlots);

      for (const file of files) {
        const isPdf =
          String(file.type).toLowerCase() === 'application/pdf' ||
          String(file.name || '').toLowerCase().endsWith('.pdf');

        const localUrl = URL.createObjectURL(file);
        setModifiedImagePreviews((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          if (next.length >= 3) {
            URL.revokeObjectURL(localUrl);
            return next;
          }
          next.push({ localUrl, isPdf, previewError: false });
          return next;
        });

        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/api/uploads/compliance', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data?.url) {
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
    if (!validate()) {
      window.alert('Please fill all required fields before continuing.');
      return;
    }

    // Navigate to the Weigh Results screen for this special flow. For the
    // Weighbridge axle method we keep the existing equation
    //   Rear = GVM - Front
    // based on two measured values. For the Portable Scales method we derive
    // Front/Rear/GVM from the four-tyre inputs using:
    //   Front Axle Unhitched + Rear Axle Unhitched = GVM Unhitched.

    const preWeigh = location.state?.preWeigh || null;
    const notes = location.state?.notes || '';
    const axleWeigh = location.state?.axleWeigh || null;
    const tyreWeigh = location.state?.tyreWeigh || null;
    const goweighData = location.state?.goweighData || null;
    const vci01 = location.state?.vci01 || null;
    const vci02 = location.state?.vci02 || null;

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
      tbmCapacity: tbm,
      // Measured values
      measuredFrontAxle,
      measuredRearAxle,
      measuredGvm,
      fuelLevel,
      passengersFront,
      passengersRear,
      modifiedImages,
      methodSelection,
      weighingSelection,
      preWeigh,
      axleWeigh,
      tyreWeigh,
      goweighData,
      notes,
      vci01,
      vci02
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
                  required
                  value={rego}
                  onChange={(e) => setRego(e.target.value)}
                  error={Boolean(fieldErrors.rego)}
                  helperText={fieldErrors.rego || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  error={Boolean(fieldErrors.state)}
                  helperText={fieldErrors.state || ''}
                />
              </Grid>

              {/* Vehicle Description / VIN */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vehicle Description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={Boolean(fieldErrors.description)}
                  helperText={fieldErrors.description || ''}
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
                  required
                  value={frontAxleLoading}
                  onChange={(e) => setFrontAxleLoading(e.target.value)}
                  error={Boolean(fieldErrors.frontAxleLoading)}
                  helperText={fieldErrors.frontAxleLoading || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rear Axle Loading"
                  required
                  value={rearAxleLoading}
                  onChange={(e) => setRearAxleLoading(e.target.value)}
                  error={Boolean(fieldErrors.rearAxleLoading)}
                  helperText={fieldErrors.rearAxleLoading || ''}
                />
              </Grid>

              {/* GVM / GCM */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gross Vehicle Mass (GVM)"
                  required
                  value={gvm}
                  onChange={(e) => setGvm(e.target.value)}
                  error={Boolean(fieldErrors.gvm)}
                  helperText={fieldErrors.gvm || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gross Combination Mass (GCM)"
                  required
                  value={gcm}
                  onChange={(e) => setGcm(e.target.value)}
                  error={Boolean(fieldErrors.gcm)}
                  helperText={fieldErrors.gcm || ''}
                />
              </Grid>

              {/* BTC / TBM */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Braked Towing Capacity (BTC)"
                  required
                  value={btc}
                  onChange={(e) => setBtc(e.target.value)}
                  error={Boolean(fieldErrors.btc)}
                  helperText={fieldErrors.btc || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tow Ball Mass (TBM)"
                  required
                  value={tbm}
                  onChange={(e) => setTbm(e.target.value)}
                  error={Boolean(fieldErrors.tbm)}
                  helperText={fieldErrors.tbm || ''}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rego Number"
                  required
                  value={rego}
                  onChange={(e) => setRego(e.target.value)}
                  error={Boolean(fieldErrors.rego)}
                  helperText={fieldErrors.rego || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  error={Boolean(fieldErrors.state)}
                  helperText={fieldErrors.state || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vehicle Description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={Boolean(fieldErrors.description)}
                  helperText={fieldErrors.description || ''}
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
                  required
                  value={frontAxleLoading}
                  onChange={(e) => setFrontAxleLoading(e.target.value)}
                  error={Boolean(fieldErrors.frontAxleLoading)}
                  helperText={fieldErrors.frontAxleLoading || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rear Axle Loading"
                  required
                  value={rearAxleLoading}
                  onChange={(e) => setRearAxleLoading(e.target.value)}
                  error={Boolean(fieldErrors.rearAxleLoading)}
                  helperText={fieldErrors.rearAxleLoading || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Gross Vehicle Mass (GVM)"
                  required
                  value={gvm}
                  onChange={(e) => setGvm(e.target.value)}
                  error={Boolean(fieldErrors.gvm)}
                  helperText={fieldErrors.gvm || ''}
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
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleModifiedImageUpload}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    component="label"
                    disabled={uploading || modifiedImages.length >= 3}
                    sx={{ ml: 2 }}
                  >
                    Take Photo
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleModifiedImageUpload}
                    />
                  </Button>
                  {modifiedImagePreviews.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {modifiedImagePreviews.map((p, idx) =>
                        p?.previewError ? (
                          <Typography
                            // eslint-disable-next-line react/no-array-index-key
                            key={idx}
                            variant="caption"
                            sx={{ display: 'block', cursor: 'pointer' }}
                            onClick={() =>
                              window.open(
                                modifiedImages[idx] || p.localUrl,
                                '_blank',
                                'noopener,noreferrer'
                              )}
                          >
                            Preview unavailable (open file)
                          </Typography>
                        ) : p?.isPdf ? (
                          <Typography
                            // eslint-disable-next-line react/no-array-index-key
                            key={idx}
                            variant="caption"
                            sx={{ display: 'block', cursor: 'pointer' }}
                            onClick={() => {
                              setModifiedPreviewIndex(idx);
                              setModifiedPreviewOpen(true);
                            }}
                          >
                            PDF selected
                          </Typography>
                        ) : (
                          <Box
                            // eslint-disable-next-line react/no-array-index-key
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setModifiedPreviewIndex(idx);
                              setModifiedPreviewOpen(true);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setModifiedPreviewIndex(idx);
                                setModifiedPreviewOpen(true);
                              }
                            }}
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'grey.400',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Click to preview"
                          >
                            <Box
                              component="img"
                              src={p.localUrl || modifiedImages[idx]}
                              alt="Modified compliance plate preview"
                              onError={() =>
                                setModifiedImagePreviews((prev) =>
                                  (Array.isArray(prev) ? prev : []).map((x, i) =>
                                    i === idx ? { ...x, previewError: true } : x
                                  ))}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </Box>
                        )
                      )}
                    </Box>
                  )}
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

          <Dialog
            open={modifiedPreviewOpen}
            onClose={() => setModifiedPreviewOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogContent sx={{ p: 0 }}>
              {modifiedImagePreviews[modifiedPreviewIndex]?.isPdf ||
              modifiedImagePreviews[modifiedPreviewIndex]?.previewError ? (
                <Box
                  component="iframe"
                  src={
                    modifiedImages[modifiedPreviewIndex] ||
                    modifiedImagePreviews[modifiedPreviewIndex]?.localUrl
                  }
                  title="Modified compliance plate"
                  sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
                />
              ) : (
                <Box
                  component="img"
                  src={
                    modifiedImagePreviews[modifiedPreviewIndex]?.localUrl ||
                    modifiedImages[modifiedPreviewIndex]
                  }
                  alt="Modified compliance plate"
                  onError={() =>
                    setModifiedImagePreviews((prev) =>
                      (Array.isArray(prev) ? prev : []).map((x, i) =>
                        i === modifiedPreviewIndex ? { ...x, previewError: true } : x
                      ))}
                  sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </DialogContent>
          </Dialog>

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
