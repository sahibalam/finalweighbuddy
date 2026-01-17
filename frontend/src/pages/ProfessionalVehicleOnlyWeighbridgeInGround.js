import React, { useState } from 'react';
import { Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyWeighbridgeInGround = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';
  const [frontAxle, setFrontAxle] = useState('');
  const [gvm, setGvm] = useState('');

  // Tow + caravan specific fields
  const [wdhUsed, setWdhUsed] = useState('no');
  const [gvmHitchedRelease, setGvmHitchedRelease] = useState('');
  const [caravanGtm, setCaravanGtm] = useState('');

  const safeNum = (value) => (value !== '' && value != null ? Number(value) || 0 : 0);

  const handleSaveAndContinue = () => {
    const frontAxleValue = safeNum(frontAxle);
    const gvmValue = safeNum(gvm);

    // Tow Vehicle + Caravan flow: this screen is the "hitched" step.
    // After capturing hitched values, go to the unhitched tow-vehicle screen.
    if (weighingSelection === 'tow_vehicle_and_caravan') {
      navigate('/professional-vehicle-only-weighbridge-in-ground-unhitched', {
        state: {
          weighingSelection,
          axleWeigh: {
            frontAxleHitched: frontAxleValue,
            gvmHitched: gvmValue,
            gvmHitchedWdhRelease: safeNum(gvmHitchedRelease),
            trailerGtm: safeNum(caravanGtm),
          },
        },
      });
      return;
    }

    // Vehicle-only flow: behave as before, treat this as the unhitched axle input.
    const frontAxleUnhitched = frontAxleValue;
    const gvmUnhitched = gvmValue;

    navigate('/professional-vehicle-only-weighbridge-in-ground-payment', {
      state: {
        weighingSelection,
        axleWeigh: {
          frontAxleUnhitched,
          gvmUnhitched,
        },
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
        Weighbridge - In Ground - Individual Axle Weights
      </Typography>

      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: 'bold' }}
      >
        Weigh Vehicle
      </Typography>

      <Typography variant="body2" sx={{ mb: 3 }}>
        Enter the unhitched axle weights from the in-ground weighbridge.
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" sx={{ minWidth: 120 }}>
            Gross Vehicle Mass (GVM)
          </Typography>
          <TextField
            label="GVM"
            value={gvm}
            onChange={(e) => setGvm(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography variant="body1">kg</Typography>
        </Box>
      </Box>
    </>
  );

  const renderTowLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        WeighBuddy Compliance Check
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Weighbridge - In Ground - Individual Axle Weights
      </Typography>

      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: 'bold' }}
      >
        Weigh Tow Vehicle Hitched to Caravan/Trailer First
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Drive front axle of vehicle onto weighbridge
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

        <Typography variant="body2" sx={{ mb: 2 }}>
          Drive whole vehicle hitched onto weighbridge
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 120 }}>GVM Hitched</Typography>
          <TextField
            label="Hitched GVM"
            value={gvm}
            onChange={(e) => setGvm(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Are you a Weight Distribution Hitch? WDH
        </Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="wdh-label">WDH</InputLabel>
          <Select
            labelId="wdh-label"
            label="WDH"
            value={wdhUsed}
            onChange={(e) => setWdhUsed(e.target.value)}
          >
            <MenuItem value="yes">Yes</MenuItem>
            <MenuItem value="no">No</MenuItem>
          </Select>
        </FormControl>

        {wdhUsed === 'yes' && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Yes – Release the tension on the WDH and re-weigh tow vehicle hitched to caravan/trailer.
          </Typography>
        )}
      </Box>

      {wdhUsed === 'yes' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            GVM Hitched WDH Release
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Hitched GVM"
              value={gvmHitchedRelease}
              onChange={(e) => setGvmHitchedRelease(e.target.value)}
              sx={{ width: 220 }}
            />
            <Typography>kg</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Tow Caravan/Trailer onto weighbridge – note: tow vehicle must be off weighbridge.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ minWidth: 160 }}>Caravan/Trailer GTM</Typography>
          <TextField
            label="Trailer GTM"
            value={caravanGtm}
            onChange={(e) => setCaravanGtm(e.target.value)}
            sx={{ width: 220 }}
          />
          <Typography>kg</Typography>
        </Box>
      </Box>
    </>
  );

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
          {weighingSelection === 'tow_vehicle_and_caravan'
            ? renderTowLayout()
            : renderVehicleOnlyLayout()}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" onClick={handleSaveAndContinue} disabled={!frontAxle || !gvm}>
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

export default ProfessionalVehicleOnlyWeighbridgeInGround;
