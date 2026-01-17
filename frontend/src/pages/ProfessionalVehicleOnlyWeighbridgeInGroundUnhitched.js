import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const weighingSelection = location.state?.weighingSelection || 'tow_vehicle_and_caravan';
  const previousAxleWeigh = location.state?.axleWeigh || null;

  const [frontAxle, setFrontAxle] = useState('');
  const [gvmUnhitched, setGvmUnhitched] = useState('');

  const safeNum = (value) => (value !== '' && value != null ? Number(value) || 0 : 0);

  const handleSaveAndContinue = () => {
    const frontAxleUnhitched = safeNum(frontAxle);
    const gvmUnhitchedNum = safeNum(gvmUnhitched);

    const axleWeigh = {
      ...(previousAxleWeigh || {}),
      frontAxleUnhitched,
      gvmUnhitched: gvmUnhitchedNum,
    };

    navigate('/professional-vehicle-only-weighbridge-in-ground-payment', {
      state: {
        weighingSelection,
        axleWeigh,
      },
    });
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(80vh)',
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
          <Typography variant="h6" sx={{ mb: 1 }}>
            WeighBuddy Compliance Check
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Weighbridge - In Ground - Individual Axle Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ mb: 2, fontWeight: 'bold' }}
          >
            Weigh Unhitched Tow Vehicle (Car Only)
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            Ensure Caravan/Trailer is disconnected/unhitched.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Drive front axle of car unhitched onto weighbridge
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography sx={{ minWidth: 120 }}>Front Axle</Typography>
              <TextField
                label="Front Axle"
                value={frontAxle}
                onChange={(e) => setFrontAxle(e.target.value)}
                sx={{ width: 220 }}
              />
              <Typography>kg</Typography>
            </Box>

            <Typography variant="body2" sx={{ mb: 1 }}>
              Drive whole vehicle unhitched onto weighbridge
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ minWidth: 120 }}>GVM Unhitched</Typography>
              <TextField
                label="Unhitched GVM"
                value={gvmUnhitched}
                onChange={(e) => setGvmUnhitched(e.target.value)}
                sx={{ width: 220 }}
              />
              <Typography>kg</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={!frontAxle || !gvmUnhitched}
            >
              Save and Continue
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

export default ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched;
