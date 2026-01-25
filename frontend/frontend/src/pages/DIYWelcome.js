import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WEIGHING_OPTIONS = [
  {
    value: 'tow_vehicle_and_caravan',
    label: 'Tow Vehicle and Caravan/Trailer'
  },
  {
    value: 'vehicle_only',
    label: 'Vehicle Only'
  },
  {
    value: 'caravan_only_registered',
    label: 'Caravan/Trailer Only (Registered)'
  }
  // Note: custom-build trailer tare uses a dedicated flow and does not appear
  // in this primary DIY weighing options list. It is injected via navigation
  // state from the professional "What am I weighing?" screen.
];

const METHOD_OPTIONS = {
  tow_vehicle_and_caravan: [
    'Portable Scales - Individual Tyre Weights',
    'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded',
    'Weighbridge - goweigh',
    'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.'
  ],
  vehicle_only: [
    'Portable Scales - Individual Tyre Weights',
    'Weighbridge - In Ground - Individual Axle Weights',
    'Weighbridge - goweigh',
    'Weighbridge - Above Ground'
  ],
  caravan_only_registered: [
    'Portable Scales - Individual Tyre Weights',
    'Weighbridge - In Ground -',
    'GoWeigh Weighbridge',
    'Above Ground Weighbridge'
  ],
  // Trailer tare report for Rover/Custom Build (professional flow)
  custom_build_trailer_tare: [
    'Portable Scales - Individual Tyre Weights',
    'GoWeigh Weighbridge'
  ]
};

const DIYWelcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomBuildTrailerTare = location.state?.customBuildTrailerTare || false;

  const [weighingSelection, setWeighingSelection] = useState('');
  const [methodSelection, setMethodSelection] = useState('');

  const currentMethods = weighingSelection ? METHOD_OPTIONS[weighingSelection] || [] : [];

  useEffect(() => {
    if (isCustomBuildTrailerTare) {
      // For custom-build trailer tare, we fix the weighing selection so that
      // only the method dropdown is shown, matching the wireframe.
      setWeighingSelection('custom_build_trailer_tare');
    }
  }, [isCustomBuildTrailerTare]);

  const handleStart = () => {
    if (!weighingSelection || !methodSelection) {
      return;
    }

    let targetPath = '/diy-weigh';

    if (weighingSelection === 'vehicle_only') {
      targetPath = '/vehicle-only-info';
    } else if (weighingSelection === 'tow_vehicle_and_caravan') {
      targetPath = '/tow-caravan-info';
    } else if (weighingSelection === 'caravan_only_registered') {
      targetPath = '/caravan-only-info';
    } else if (weighingSelection === 'custom_build_trailer_tare') {
      // Custom-build trailer tare uses the caravan-only info screen (tare report
      // variant) before branching to the specific method screen.
      targetPath = '/caravan-only-info';
    }

    navigate(targetPath, {
      state: {
        weighingSelection,
        methodSelection,
        // Preserve the custom-build trailer tare flag so the caravan-only
        // info screen can render the 9.png layout.
        customBuildTrailerTare: isCustomBuildTrailerTare,
      }
    });
  };

  const renderHeading = () => {
    if (!weighingSelection && !isCustomBuildTrailerTare) {
      return 'Welcome to WeighBuddy';
    }

    if (isCustomBuildTrailerTare) {
      return 'WeighBuddy Compliance Check';
    }

    const option = WEIGHING_OPTIONS.find((opt) => opt.value === weighingSelection);
    return option ? option.label : 'Welcome to WeighBuddy';
  };

  const renderIntroText = () => {
    if (!weighingSelection && !isCustomBuildTrailerTare) {
      return (
        <Typography
          variant="body1"
          align="center"
          sx={{ mt: 6 }}
        >
          To get started choose what you are weighing above
        </Typography>
      );
    }

    return null;
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
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              {renderHeading()}
            </Typography>

            {!weighingSelection && !isCustomBuildTrailerTare && (
              <FormControl sx={{ minWidth: 280 }} size="medium">
                <InputLabel id="what-weighing-label">What am I weighing?</InputLabel>
                <Select
                  labelId="what-weighing-label"
                  value={weighingSelection}
                  label="What am I weighing?"
                  onChange={(e) => {
                    setWeighingSelection(e.target.value);
                    setMethodSelection('');
                  }}
                >
                  {WEIGHING_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(weighingSelection || isCustomBuildTrailerTare) && (
              <FormControl sx={{ minWidth: 320 }} size="medium">
                <InputLabel id="how-weighing-label">How am I weighing my setup?</InputLabel>
                <Select
                  labelId="how-weighing-label"
                  value={methodSelection}
                  label="How am I weighing my setup?"
                  onChange={(e) => setMethodSelection(e.target.value)}
                >
                  {currentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {renderIntroText()}

          {(weighingSelection || isCustomBuildTrailerTare) &&
            !isCustomBuildTrailerTare &&
            weighingSelection !== 'vehicle_only' &&
            weighingSelection !== 'tow_vehicle_and_caravan' &&
            weighingSelection !== 'caravan_only_registered' && (
            <Box sx={{ mt: 6 }}>
              <Typography
                variant="body1"
                sx={{ mb: 1, color: 'text.primary' }}
              >
                Dropdown options:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 3 }}>
                {currentMethods.map((method) => (
                  <Typography
                    key={method}
                    component="li"
                    variant="body1"
                    sx={{ color: 'text.primary', mb: 0.5 }}
                  >
                    {method}
                  </Typography>
                ))}
              </Box>

              {weighingSelection === 'tow_vehicle_and_caravan' && (
                <Typography
                  variant="body1"
                  sx={{ mt: 4, textAlign: 'center', color: 'text.primary' }}
                >
                  Weighbuddy records Geo location of weigh
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              disabled={!weighingSelection || !methodSelection}
              onClick={handleStart}
            >
              Start Weigh
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYWelcome;
