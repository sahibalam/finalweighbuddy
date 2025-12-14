import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYVehicleOnlyInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fuelLevel, setFuelLevel] = useState('');
  const [frontPassengers, setFrontPassengers] = useState('');
  const [rearPassengers, setRearPassengers] = useState('');
  const [notes, setNotes] = useState('');

  const handleContinue = () => {
    const fuelValue = parseFloat(fuelLevel) || 0;
    const baseState = location.state || {};
    const { weighingSelection, methodSelection } = baseState;

    const nextPath =
      weighingSelection === 'vehicle_only' &&
      methodSelection === 'Weighbridge - In Ground - Individual Axle Weights'
        ? '/vehicle-only-weighbridge-axle'
        : '/diy-weigh';

    navigate(nextPath, {
      state: {
        ...baseState,
        preWeigh: {
          fuelLevel: fuelValue,
          passengersFront: frontPassengers ? 2 : 0,
          passengersRear: rearPassengers ? 3 : 0,
          notes
        }
      }
    });
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
          <Typography variant="h6" sx={{ mb: 1 }}>
            Vehicle only
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Important information to start the weighing process
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 150 }}
            >
              Fuel in Vehicle
            </Typography>
            <TextField
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              placeholder="Fuel level"
              sx={{ width: 200, mr: 2 }}
            />
            <Typography variant="body1">%</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ minWidth: 150 }}
            >
              Passengers
            </Typography>
            <Button
              variant={frontPassengers ? 'contained' : 'outlined'}
              sx={{ mr: 2, minWidth: 160 }}
              onClick={() => setFrontPassengers(frontPassengers ? '' : 'Front 1 or 2')}
            >
              Front 1 or 2
            </Button>
            <Button
              variant={rearPassengers ? 'contained' : 'outlined'}
              sx={{ minWidth: 160 }}
              onClick={() => setRearPassengers(rearPassengers ? '' : 'Rear 1 to 3')}
            >
              Rear 1 to 3
            </Button>
          </Box>

          <Typography
            variant="body2"
            sx={{ mb: 4 }}
          >
            <span style={{ color: '#ff9800', fontWeight: 600 }}>Warning:</span>{' '}
            <span>It is important to keep all parameters the same when recording </span>
            <span style={{ fontWeight: 600 }}>weights</span>
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Additional Information/Notes
            </Typography>
            <TextField
              multiline
              minRows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: Long Range Fuel Tank, Additional Water storage"
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
            >
              Save and Continue
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyInfo;
