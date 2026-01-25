import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const ProfessionalVehicleOnlyPortableTyres = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';
  const preWeigh = location.state?.preWeigh || null;

  const [weights, setWeights] = useState({
    frontLeft: '',
    frontRight: '',
    rearLeft: '',
    rearRight: '',
    middleLeft: '',
    middleRight: '',
  });

  // For tow + caravan layout, allow selecting axle configuration
  const [axleConfig, setAxleConfig] = useState('single');
  const [towBallMass, setTowBallMass] = useState('');

  const handleChange = (field) => (e) => {
    setWeights({ ...weights, [field]: e.target.value });
  };

  const safeNum = (value) => (value !== '' && value != null ? Number(value) || 0 : 0);

  const handleSaveAndContinue = () => {
    // Vehicle only: use these tyre loads as the unhitched front/rear axle totals
    if (weighingSelection === 'vehicle_only') {
      const frontAxleUnhitched = safeNum(weights.frontLeft) + safeNum(weights.frontRight);
      const rearAxleUnhitched =
        safeNum(weights.rearLeft) +
        safeNum(weights.rearRight) +
        safeNum(weights.middleLeft) +
        safeNum(weights.middleRight);

      const axleWeigh = {
        frontAxleUnhitched,
        rearAxleUnhitched,
      };

      navigate('/professional-vehicle-only-portable-tyres-payment', {
        state: {
          weighingSelection,
          axleWeigh,
          preWeigh,
        },
      });
      return;
    }

    // Tow vehicle + caravan OR caravan-only: treat this screen as the caravan/trailer tyre weighing screen.
    // Compute caravan GTM from the individual tyre loads based on axle configuration
    let caravanGtm = 0;
    if (axleConfig === 'single') {
      caravanGtm = safeNum(weights.frontLeft) + safeNum(weights.frontRight);
    } else if (axleConfig === 'dual') {
      caravanGtm =
        safeNum(weights.frontLeft) +
        safeNum(weights.frontRight) +
        safeNum(weights.rearLeft) +
        safeNum(weights.rearRight);
    } else if (axleConfig === 'triple') {
      caravanGtm =
        safeNum(weights.frontLeft) +
        safeNum(weights.frontRight) +
        safeNum(weights.middleLeft) +
        safeNum(weights.middleRight) +
        safeNum(weights.rearLeft) +
        safeNum(weights.rearRight);
    }

    const axleWeigh = {
      trailerGtm: caravanGtm,
    };

    const towBallMassNum = safeNum(towBallMass);

    // Caravan-only (registered): go straight to caravan-only payment screen
    if (weighingSelection === 'caravan_only_registered') {
      navigate('/professional-vehicle-only-portable-tyres-payment', {
        state: {
          weighingSelection,
          axleWeigh,
          towBallMass: towBallMassNum || null,
          preWeigh,
        },
      });
      return;
    }

    // Tow vehicle + caravan: go to additional tow-specific WDH + tow-vehicle screens
    navigate('/professional-tow-portable-tyres-vci01', {
      state: {
        weighingSelection,
        axleWeigh,
        preWeigh,
      },
    });
  };

  let headingLabel = 'Vehicle Only';

  if (weighingSelection === 'tow_vehicle_and_caravan') {
    headingLabel = 'Tow Vehicle and Caravan / Trailer';
  } else if (weighingSelection === 'caravan_only_registered') {
    headingLabel = 'Caravan / Trailer Only (registered)';
  }

  const renderVehicleOnlyLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {headingLabel}
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Portable Scales - Individual Tyre Weights
      </Typography>

      <Typography
        variant="h5"
        sx={{ textAlign: 'center', mb: 4, fontWeight: 'bold' }}
      >
        Weigh Tow Vehicle - Hitched to Caravan/Trailer
      </Typography>

      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Front Left Tyre"
              value={weights.frontLeft}
              onChange={handleChange('frontLeft')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              label="Rear Left Tyre"
              value={weights.rearLeft}
              onChange={handleChange('rearLeft')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Front Right Tyre"
              value={weights.frontRight}
              onChange={handleChange('frontRight')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              label="Rear Right Tyre"
              value={weights.rearRight}
              onChange={handleChange('rearRight')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography
        variant="body2"
        sx={{ textAlign: 'center', mb: 2 }}
      >
        Note: If your tow vehicle has a dual rear axle, enter middle axle below.
      </Typography>

      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Middle Left Tyre"
              value={weights.middleLeft}
              onChange={handleChange('middleLeft')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <TextField
              label="Middle Right Tyre"
              value={weights.middleRight}
              onChange={handleChange('middleRight')}
              sx={{ width: '70%' }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>
        </Grid>
      </Grid>
    </>
  );

  const renderTowLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        WeighBuddy Compliance Check
      </Typography>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {headingLabel}
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Portable Scales - Individual Tyre Weights
      </Typography>

      <Box sx={{ maxWidth: 220, mb: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="axle-config-label">How many axles?</InputLabel>
          <Select
            labelId="axle-config-label"
            label="How many axles?"
            value={axleConfig}
            onChange={(e) => setAxleConfig(e.target.value)}
          >
            <MenuItem value="single">Single Axle</MenuItem>
            <MenuItem value="dual">Dual Axle</MenuItem>
            <MenuItem value="triple">Triple Axle</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography
        variant="h5"
        sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
      >
        Weigh Caravan/Trailer Hitched to Tow Vehicle
      </Typography>

      <Typography variant="body2" sx={{ mb: 3 }}>
        Drive each tyre of vehicle onto portable scale
      </Typography>

      {axleConfig === 'single' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Single Axle
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Left Tyre"
                  value={weights.frontLeft}
                  onChange={handleChange('frontLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Right Tyre"
                  value={weights.frontRight}
                  onChange={handleChange('frontRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {axleConfig === 'dual' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Dual Axle
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Front Left Tyre"
                  value={weights.frontLeft}
                  onChange={handleChange('frontLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Rear Left Tyre"
                  value={weights.rearLeft}
                  onChange={handleChange('rearLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Front Right Tyre"
                  value={weights.frontRight}
                  onChange={handleChange('frontRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Rear Right Tyre"
                  value={weights.rearRight}
                  onChange={handleChange('rearRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {axleConfig === 'triple' && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Triple Axle
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Front Left Tyre"
                  value={weights.frontLeft}
                  onChange={handleChange('frontLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Middle Left Tyre"
                  value={weights.middleLeft}
                  onChange={handleChange('middleLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Rear Left Tyre"
                  value={weights.rearLeft}
                  onChange={handleChange('rearLeft')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Front Right Tyre"
                  value={weights.frontRight}
                  onChange={handleChange('frontRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  label="Middle Right Tyre"
                  value={weights.middleRight}
                  onChange={handleChange('middleRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  label="Rear Right Tyre"
                  value={weights.rearRight}
                  onChange={handleChange('rearRight')}
                  sx={{ width: 180 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Right Tow Ball Weight field as per caravan-only portable scales wireframe */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="Right Tow Ball Weight"
            value={towBallMass}
            onChange={(e) => setTowBallMass(e.target.value)}
            sx={{ width: 180 }}
          />
          <Typography>kg</Typography>
        </Box>
      </Box>
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
          {(weighingSelection === 'tow_vehicle_and_caravan' ||
            weighingSelection === 'caravan_only_registered')
            ? renderTowLayout()
            : renderVehicleOnlyLayout()}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" onClick={handleSaveAndContinue}>
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

export default ProfessionalVehicleOnlyPortableTyres;
