import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Grid, Paper, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const method = location.state?.method || '';
  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';

  const [fuelPercent, setFuelPercent] = useState('');
  const [frontPassengers, setFrontPassengers] = useState('');
  const [rearPassengers, setRearPassengers] = useState('');
  const [notes, setNotes] = useState('');

  // Tow Vehicle + Caravan specific fields
  const [waterTankCount, setWaterTankCount] = useState('');
  const [waterTanksFull, setWaterTanksFull] = useState('');
  const [waterTotalLitres, setWaterTotalLitres] = useState('');
  const [towballHeightMm, setTowballHeightMm] = useState('');
  const [airbagPressurePsi, setAirbagPressurePsi] = useState('');

  useEffect(() => {
    // Try to hydrate from any pending client saved earlier
    const pendingRaw = window.localStorage.getItem('weighbuddy_pendingClient');
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (pending && pending.firstName && pending.lastName) {
          // We might show this later if needed; for now we just pre-fill notes with client name/email
          const clientLabel = `${pending.firstName} ${pending.lastName}`.trim();
          const emailLabel = pending.email || '';

          setNotes((prev) => {
            if (prev) return prev;
            return (clientLabel || emailLabel)
              ? `Client: ${clientLabel}${emailLabel ? `, Email: ${emailLabel}` : ''}`
              : '';
          });
        }
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  let headingLabel = 'Vehicle Only';

if (weighingSelection === 'tow_vehicle_and_caravan') {
  headingLabel = 'Tow Vehicle and Caravan / Trailer';
} else if (weighingSelection === 'caravan_only_registered') {
  headingLabel = 'Caravan/Trailer Only (Registered)';
}

  const handleContinue = () => {
    if (!method) {
      window.alert('Measurement method is missing. Please go back and select a method.');
      return;
    }

    // Normalise pre-weigh data so it can be shown on the results screen
    const fuelValue = parseFloat(fuelPercent) || 0;
    const passengersFrontValue = parseInt(frontPassengers, 10) || 0;
    const passengersRearValue = parseInt(rearPassengers, 10) || 0;

    const preWeigh = {
      fuelLevel: fuelValue,
      passengersFront: passengersFrontValue,
      passengersRear: passengersRearValue,
      notes,
      // Tow-vehicle + caravan extra context if available
      waterTankCount: waterTankCount || null,
      waterTankFullCount: waterTanksFull || null,
      waterTotalLitres: waterTotalLitres || null,
      towballHeightMm: towballHeightMm || null,
      airbagPressurePsi: airbagPressurePsi || null,
    };

    // Decide which professional measurement screen to go to
    if (method === 'portable-tyres') {
      navigate('/professional-vehicle-only-portable-tyres', {
        state: {
          weighingSelection,
          preWeigh,
        },
      });
    } else if (method === 'weighbridge-in-ground') {
      navigate('/professional-vehicle-only-weighbridge-in-ground', {
        state: {
          weighingSelection,
          preWeigh,
        },
      });
    } else if (method === 'weighbridge-goweigh') {
      navigate('/professional-vehicle-only-weighbridge-goweigh', {
        state: {
          weighingSelection,
          preWeigh,
        },
      });
    } else {
      window.alert('Unsupported method selection.');
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
      <Paper
        elevation={2}
        sx={{
          p: 4,
          borderRadius: 2,
          maxWidth: 900,
          width: '100%',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          {headingLabel}
        </Typography>
        <Typography
          variant="h5"
          sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}
        >
          Important information to start the weighing process
        </Typography>

     {weighingSelection !== 'caravan_only_registered' && (
  <>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" sx={{ minWidth: 140 }}>
            Fuel in Vehicle
          </Typography>
          <TextField
            label="Fuel level"
            value={fuelPercent}
            onChange={(e) => setFuelPercent(e.target.value)}
            sx={{ width: 140 }}
          />
          <Typography variant="subtitle1">%</Typography>
        </Box>
      </Grid>
    </Grid>

    <Typography variant="subtitle1" sx={{ mb: 1 }}>
      Passengers
    </Typography>
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel id="front-passengers-label">Front</InputLabel>
          <Select
            labelId="front-passengers-label"
            label="Front"
            value={frontPassengers}
            onChange={(e) => setFrontPassengers(e.target.value)}
          >
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
            <MenuItem value="3">3</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel id="rear-passengers-label">Rear</InputLabel>
          <Select
            labelId="rear-passengers-label"
            label="Rear"
            value={rearPassengers}
            onChange={(e) => setRearPassengers(e.target.value)}
          >
            <MenuItem value="0">0</MenuItem>
            <MenuItem value="1">1</MenuItem>
            <MenuItem value="2">2</MenuItem>
            <MenuItem value="3">3</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  </>
)}

        {(weighingSelection === 'tow_vehicle_and_caravan' ||
  weighingSelection === 'caravan_only_registered') && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Water in Caravan/Trailer
            </Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Number of Tanks 1-5"
                  value={waterTankCount}
                  onChange={(e) => setWaterTankCount(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Number full"
                  value={waterTanksFull}
                  onChange={(e) => setWaterTanksFull(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="Total Ltrs"
                    value={waterTotalLitres}
                    onChange={(e) => setWaterTotalLitres(e.target.value)}
                  />
                  <Typography variant="subtitle1">Ltrs</Typography>
                </Box>
              </Grid>
            </Grid>

         <Grid container spacing={3} sx={{ mb: 4 }}>
  <Grid item xs={12} md={6}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="subtitle1" sx={{ minWidth: 140 }}>
        Towball Height
      </Typography>
      <TextField
        label="Towball Height"
        value={towballHeightMm}
        onChange={(e) => setTowballHeightMm(e.target.value)}
        sx={{ width: 160 }}
      />
      <Typography variant="subtitle1">mm</Typography>
    </Box>
  </Grid>

  {weighingSelection === 'tow_vehicle_and_caravan' && (
    <Grid item xs={12} md={6}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="subtitle1" sx={{ minWidth: 140 }}>
          Airbag Pressure
        </Typography>
        <TextField
          label="Airbag Pressure"
          value={airbagPressurePsi}
          onChange={(e) => setAirbagPressurePsi(e.target.value)}
          sx={{ width: 160 }}
        />
        <Typography variant="subtitle1">psi</Typography>
      </Box>
    </Grid>
  )}
</Grid>
          </>
        )}

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Additional Information/Notes
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={4}
          placeholder="For example: is the setup level? Client would like to add long range fuel tank, additional water storage, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="body2" sx={{ color: 'orange', mb: 4 }}>
          Warning: It is important to keep all parameters the same when recording weights.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleContinue}>
            Save and Continue
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfessionalVehicleOnlyInfo;
