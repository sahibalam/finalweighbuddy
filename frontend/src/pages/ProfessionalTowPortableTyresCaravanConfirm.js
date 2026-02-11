import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogContent,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfessionalTowPortableTyresCaravanConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const baseState = location.state || {};

  const [rego, setRego] = useState(baseState.caravanRego || '');
  const [state, setState] = useState(baseState.caravanState || '');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState(baseState.caravanVin || '');
  const [gtm, setGtm] = useState('');
  const [atm, setAtm] = useState('');
  const [axleGroups, setAxleGroups] = useState('');
  const [tare, setTare] = useState('');
  const [complianceImage, setComplianceImage] = useState('');
  const [compliancePreviewOpen, setCompliancePreviewOpen] = useState(false);
  const [compliancePreviewError, setCompliancePreviewError] = useState(false);
  const [complianceLocalPreviewUrl, setComplianceLocalPreviewUrl] = useState('');
  const [complianceLocalPreviewIsPdf, setComplianceLocalPreviewIsPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const resolveComplianceUrl = (url) => {
    if (!url) return '';
    const raw = String(url);
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
    if (raw.startsWith('/uploads/')) {
      const base = axios?.defaults?.baseURL ? String(axios.defaults.baseURL).replace(/\/$/, '') : '';
      return base ? `${base}${raw}` : raw;
    }
    return raw;
  };

  useEffect(() => {
    const c = baseState.caravanFromLookup || {};
    if (!c) return;

    if (!make && c.make) setMake(String(c.make));
    if (!model && c.model) setModel(String(c.model));
    if (!year && c.year != null) setYear(String(c.year));

    if (!gtm && c.gtm != null) setGtm(String(c.gtm));
    if (!atm && c.atm != null) setAtm(String(c.atm));

    if (!axleGroups && (c.axleCapacity != null || c.axleGroupLoading != null)) {
      setAxleGroups(String(c.axleCapacity != null ? c.axleCapacity : c.axleGroupLoading));
    }

    if ((!vin || String(vin).trim() === '') && c.vin) {
      setVin(String(c.vin).toUpperCase());
    }

    if (!complianceImage && c.complianceImage) {
      const url = String(c.complianceImage);
      setComplianceLocalPreviewUrl('');
      setComplianceLocalPreviewIsPdf(url.toLowerCase().endsWith('.pdf'));
      setCompliancePreviewError(false);
      setComplianceImage(url);
    }
  }, [baseState.caravanFromLookup, make, model, year, gtm, atm, axleGroups, vin, complianceImage, complianceLocalPreviewUrl]);

  useEffect(() => {
    setCompliancePreviewError(false);
  }, [complianceImage]);

  useEffect(() => {
    return () => {
      if (complianceLocalPreviewUrl) {
        URL.revokeObjectURL(complianceLocalPreviewUrl);
      }
    };
  }, [complianceLocalPreviewUrl]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf =
      String(file.type).toLowerCase() === 'application/pdf' ||
      String(file.name || '').toLowerCase().endsWith('.pdf');

    setComplianceLocalPreviewIsPdf(isPdf);
    setCompliancePreviewError(false);

    if (!isPdf) {
      if (complianceLocalPreviewUrl) {
        URL.revokeObjectURL(complianceLocalPreviewUrl);
      }
      setComplianceLocalPreviewUrl(URL.createObjectURL(file));
    } else {
      if (complianceLocalPreviewUrl) {
        URL.revokeObjectURL(complianceLocalPreviewUrl);
      }
      setComplianceLocalPreviewUrl('');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post('/api/uploads/compliance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.url) {
        setComplianceImage(response.data.url);
      }
    } catch (error) {
      console.error('Caravan compliance image upload failed', error);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleConfirm = async () => {
    const nextErrors = {};
    const isEmpty = (v) => String(v || '').trim() === '';

    if (isEmpty(rego)) nextErrors.rego = 'Rego Number is required';
    if (isEmpty(state)) nextErrors.state = 'State is required';
    if (isEmpty(make)) nextErrors.make = 'Make is required';
    if (isEmpty(model)) nextErrors.model = 'Model is required';
    if (isEmpty(year)) nextErrors.year = 'Year is required';

    // VIN optional
    // GTM optional
    // Axle Group Loadings optional

    if (isEmpty(atm)) nextErrors.atm = 'Aggregate Trailer Mass (ATM) is required';
    if (isEmpty(tare)) nextErrors.tare = 'Tare Mass Weight is required';

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.alert('Please fill all required fields before continuing.');
      return;
    }

    if (saving) return;
    setSaving(true);

    try {
      const safeNum = (v) => (v != null && v !== '' ? Number(v) || 0 : 0);

      // Ensure we have a Vehicle document ID (required by POST /api/weighs)
      let vehicleId = baseState.vehicleMasterId || null;

      if (!vehicleId) {
        const descriptionParts = String(baseState.description || '').split(' ').filter(Boolean);
        const vehicleYearRaw = descriptionParts[0] || baseState.vehicleYear || baseState.year;
        const vehicleYear = safeNum(vehicleYearRaw) || new Date().getFullYear();

        const vehicleMakeFromDesc = descriptionParts[1] || '';
        const vehicleModelFromDesc = descriptionParts[2] || '';
        const vehicleVariantFromDesc = descriptionParts.slice(3).join(' ') || '';

        const vehicleMake = String(baseState.vehicleMake || vehicleMakeFromDesc || 'Unknown').trim();
        const vehicleModel = String(baseState.vehicleModel || vehicleModelFromDesc || 'Unknown').trim();
        const vehicleVariant = String(baseState.vehicleVariant || vehicleVariantFromDesc || 'Base').trim();

        const upsertVehicleResp = await axios.post('/api/vehicles/master-upsert', {
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear,
          variant: vehicleVariant,
          fawr: safeNum(baseState.frontAxleCapacity),
          rawr: safeNum(baseState.rearAxleCapacity),
          gvm: safeNum(baseState.gvmCapacity),
          btc: safeNum(baseState.btcCapacity),
          tbm: safeNum(baseState.tbmCapacity),
          gcm: safeNum(baseState.gcmCapacity),
        });

        vehicleId = upsertVehicleResp.data?.data?._id || null;
      }

      // Create/reuse a Caravan master record (required by POST /api/weighs)
      const axleCapacityFromInput = safeNum(axleGroups);
      const axleCapacityFromGtm = safeNum(gtm);
      const axleCapacity = axleCapacityFromInput || axleCapacityFromGtm;

      const upsertCaravanResp = await axios.post('/api/caravans/master-upsert', {
        make,
        model,
        year: safeNum(year) || new Date().getFullYear(),
        atm: safeNum(atm),
        gtm: safeNum(gtm),
        axleCapacity,
        numberOfAxles: 'Single',
      });

      const caravanId = upsertCaravanResp.data?.data?._id || null;

      // Measured weights (portable tyres: derived from VCI01 + caravan GTM + TBM)
      const axleWeigh = baseState.axleWeigh || {};
      const vci01 = baseState.vci01 || null;
      const hitchWeigh = vci01?.hitchWeigh || null;

      const hitchedFront = hitchWeigh
        ? safeNum(hitchWeigh.frontLeft) + safeNum(hitchWeigh.frontRight)
        : safeNum(baseState.measuredFrontAxle);

      const hitchedRear = hitchWeigh
        ? safeNum(hitchWeigh.rearLeft) + safeNum(hitchWeigh.rearRight)
        : safeNum(baseState.measuredRearAxle);

      const gvmHitched = hitchedFront + hitchedRear;
      const gtmMeasured = safeNum(axleWeigh.trailerGtm);
      const tbmMeasured = baseState.towBallMass != null ? safeNum(baseState.towBallMass) : 0;
      const gcmMeasured = gvmHitched + gtmMeasured;

      // Customer details: for professional flow we save under the logged-in pro user
      // and use placeholders if client details are not in state.
      let diyClientUserId = null;
      try {
        const draftRaw = localStorage.getItem('professionalClientDraft');
        const draft = draftRaw ? JSON.parse(draftRaw) : null;
        diyClientUserId = draft?.diyClientUserId || null;
      } catch (e) {
        diyClientUserId = null;
      }

      const payload = {
        customerName: baseState.customerName || 'Professional Client',
        customerPhone: baseState.customerPhone || 'N/A',
        customerEmail: baseState.customerEmail || 'unknown@example.com',
        clientUserId: diyClientUserId,
        vehicleId,
        caravanId,
        vehicleNumberPlate: baseState.rego || '',
        vehicleState: baseState.state || baseState.vehicleState || '',
        vehicleDescription: baseState.description || '',
        vehicleVin: baseState.vin || '',
        caravanNumberPlate: rego || '',
        caravanState: state || '',
        caravanDescription: [year, make, model].filter(Boolean).map(String).join(' '),
        caravanVin: vin || '',
        caravanComplianceImage: complianceImage || '',
        caravanTare: tare,
        weights: {
          frontAxle: hitchedFront,
          rearAxle: hitchedRear,
          totalVehicle: gvmHitched,
          frontAxleGroup: 0,
          rearAxleGroup: 0,
          totalCaravan: gtmMeasured,
          grossCombination: gcmMeasured,
          tbm: tbmMeasured,
          raw: {
            axleWeigh: baseState.axleWeigh || null,
            vci01: baseState.vci01 || null,
            vci02: baseState.vci02 || null,
            towBallMass: baseState.towBallMass != null ? safeNum(baseState.towBallMass) : null,
          },
        },
        preWeigh: baseState.preWeigh || null,
        notes: baseState.notes || '',
      };

      const saveResp = await axios.post('/api/weighs', payload);
      const savedWeighId = saveResp?.data?.weigh?._id || saveResp?.data?.weighId || null;

      const enhancedState = {
        ...baseState,
        weighId: savedWeighId,
        alreadySaved: true,
        axleWeigh: {
          ...(baseState.axleWeigh || {}),
        },
        caravan: {
          rego,
          state,
          make,
          model,
          year,
          vin,
          gtm,
          atm,
          axleGroups,
          tare,
          complianceImage,
        },
      };

      navigate('/vehicle-only-weighbridge-results', {
        state: enhancedState,
      });
    } catch (error) {
      console.error(
        'Failed to save professional tow+caravan portable weigh:',
        error?.response?.data || error
      );
    } finally {
      setSaving(false);
    }
  };

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
          <Typography variant="h6" sx={{ mb: 1 }}>
            Tow Vehicle and Caravan/Trailer
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Portable Scales - Individual Tyre Weights
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
                label="Make"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                error={Boolean(fieldErrors.make)}
                helperText={fieldErrors.make || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                error={Boolean(fieldErrors.model)}
                helperText={fieldErrors.model || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                error={Boolean(fieldErrors.year)}
                helperText={fieldErrors.year || ''}
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
                value={gtm}
                onChange={(e) => setGtm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Aggregate Trailer Mass (ATM)"
                required
                value={atm}
                onChange={(e) => setAtm(e.target.value)}
                error={Boolean(fieldErrors.atm)}
                helperText={fieldErrors.atm || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Axle Group Loadings"
                value={axleGroups}
                onChange={(e) => setAxleGroups(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tare Mass Weight"
                required
                value={tare}
                onChange={(e) => setTare(e.target.value)}
                error={Boolean(fieldErrors.tare)}
                helperText={fieldErrors.tare || ''}
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
                  onChange={handleUpload}
                />
              </Button>
              <Button
                variant="outlined"
                color="primary"
                component="label"
                disabled={uploading}
                sx={{ ml: 2 }}
              >
                Take Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUpload}
                />
              </Button>
              {(complianceLocalPreviewUrl || complianceImage) && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, ml: 2 }}>
                  {compliancePreviewError ? (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', cursor: 'pointer' }}
                      onClick={() =>
                        window.open(
                          resolveComplianceUrl(complianceImage) || complianceLocalPreviewUrl,
                          '_blank',
                          'noopener,noreferrer'
                        )}
                    >
                      Preview unavailable (open file)
                    </Typography>
                  ) : (complianceLocalPreviewIsPdf ||
                    String(complianceImage).toLowerCase().endsWith('.pdf')) ? (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Compliance plate PDF selected
                    </Typography>
                  ) : (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setCompliancePreviewOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setCompliancePreviewOpen(true);
                      }}
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.400',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Click to preview"
                    >
                      <Box
                        component="img"
                        src={complianceLocalPreviewUrl || resolveComplianceUrl(complianceImage)}
                        alt="Caravan compliance plate preview"
                        onError={() => setCompliancePreviewError(true)}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            <Button variant="contained" color="primary" onClick={handleConfirm}>
              Confirm Data is Correct
            </Button>
          </Box>

          <Dialog
            open={compliancePreviewOpen}
            onClose={() => setCompliancePreviewOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogContent sx={{ p: 0 }}>
              {(complianceLocalPreviewIsPdf ||
                String(complianceImage).toLowerCase().endsWith('.pdf') ||
                compliancePreviewError) ? (
                <Box
                  component="iframe"
                  src={resolveComplianceUrl(complianceImage) || complianceLocalPreviewUrl}
                  title="Caravan compliance plate"
                  sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
                />
              ) : (
                <Box
                  component="img"
                  src={complianceLocalPreviewUrl || resolveComplianceUrl(complianceImage)}
                  alt="Caravan compliance plate"
                  onError={() => setCompliancePreviewError(true)}
                  sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
              )}
            </DialogContent>
          </Dialog>

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

export default ProfessionalTowPortableTyresCaravanConfirm;
