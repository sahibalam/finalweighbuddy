import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyWeighbridgeGoWeigh = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';

  const [frontAxle, setFrontAxle] = useState('');
  const [rearAxle, setRearAxle] = useState('');
  const [carWeight, setCarWeight] = useState('');

  // GoWeigh tow+caravan specific fields
  const [trailerAtm, setTrailerAtm] = useState('');
  const [frontAxleHitched, setFrontAxleHitched] = useState('');
  const [rearAxleHitched, setRearAxleHitched] = useState('');
  const [trailerGtm, setTrailerGtm] = useState('');
  const [gcm, setGcm] = useState('');
  const [tbm, setTbm] = useState('');

  const safeNum = (value) => (value !== '' && value != null ? Number(value) || 0 : 0);

  const handleSaveAndContinue = () => {
    const frontAxleUnhitched = safeNum(frontAxle);
    const rearAxleUnhitched = safeNum(rearAxle);
    const gvmUnhitched = safeNum(carWeight) || frontAxleUnhitched + rearAxleUnhitched;

    let axleWeigh = {
      frontAxleUnhitched,
      gvmUnhitched,
    };

    let goweighData = null;

    if (weighingSelection === 'tow_vehicle_and_caravan') {
      const firstFront = frontAxleUnhitched;
      const firstRear = rearAxleUnhitched;
      const firstAtm = safeNum(trailerAtm);

      const secondFront = safeNum(frontAxleHitched);
      const secondRear = safeNum(rearAxleHitched);
      const secondGtm = safeNum(trailerGtm);

      const gcmNum = safeNum(gcm);
      const tbmNum = safeNum(tbm);

      goweighData = {
        firstWeigh: {
          frontUnhitched: firstFront,
          rearUnhitched: firstRear,
          trailerAtm: firstAtm,
        },
        secondWeigh: {
          frontHitched: secondFront,
          rearHitched: secondRear,
          trailerGtm: secondGtm,
        },
        summary: {
          gcm: gcmNum,
          tbm: tbmNum,
        },
      };

      // Ensure axleWeigh carries unhitched GVM for results screen vehicle metrics
      axleWeigh = {
        frontAxleUnhitched: firstFront,
        gvmUnhitched: firstFront + firstRear,
      };
    }

    navigate('/professional-vehicle-only-weighbridge-goweigh-payment', {
      state: {
        weighingSelection,
        axleWeigh,
        goweighData,
      },
    });
  };

  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan / Trailer'
      : 'Vehicle Only';

  const renderVehicleOnlyLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {headingLabel}
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Weighbridge - goweigh
      </Typography>

      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: 'bold' }}
      >
        Weigh Vehicle
      </Typography>

      <Typography variant="body2" sx={{ mb: 3 }}>
        Follow the Go Weigh procedure and enter the axle and vehicle weights below.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body1" sx={{ minWidth: 120 }}>
            Front Axle
          </Typography>
          <TextField
            label="Front Axle"
            value={frontAxle}
            onChange={(e) => setFrontAxle(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography variant="body1">kg</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body1" sx={{ minWidth: 120 }}>
            Rear Axle
          </Typography>
          <TextField
            label="Rear Axle"
            value={rearAxle}
            onChange={(e) => setRearAxle(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography variant="body1">kg</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" sx={{ minWidth: 120 }}>
            Car Weight
          </Typography>
          <TextField
            label="GVM"
            value={carWeight}
            onChange={(e) => setCarWeight(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography variant="body1">kg</Typography>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mb: 3 }}>
        Note: If your vehicle has a dual rear axle, combine the individual rear-axle tyre loads and enter the total value.
      </Typography>
    </>
  );

  const renderTowLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        WeighBuddy Compliance Check
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Weighbridge - goweigh
      </Typography>

      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Follow the goweigh Procedure
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        First Weigh (Unhitched)
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Tow Vehicle Unhitched
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography sx={{ minWidth: 140 }}>Front Axle Unhitched</Typography>
          <TextField
            label="Front Axle"
            value={frontAxle}
            onChange={(e) => setFrontAxle(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform A</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 140 }}>Rear Axle Unhitched</Typography>
          <TextField
            label="Rear Axle"
            value={rearAxle}
            onChange={(e) => setRearAxle(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform B</Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Caravan/Trailer Unhitched
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 140 }}>Caravan / Trailer ATM</Typography>
          <TextField
            label="Trailer ATM"
            value={trailerAtm}
            onChange={(e) => setTrailerAtm(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform C</Typography>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Second Weigh (Hitched)
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Tow Vehicle Hitched
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography sx={{ minWidth: 140 }}>Front Axle Hitched</Typography>
          <TextField
            label="Front Axle"
            value={frontAxleHitched}
            onChange={(e) => setFrontAxleHitched(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform A</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 140 }}>Rear Axle Hitched</Typography>
          <TextField
            label="Rear Axle"
            value={rearAxleHitched}
            onChange={(e) => setRearAxleHitched(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform B</Typography>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Caravan/Trailer Hitched
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 140 }}>Caravan/Trailer GTM</Typography>
          <TextField
            label="Trailer GTM"
            value={trailerGtm}
            onChange={(e) => setTrailerGtm(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
          <Typography sx={{ ml: 2 }}>Platform C</Typography>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Towing Weights Summary
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography sx={{ minWidth: 180 }}>Total Combination Weight</Typography>
          <TextField
            label="GCM"
            value={gcm}
            onChange={(e) => setGcm(e.target.value)}
            sx={{ width: 180 }}
          />
          <Typography>kg</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 180 }}>Tow Ball Mass</Typography>
          <TextField
            label="TBM"
            value={tbm}
            onChange={(e) => setTbm(e.target.value)}
            sx={{ width: 180 }}
          />
          <Typography>kg</Typography>
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Upload goweigh report
      </Typography>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="outlined" component="label">
          PDF upload
          <input type="file" hidden accept="application/pdf" />
        </Button>
        <Typography variant="body2">optional</Typography>
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
        Note: Each platform is calibrated to measure in 20kg increments
      </Typography>
    </>
  );

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
          {weighingSelection === 'tow_vehicle_and_caravan'
            ? renderTowLayout()
            : renderVehicleOnlyLayout()}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleSaveAndContinue}
              disabled={
                weighingSelection === 'tow_vehicle_and_caravan'
                  ? !frontAxle || !rearAxle || !trailerAtm || !frontAxleHitched || !rearAxleHitched || !trailerGtm || !gcm || !tbm
                  : !frontAxle || !carWeight
              }
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

export default ProfessionalVehicleOnlyWeighbridgeGoWeigh;
