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
  DialogContent
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DIYCaravanOnlyConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const baseState = location.state || {};
  const methodSelection = baseState.methodSelection || '';

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
  const [caravanComplianceImage, setCaravanComplianceImage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [caravanCompliancePreviewOpen, setCaravanCompliancePreviewOpen] = useState(false);
  const [caravanCompliancePreviewError, setCaravanCompliancePreviewError] = useState(false);
  const [caravanComplianceLocalPreviewUrl, setCaravanComplianceLocalPreviewUrl] = useState('');
  const [caravanComplianceLocalPreviewIsPdf, setCaravanComplianceLocalPreviewIsPdf] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!c || Object.keys(c).length === 0) return;

    if (!make && c.make) setMake(String(c.make));
    if (!model && c.model) setModel(String(c.model));
    if (!year && c.year != null) setYear(String(c.year));

    if (!gtm && c.gtm != null) setGtm(String(c.gtm));
    if (!atm && c.atm != null) setAtm(String(c.atm));

    if (!axleGroups && (c.axleCapacity != null || c.axleGroupLoading != null)) {
      setAxleGroups(String(c.axleCapacity != null ? c.axleCapacity : c.axleGroupLoading));
    }

    if (!tare && (c.tare != null || c.tareMass != null)) {
      setTare(String(c.tare != null ? c.tare : c.tareMass));
    }

    if ((!vin || String(vin).trim() === '') && c.vin) {
      setVin(String(c.vin).toUpperCase());
    }
  }, [baseState.caravanFromLookup, make, model, year, gtm, atm, axleGroups, tare, vin]);

  useEffect(() => {
    setCaravanCompliancePreviewError(false);
  }, [caravanComplianceImage]);

  useEffect(() => {
    return () => {
      if (caravanComplianceLocalPreviewUrl) {
        URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
      }
    };
  }, [caravanComplianceLocalPreviewUrl]);

  const handleConfirm = () => {
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

    navigate('/vehicle-only-weighbridge-results', {
      state: {
        ...baseState,
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
          caravanComplianceImage
        }
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
            WeighBuddy Compliance Check
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Caravan / Trailer Only (registered)
          </Typography>
          {methodSelection && (
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {methodSelection}
            </Typography>
          )}

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
              minHeight: 80
            }}
          >
            <Typography variant="body2" gutterBottom>
              How to Find Your Caravan / Trailers Weigh Capacities
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
              >
                Upload Image of Caravan/Trailer Compliance Plate
                <input
                  hidden
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const isPdf =
                      String(file.type).toLowerCase() === 'application/pdf' ||
                      String(file.name || '').toLowerCase().endsWith('.pdf');

                    setCaravanComplianceLocalPreviewIsPdf(isPdf);
                    setCaravanCompliancePreviewError(false);

                    if (!isPdf) {
                      if (caravanComplianceLocalPreviewUrl) {
                        URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
                      }
                      const url = URL.createObjectURL(file);
                      setCaravanComplianceLocalPreviewUrl(url);
                      setCaravanComplianceImage(url);
                    } else {
                      if (caravanComplianceLocalPreviewUrl) {
                        URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
                      }
                      setCaravanComplianceLocalPreviewUrl('');
                      const url = URL.createObjectURL(file);
                      setCaravanComplianceImage(url);
                    }
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                color="primary"
                component="label"
                sx={{ ml: 2 }}
              >
                Take Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCaravanComplianceLocalPreviewIsPdf(false);
                    setCaravanCompliancePreviewError(false);

                    if (caravanComplianceLocalPreviewUrl) {
                      URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setCaravanComplianceLocalPreviewUrl(url);
                    setCaravanComplianceImage(url);
                  }}
                />
              </Button>
              {(caravanComplianceLocalPreviewUrl || caravanComplianceImage) && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, ml: 2 }}>
                  {caravanCompliancePreviewError ? (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', cursor: 'pointer' }}
                      onClick={() =>
                        window.open(
                          resolveComplianceUrl(caravanComplianceImage) || caravanComplianceLocalPreviewUrl,
                          '_blank',
                          'noopener,noreferrer'
                        )}
                    >
                      Preview unavailable (open file)
                    </Typography>
                  ) : (caravanComplianceLocalPreviewIsPdf ||
                    String(caravanComplianceImage).toLowerCase().endsWith('.pdf')) ? (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Compliance plate PDF selected
                    </Typography>
                  ) : (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setCaravanCompliancePreviewOpen(true)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') setCaravanCompliancePreviewOpen(true);
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
                        src={caravanComplianceLocalPreviewUrl || resolveComplianceUrl(caravanComplianceImage)}
                        alt="Caravan compliance plate preview"
                        onError={() => setCaravanCompliancePreviewError(true)}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </Box>
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
            open={caravanCompliancePreviewOpen}
            onClose={() => setCaravanCompliancePreviewOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogContent sx={{ p: 0 }}>
              {(caravanComplianceLocalPreviewIsPdf ||
                String(caravanComplianceImage).toLowerCase().endsWith('.pdf') ||
                caravanCompliancePreviewError) ? (
                <Box
                  component="iframe"
                  src={resolveComplianceUrl(caravanComplianceImage) || caravanComplianceLocalPreviewUrl}
                  title="Caravan compliance plate"
                  sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
                />
              ) : (
                <Box
                  component="img"
                  src={caravanComplianceLocalPreviewUrl || resolveComplianceUrl(caravanComplianceImage)}
                  alt="Caravan compliance plate"
                  onError={() => setCaravanCompliancePreviewError(true)}
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

export default DIYCaravanOnlyConfirm;
