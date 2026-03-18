import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalTowPortableTyresVCI02 = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const weighingSelection = location.state?.weighingSelection || 'tow_vehicle_and_caravan';
  const previousAxleWeigh = location.state?.axleWeigh || null;
  const vci01 = location.state?.vci01 || null;
  const preWeigh = location.state?.preWeigh || null;
  const axleConfig = location.state?.axleConfig || 'SINGLE';
  const isDualAxle = axleConfig === 'DUAL' || axleConfig === 'Dual Axle';
  const towSetupType = location.state?.towSetupType || '';

  const towSetupLabel =
    towSetupType === 'boat' ? 'Boat' : towSetupType === 'trailer' ? 'Trailer' : 'Caravan';

  const [frontLeft, setFrontLeft] = useState('');
  const [frontRight, setFrontRight] = useState('');
  const [rearLeft, setRearLeft] = useState('');
  const [rearRight, setRearRight] = useState('');
  const [middleLeft, setMiddleLeft] = useState('');
  const [middleRight, setMiddleRight] = useState('');

  const handleContinue = () => {
    const safeNum = (v) => (v != null && v !== '' ? Number(v) || 0 : 0);

    const frontUnhitched = safeNum(frontLeft) + safeNum(frontRight) + (isDualAxle ? safeNum(middleLeft) + safeNum(middleRight) : 0);
    const rearUnhitched = safeNum(rearLeft) + safeNum(rearRight);
    const gvmUnhitched = frontUnhitched + rearUnhitched;

    const vci02 = {
      unhitchedWeigh: {
        frontLeft: frontLeft ? Number(frontLeft) : null,
        frontRight: frontRight ? Number(frontRight) : null,
        middleLeft: isDualAxle ? (middleLeft ? Number(middleLeft) : null) : null,
        middleRight: isDualAxle ? (middleRight ? Number(middleRight) : null) : null,
        rearLeft: rearLeft ? Number(rearLeft) : null,
        rearRight: rearRight ? Number(rearRight) : null,
      },
      axleConfig,
    };

    navigate('/professional-vehicle-only-portable-tyres-payment', {
      state: {
        weighingSelection,
        towSetupType,
        vci01,
        vci02,
        axleConfig,
        axleWeigh: {
          ...previousAxleWeigh,
          unhitchedFrontAxle: frontUnhitched,
          unhitchedRearAxle: rearUnhitched,
          gvmUnhitched,
        },
        towBallMass: null,
        preWeigh,
      },
    });
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
          <Typography variant="h6" sx={{ mb: 1 }}>
            WeighBuddy Compliance Check
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Portable Scales - Individual Tyre Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ mb: 2, fontWeight: 'bold' }}
          >
            {`Disconnect ${towSetupLabel} - Weigh Unhitched Tow Vehicle`}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              columnGap: 4,
              rowGap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Front Left Tyre"
                value={frontLeft}
                onChange={(e) => setFrontLeft(e.target.value)}
                sx={{ width: 180 }}
              />
              <Typography>kg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Front Right Tyre"
                value={frontRight}
                onChange={(e) => setFrontRight(e.target.value)}
                sx={{ width: 180 }}
              />
              <Typography>kg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Rear Left Tyre"
                value={rearLeft}
                onChange={(e) => setRearLeft(e.target.value)}
                sx={{ width: 180 }}
              />
              <Typography>kg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Rear Right Tyre"
                value={rearRight}
                onChange={(e) => setRearRight(e.target.value)}
                sx={{ width: 180 }}
              />
              <Typography>kg</Typography>
            </Box>

            {isDualAxle && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Middle Left Tyre"
                    value={middleLeft}
                    onChange={(e) => setMiddleLeft(e.target.value)}
                    sx={{ width: 180 }}
                  />
                  <Typography>kg</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label="Middle Right Tyre"
                    value={middleRight}
                    onChange={(e) => setMiddleRight(e.target.value)}
                    sx={{ width: 180 }}
                  />
                  <Typography>kg</Typography>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" onClick={handleContinue}>
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

export default ProfessionalTowPortableTyresVCI02;
