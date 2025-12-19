import React, { useState } from 'react';
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
                    // For now just store a local object URL; backend upload can be wired later
                    const url = URL.createObjectURL(file);
                    setComplianceImage(url);
                  }}
                />
              </Button>
              {complianceImage && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Compliance image selected
                </Typography>
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
