import React, { useState } from 'react';
import { Box, Paper, Typography, Container, TextField, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const DIYCaravanOnlyWeighbridgeAboveGround = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [caravanAtm, setCaravanAtm] = useState('');

  const handleContinue = () => {
    const baseState = location.state || {};

    const axleWeigh = {
      caravanAtm: caravanAtm ? Number(caravanAtm) : null
    };

    navigate('/diy-weigh', {
      state: {
        ...baseState,
        axleWeigh,
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
            Weighbridge - Above Ground
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Disclaimer
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            Accuracy of Weigh Data
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            When using an above-ground weighbridge with a single weighing platform, axle group loading, GTM and Towball Mass may not be accurate unless the vehicle is sitting level off the weigh bridge. If this is possible use In Ground weighbridge option.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            For a more detailed and precise weigh report, WeighBuddy recommends using:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            • individual calibrated tyre scales,
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            • a goweigh style above-ground weighbridge with split sections that capture weights separately.
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, mb: 3 }}>
            • In Ground Weighbridges where the vehicle is level and individual axle weight can be recorded.
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 2 }}
          >
            Weigh Caravan Trailer
          </Typography>

          <Typography variant="body2" sx={{ mb: 3 }}>
            Drive Caravan / Trailer onto weigh bridge and disconnect Tow Vehicle. Remove tow vehicle from weigh bridge.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Typography variant="body1" sx={{ minWidth: 220 }}>
              Aggregated Trailor Mass (ATM)
            </Typography>
            <TextField
              value={caravanAtm}
              onChange={(e) => setCaravanAtm(e.target.value)}
              placeholder="ATM"
              sx={{ width: 160, mr: 1 }}
            />
            <Typography variant="body1">kg</Typography>
          </Box>

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

export default DIYCaravanOnlyWeighbridgeAboveGround;
