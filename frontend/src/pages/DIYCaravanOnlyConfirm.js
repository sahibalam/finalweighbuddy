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
  const [complianceImage, setComplianceImage] = useState('');
  const [compliancePreviewOpen, setCompliancePreviewOpen] = useState(false);
  const [compliancePreviewError, setCompliancePreviewError] = useState(false);
  const [complianceLocalPreviewUrl, setComplianceLocalPreviewUrl] = useState('');
  const [complianceLocalPreviewIsPdf, setComplianceLocalPreviewIsPdf] = useState(false);

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

  const handleConfirm = () => {
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
          complianceImage
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
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
                value={atm}
                onChange={(e) => setAtm(e.target.value)}
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
                value={tare}
                onChange={(e) => setTare(e.target.value)}
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

                    setComplianceLocalPreviewIsPdf(isPdf);
                    setCompliancePreviewError(false);

                    if (!isPdf) {
                      if (complianceLocalPreviewUrl) {
                        URL.revokeObjectURL(complianceLocalPreviewUrl);
                      }
                      const url = URL.createObjectURL(file);
                      setComplianceLocalPreviewUrl(url);
                      setComplianceImage(url);
                    } else {
                      if (complianceLocalPreviewUrl) {
                        URL.revokeObjectURL(complianceLocalPreviewUrl);
                      }
                      setComplianceLocalPreviewUrl('');
                      const url = URL.createObjectURL(file);
                      setComplianceImage(url);
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
                    setComplianceLocalPreviewIsPdf(false);
                    setCompliancePreviewError(false);

                    if (complianceLocalPreviewUrl) {
                      URL.revokeObjectURL(complianceLocalPreviewUrl);
                    }
                    const url = URL.createObjectURL(file);
                    setComplianceLocalPreviewUrl(url);
                    setComplianceImage(url);
                  }}
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
                          complianceImage || complianceLocalPreviewUrl,
                          '_blank',
                          'noopener,noreferrer'
                        )}
                    >
                      Preview unavailable (open file)
                    </Typography>
                  ) : complianceLocalPreviewIsPdf ? (
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      Compliance plate PDF selected
                    </Typography>
                  ) : (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setCompliancePreviewOpen(true)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') setCompliancePreviewOpen(true);
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
                        src={complianceLocalPreviewUrl || complianceImage}
                        alt="Caravan compliance plate preview"
                        onError={() => setCompliancePreviewError(true)}
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
            open={compliancePreviewOpen}
            onClose={() => setCompliancePreviewOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogContent sx={{ p: 0 }}>
              {(complianceLocalPreviewIsPdf || compliancePreviewError) ? (
                <Box
                  component="iframe"
                  src={complianceImage || complianceLocalPreviewUrl}
                  title="Caravan compliance plate"
                  sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
                />
              ) : (
                <Box
                  component="img"
                  src={complianceLocalPreviewUrl || complianceImage}
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

export default DIYCaravanOnlyConfirm;
