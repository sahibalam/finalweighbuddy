import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, FormControlLabel, Checkbox } from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';

const CustomerResponsibilityDisclaimer = ({ onDisclaimerAccepted }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleTermsChange = (checked) => {
    setTermsAccepted(checked);
    onDisclaimerAccepted(checked);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <GavelIcon color="warning" />
            <Typography variant="h6" color="warning.main">
              Customer Responsibility Disclaimer
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => handleTermsChange(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Typography variant="body1">
                I have read and agree to the terms and conditions of using this DIY weigh service
              </Typography>
            }
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default CustomerResponsibilityDisclaimer;



