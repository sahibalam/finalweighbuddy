import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyStart = () => {
  const [method, setMethod] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';

  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan / Trailer'
      : 'Vehicle Only';

  const handleSaveAndContinue = () => {
    if (!method) return;
    navigate('/professional-vehicle-only-info', { state: { method, weighingSelection } });
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
        <Box sx={{ width: '100%', maxWidth: 900 }}>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', mb: 4 }}
          >
            {headingLabel}
          </Typography>

          <Box sx={{ maxWidth: 500, mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControl fullWidth sx={{ mr: 4 }}>
                <InputLabel id="vehicle-only-method-label">How am I weighing the setup?</InputLabel>
                <Select
                  labelId="vehicle-only-method-label"
                  label="How am I weighing the setup?"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <MenuItem value="portable-tyres">Portable Scales - Individual Tyre Weights</MenuItem>
                  <MenuItem value="weighbridge-in-ground">Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded</MenuItem>
                  <MenuItem value="weighbridge-goweigh">Weighbridge - goweigh</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                Create Default setting
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{ mt: 6, textAlign: 'center', color: 'orange' }}
            >
              Weighbuddy records Geo location of weigh
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6 }}>
              <Button
                variant="contained"
                onClick={handleSaveAndContinue}
                disabled={!method}
              >
                Save and Continue
              </Button>
            </Box>
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

export default ProfessionalVehicleOnlyStart;
