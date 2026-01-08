import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AccountTypeSelection = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('diy');

  const handleChange = (event) => {
    const selectedType = event.target.value;
    setAccountType(selectedType);
  };

  const handleContinue = () => {
    navigate('/register', { state: { accountType } });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        backgroundImage:
          'linear-gradient(0deg, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src="/images/weighbuddy logo green background.png"
            alt="WeighBuddy Logo"
            sx={{ height: 40, width: 'auto', borderRadius: 1 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 500, color: '#333' }}
          >
            WeighBuddy Compliance Check
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          pb: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.12)',
              backgroundColor: 'rgba(255,255,255,0.96)',
              textAlign: 'center'
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 3, fontWeight: 500, color: '#333' }}
            >
              Create your Account
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="account-type-label">Account type</InputLabel>
              <Select
                labelId="account-type-label"
                id="account-type"
                value={accountType}
                label="Account type"
                onChange={handleChange}
              >
                <MenuItem value="diy">DIY</MenuItem>
                <MenuItem value="professional">Professional Weighing Company</MenuItem>
                <MenuItem value="fleet">Fleet</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              fullWidth
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Paper>
        </Container>
      </Box>

      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.12)',
          textAlign: 'left'
        }}
      >
        <Typography variant="caption" sx={{ color: '#555' }}>
          YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountTypeSelection;
