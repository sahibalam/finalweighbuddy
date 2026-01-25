import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ProfessionalWeighStart = () => {
  const navigate = useNavigate();
  const [weighType, setWeighType] = useState('');

  const handleSaveAndContinue = () => {
    if (!weighType) return;

    switch (weighType) {
      case 'tow-vehicle-caravan':
        // Use the same flow as Vehicle Only, but mark selection so we can label screens correctly
        navigate('/professional-weigh-vehicle-only', {
          state: { weighingSelection: 'tow_vehicle_and_caravan' },
        });
        break;
      case 'vehicle-only':
        navigate('/professional-weigh-vehicle-only', {
          state: { weighingSelection: 'vehicle_only' },
        });
        break;
      case 'caravan-only':
  navigate('/professional-weigh-vehicle-only', {
    state: { weighingSelection: 'caravan_only_registered' },
  });
  break;
      case 'custom-build':
        // Trailer tare report for Rover/Custom Build flows through the DIY method
        // selection screen (How am I weighing my setup?).
        navigate('/new-weigh', {
          state: { customBuildTrailerTare: true },
        });
        break;
      default:
        break;
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 800, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Welcome to WeighBuddy
          </Typography>

          <FormControl fullWidth sx={{ mt: 4 }}>
            <InputLabel id="weigh-type-label">What am I weighing?</InputLabel>
            <Select
              labelId="weigh-type-label"
              value={weighType}
              label="What am I weighing?"
              onChange={(e) => setWeighType(e.target.value)}
            >
              <MenuItem value="tow-vehicle-caravan">Tow Vehicle and Caravan/Trailer</MenuItem>
              <MenuItem value="vehicle-only">Vehicle Only</MenuItem>
              <MenuItem value="caravan-only">Caravan/Trailer Only (Registered)</MenuItem>
              <MenuItem value="custom-build">Trailer tare report for Rover/Custom Build</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body1" sx={{ mt: 6 }}>
            To get started choose what you are weighing above
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 8 }}>
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={!weighType}
            >
              Save & Continue
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ py: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: 'block' }}
        >
          YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfessionalWeighStart;
