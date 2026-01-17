import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import StripePaymentForm from '../components/StripePaymentForm';

const ProfessionalVehicleOnlyPortableTyresPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentComplete, setPaymentComplete] = useState(false);

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';
  const axleWeigh = location.state?.axleWeigh || null;
  const towBallMass = location.state?.towBallMass ?? null;
  const vci01 = location.state?.vci01 || null;

  const isTowFlow = weighingSelection === 'tow_vehicle_and_caravan';

  const headingLabel = isTowFlow
    ? 'Tow Vehicle and Caravan / Trailer'
    : 'Vehicle Only';

  const amount = isTowFlow ? 5.99 : 4.99;

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
        <Box sx={{ width: '100%', maxWidth: 700 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {headingLabel}
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Portable Scales - Individual Tyre Weights
          </Typography>

          <Typography
            variant="h5"
            sx={{ mb: 3, fontWeight: 'bold' }}
          >
            Payment due ${amount.toFixed(2)}
          </Typography>

          <StripePaymentForm
            amount={amount}
            currency="aud"
            reportData={{ flowType: 'VEHICLE_ONLY_WEIGHBRIDGE_AXLE' }}
            onSuccess={() => setPaymentComplete(true)}
            onError={() => setPaymentComplete(false)}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              disabled={!paymentComplete}
              onClick={() => {
                navigate('/professional-vehicle-only-portable-tyres-rego', {
                  state: {
                    weighingSelection,
                    axleWeigh,
                    towBallMass,
                    vci01,
                  },
                });
              }}
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

export default ProfessionalVehicleOnlyPortableTyresPayment;
