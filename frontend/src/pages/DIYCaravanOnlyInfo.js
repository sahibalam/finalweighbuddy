import React, { useState } from 'react';
import { Box, Paper, Typography, Container, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYCaravanOnlyInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [waterTankCount, setWaterTankCount] = useState('');
  const [waterTankFullCount, setWaterTankFullCount] = useState('');
  const [waterTotalLitres, setWaterTotalLitres] = useState('');
  const [notes, setNotes] = useState('');
  const [vin, setVin] = useState('');
  const [axleConfig, setAxleConfig] = useState('Single Axle');

  const isCustomBuildTrailerTare = location.state?.customBuildTrailerTare || false;

  const handleContinue = () => {
    const baseState = location.state || {};
    const { methodSelection } = baseState;

    const methodSelectionStr = String(methodSelection || '');
    const lowerMethodSelection = methodSelectionStr.toLowerCase();
    const isWeighbridgeMethod =
      methodSelectionStr === 'Weighbridge - In Ground -' ||
      methodSelectionStr === 'Weighbridge - In Ground - Individual Axle Weights' ||
      methodSelectionStr === 'Weighbridge - goweigh' ||
      methodSelectionStr === 'GoWeigh Weighbridge' ||
      methodSelectionStr === 'Above Ground Weighbridge' ||
      lowerMethodSelection.startsWith('weighbridge - in ground') ||
      lowerMethodSelection.includes('goweigh');

    const shouldIncludeAxleConfig =
      isWeighbridgeMethod ||
      (isCustomBuildTrailerTare && methodSelection !== 'Portable Scales - Individual Tyre Weights');

    const preWeigh = {
      waterTankCount: waterTankCount || null,
      waterTankFullCount: waterTankFullCount || null,
      waterTotalLitres: waterTotalLitres || null,
      notes,
      vin: vin || null,
      axleConfig: shouldIncludeAxleConfig ? axleConfig : null,
    };

    let nextPath = '';

    if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
      nextPath = '/caravan-only-portable-tyres';
    } else if (methodSelection === 'Weighbridge - In Ground -') {
      nextPath = '/caravan-only-weighbridge-in-ground';
    } else if (methodSelection === 'GoWeigh Weighbridge') {
      nextPath = '/caravan-only-weighbridge-goweigh';
    } else if (methodSelection === 'Above Ground Weighbridge') {
      nextPath = '/caravan-only-weighbridge-above-ground';
    }

    if (!nextPath) {
      return;
    }

    navigate(nextPath, {
      state: {
        ...baseState,
        preWeigh
      }
    });
  };

  return (
    <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{ p: 4, borderRadius: 2, minHeight: '60vh', display: 'flex', flexDirection: 'column' }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            WeighBuddy Compliance Check
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {isCustomBuildTrailerTare ? 'Caravan / Trailer Tare Report' : 'Caravan / Trailer Only (registered)'}
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}
          >
            Important information to start the weighing process
          </Typography>

          {/* Standard caravan-only flow: show water tank fields */}
          {!isCustomBuildTrailerTare && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="body1" sx={{ minWidth: 200 }}>
                Water in Caravan/Trailer
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
          )}

          {(() => {
            const baseState = location.state || {};
            const methodSelection = baseState.methodSelection || '';
            const methodSelectionStr = String(methodSelection || '');
            const lowerMethodSelection = methodSelectionStr.toLowerCase();
            const isWeighbridgeMethod =
              methodSelectionStr === 'Weighbridge - In Ground -' ||
              methodSelectionStr === 'Weighbridge - In Ground - Individual Axle Weights' ||
              methodSelectionStr === 'Weighbridge - goweigh' ||
              methodSelectionStr === 'GoWeigh Weighbridge' ||
              methodSelectionStr === 'Above Ground Weighbridge' ||
              lowerMethodSelection.startsWith('weighbridge - in ground') ||
              lowerMethodSelection.includes('goweigh');

            const showAxleConfigForCustomBuildTrailerTare =
              isCustomBuildTrailerTare && methodSelection !== 'Portable Scales - Individual Tyre Weights';

            const showAxleConfigForCaravanOnlyRegistered =
              !isCustomBuildTrailerTare &&
              methodSelection !== 'Portable Scales - Individual Tyre Weights' &&
              (isWeighbridgeMethod || !methodSelectionStr);

            if (!showAxleConfigForCaravanOnlyRegistered && !showAxleConfigForCustomBuildTrailerTare) return null;

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Typography variant="body1" sx={{ minWidth: 200 }}>
                  Axle Configuration
                </Typography>
                <FormControl sx={{ width: 220 }}>
                  <InputLabel id="axle-config-label">Select</InputLabel>
                  <Select
                    labelId="axle-config-label"
                    value={axleConfig}
                    label="Select"
                    onChange={(e) => setAxleConfig(e.target.value)}
                  >
                    <MenuItem value="Single Axle">Single Axle</MenuItem>
                    <MenuItem value="Dual Axle">Dual Axle</MenuItem>
                    <MenuItem value="Triple Axle">Triple Axle</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            );
          })()}

          {/* Shared Additional Information/Notes area */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Additional Information/Notes
            </Typography>
            <TextField
              multiline
              minRows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: Trailer is fully loaded"
            />
          </Box>

          {/* Custom-build tare report: VIN field under notes */}
          {isCustomBuildTrailerTare && (
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Enter VIN Number - Optional"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
              />
            </Box>
          )}

          <Typography variant="body2" sx={{ mb: 4 }}>
            <span style={{ color: '#ff9800', fontWeight: 600 }}>Warning:</span>{' '}
            <span>It is important to keep all parameters the same when recording </span>
            <span style={{ fontWeight: 600 }}>weights</span>
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Box>
            <Button variant="contained" color="primary" onClick={handleContinue}>
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYCaravanOnlyInfo;
