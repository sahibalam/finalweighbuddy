import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const AXLE_OPTIONS = ['Single Axle', 'Dual Axle', 'Triple Axle'];

const DIYCaravanOnlyPortableTyres = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [axleConfig, setAxleConfig] = useState('Single Axle');

  const [singleLeft, setSingleLeft] = useState('');
  const [singleRight, setSingleRight] = useState('');

  const [dualFrontLeft, setDualFrontLeft] = useState('');
  const [dualFrontRight, setDualFrontRight] = useState('');
  const [dualRearLeft, setDualRearLeft] = useState('');
  const [dualRearRight, setDualRearRight] = useState('');

  const [tripleFrontLeft, setTripleFrontLeft] = useState('');
  const [tripleFrontRight, setTripleFrontRight] = useState('');
  const [tripleMiddleLeft, setTripleMiddleLeft] = useState('');
  const [tripleMiddleRight, setTripleMiddleRight] = useState('');
  const [tripleRearLeft, setTripleRearLeft] = useState('');
  const [tripleRearRight, setTripleRearRight] = useState('');

  const handleContinue = () => {
    const baseState = location.state || {};

    const tyreWeigh = {
      axleConfig,
      single: {
        left: singleLeft ? Number(singleLeft) : null,
        right: singleRight ? Number(singleRight) : null
      },
      dual: {
        frontLeft: dualFrontLeft ? Number(dualFrontLeft) : null,
        frontRight: dualFrontRight ? Number(dualFrontRight) : null,
        rearLeft: dualRearLeft ? Number(dualRearLeft) : null,
        rearRight: dualRearRight ? Number(dualRearRight) : null
      },
      triple: {
        frontLeft: tripleFrontLeft ? Number(tripleFrontLeft) : null,
        frontRight: tripleFrontRight ? Number(tripleFrontRight) : null,
        middleLeft: tripleMiddleLeft ? Number(tripleMiddleLeft) : null,
        middleRight: tripleMiddleRight ? Number(tripleMiddleRight) : null,
        rearLeft: tripleRearLeft ? Number(tripleRearLeft) : null,
        rearRight: tripleRearRight ? Number(tripleRearRight) : null
      }
    };

    navigate('/diy-weigh', {
      state: {
        ...baseState,
        tyreWeigh,
        startAtPayment: true
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
            Caravan / Trailer Only (registered)
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Portable Scales - Individual Tyre Weights
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="axle-config-label">How many axles?</InputLabel>
              <Select
                labelId="axle-config-label"
                value={axleConfig}
                label="How many axles?"
                onChange={(e) => setAxleConfig(e.target.value)}
              >
                {AXLE_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Weigh Caravan/Trailer Hitched to Tow Vehicle
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Drive each tyre of caravan/trailer onto portable scale.
          </Typography>

          {/* Single Axle */}
          {axleConfig === 'Single Axle' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Single Axle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 100 }}>Left Tyre</Typography>
                <TextField
                  value={singleLeft}
                  onChange={(e) => setSingleLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ minWidth: 100 }}>Right Tyre</Typography>
                <TextField
                  value={singleRight}
                  onChange={(e) => setSingleRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Box>
          )}

          {/* Dual Axle */}
          {axleConfig === 'Dual Axle' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Dual Axle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 100 }}>Front Left Tyre</Typography>
                <TextField
                  value={dualFrontLeft}
                  onChange={(e) => setDualFrontLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 100 }}>Front Right Tyre</Typography>
                <TextField
                  value={dualFrontRight}
                  onChange={(e) => setDualFrontRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 100 }}>Rear Left Tyre</Typography>
                <TextField
                  value={dualRearLeft}
                  onChange={(e) => setDualRearLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ minWidth: 100 }}>Rear Right Tyre</Typography>
                <TextField
                  value={dualRearRight}
                  onChange={(e) => setDualRearRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Box>
          )}

          {/* Triple Axle */}
          {axleConfig === 'Triple Axle' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Triple Axle
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 120 }}>Front Left Tyre</Typography>
                <TextField
                  value={tripleFrontLeft}
                  onChange={(e) => setTripleFrontLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 120 }}>Front Right Tyre</Typography>
                <TextField
                  value={tripleFrontRight}
                  onChange={(e) => setTripleFrontRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 120 }}>Middle Left Tyre</Typography>
                <TextField
                  value={tripleMiddleLeft}
                  onChange={(e) => setTripleMiddleLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 120 }}>Middle Right Tyre</Typography>
                <TextField
                  value={tripleMiddleRight}
                  onChange={(e) => setTripleMiddleRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ minWidth: 120 }}>Rear Left Tyre</Typography>
                <TextField
                  value={tripleRearLeft}
                  onChange={(e) => setTripleRearLeft(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ minWidth: 120 }}>Rear Right Tyre</Typography>
                <TextField
                  value={tripleRearRight}
                  onChange={(e) => setTripleRearRight(e.target.value)}
                  sx={{ width: 140, mr: 1 }}
                />
                <Typography>kg</Typography>
              </Box>
            </Box>
          )}

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

export default DIYCaravanOnlyPortableTyres;
