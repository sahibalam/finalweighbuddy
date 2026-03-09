import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYTowCaravanInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const towSetupType = location.state?.towSetupType || 'caravan';
  const towSetupLabel =
    towSetupType === 'boat' ? 'Boat' : towSetupType === 'trailer' ? 'Trailer' : 'Caravan';

  const baseState = location.state || {};
  const { methodSelection } = baseState;
  const isWeighbridgeTowMethod =
    methodSelection ===
      'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded' ||
    methodSelection === 'Weighbridge - goweigh' ||
    methodSelection ===
      'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.';

  const [fuelLevel, setFuelLevel] = useState('');
  const [frontPassengers, setFrontPassengers] = useState('');
  const [rearPassengers, setRearPassengers] = useState('');
  const [towedAxleConfig, setTowedAxleConfig] = useState(baseState.towedAxleConfig || '');
  const [waterTankCount, setWaterTankCount] = useState('');
  const [waterTankFullCount, setWaterTankFullCount] = useState('');
  const [waterTotalLitres, setWaterTotalLitres] = useState('');
  const [notes, setNotes] = useState('');

  const handleContinue = () => {
    if (isWeighbridgeTowMethod && !towedAxleConfig) {
      window.alert('Please select the towed setup axle configuration.');
      return;
    }

    const fuelValue = parseFloat(fuelLevel) || 0;
    const passengersFrontValue = parseInt(frontPassengers, 10) || 0;
    const passengersRearValue = parseInt(rearPassengers, 10) || 0;

    const preWeigh = {
      fuelLevel: fuelValue,
      passengersFront: passengersFrontValue,
      passengersRear: passengersRearValue,
      towedAxleConfig: towedAxleConfig || null,
      waterTankCount: waterTankCount || null,
      waterTankFullCount: waterTankFullCount || null,
      waterTotalLitres: waterTotalLitres || null,
      notes
    };

    try {
      window.sessionStorage.setItem('weighbuddy_diy_tow_preweigh', JSON.stringify(preWeigh));
    } catch (e) {
      // ignore storage errors
    }

    let nextPath = '/diy-weigh';

    if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
      nextPath = '/tow-caravan-portable-tyres';
    } else if (methodSelection === 'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded') {
      nextPath = '/tow-caravan-weighbridge-in-ground';
    } else if (methodSelection === 'Weighbridge - goweigh') {
      nextPath = '/tow-caravan-weighbridge-goweigh';
    } else if (methodSelection === 'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.') {
      nextPath = '/tow-caravan-weighbridge-above-ground';
    }

    navigate(nextPath, {
      state: {
        ...baseState,
        towedAxleConfig,
        preWeigh
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
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}
          >
            Important information to start the weighing process
          </Typography>

          {isWeighbridgeTowMethod && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography
                variant="body1"
                sx={{ minWidth: 150 }}
              >
                {`${towSetupLabel} Axle Config`}
              </Typography>
              <FormControl sx={{ width: 220 }} size="small">
                <InputLabel id="towed-axle-config-label">Axle Config</InputLabel>
                <Select
                  labelId="towed-axle-config-label"
                  label="Axle Config"
                  value={towedAxleConfig}
                  onChange={(e) => setTowedAxleConfig(e.target.value)}
                >
                  <MenuItem value="Single Axle">Single Axle</MenuItem>
                  <MenuItem value="Dual Axle">Dual Axle</MenuItem>
                  <MenuItem value="Triple Axle">Triple Axle</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 150 }}
            >
              Fuel in Vehicle
            </Typography>
            <TextField
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              placeholder="Fuel level"
              sx={{ width: 200, mr: 2 }}
            />
            <Typography variant="body1">%</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 150 }}
            >
              Passengers
            </Typography>
            <FormControl sx={{ mr: 2, width: 200 }} size="small">
              <InputLabel id="front-passengers-label">Front</InputLabel>
              <Select
                labelId="front-passengers-label"
                label="Front"
                value={frontPassengers}
                onChange={(e) => setFrontPassengers(e.target.value)}
              >
                <MenuItem value="0">0</MenuItem>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ width: 200 }} size="small">
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
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 150 }}
            >
              {`Water in ${towSetupLabel}`}
            </Typography>
            <TextField
              value={waterTankCount}
              onChange={(e) => setWaterTankCount(e.target.value)}
              placeholder="Number of Tanks 1-5"
              sx={{ width: 180, mr: 2 }}
            />
            <TextField
              value={waterTankFullCount}
              onChange={(e) => setWaterTankFullCount(e.target.value)}
              placeholder="Number full"
              sx={{ width: 140, mr: 2 }}
            />
            <TextField
              value={waterTotalLitres}
              onChange={(e) => setWaterTotalLitres(e.target.value)}
              placeholder="Total Ltrs"
              sx={{ width: 140, mr: 1 }}
            />
            <Typography variant="body1">Ltrs</Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{ mb: 4 }}
          >
            <span style={{ color: '#ff9800', fontWeight: 600 }}>Warning:</span>{' '}
            <span>It is important to keep all parameters the same when recording </span>
            <span style={{ fontWeight: 600 }}>weights</span>
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Additional Information/Notes
            </Typography>
            <TextField
              multiline
              minRows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: Long Range Fuel Tank, Additional Water storage"
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
            >
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYTowCaravanInfo;
