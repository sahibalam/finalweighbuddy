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

  const primary = '#2DC5A1';
  const primaryLight = '#8BE0C3';
  const heroBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.55) 0%, rgba(45, 197, 161, 0.30) 100%)';
  const surfaceShadow = '0 16px 40px rgba(14, 30, 50, 0.10)';
  const surfaceBorder = '1px solid rgba(17, 24, 39, 0.08)';

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
        background: heroBg,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 20%)',
          zIndex: 0,
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
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
            sx={{ fontWeight: 700, color: '#111827' }}
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
          pb: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: surfaceBorder,
              backgroundColor: 'rgba(255,255,255,0.96)',
              textAlign: 'center',
              boxShadow: surfaceShadow,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: `linear-gradient(90deg, ${primaryLight}, ${primary})`,
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 3, fontWeight: 800, color: '#111827', mt: 1 }}
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
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 24, 39, 0.18)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primary },
                }}
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
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                borderRadius: 2,
                py: 1.3,
                background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                boxShadow: '0 10px 22px rgba(45, 197, 161, 0.28)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                  boxShadow: '0 14px 30px rgba(45, 197, 161, 0.40)',
                  transform: 'translateY(-1px)',
                },
                transition: 'transform 160ms ease, box-shadow 160ms ease',
              }}
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
          borderTop: '1px solid rgba(17, 24, 39, 0.10)',
          textAlign: 'left',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: '#111827' }}>
          YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
        </Typography>
      </Box>
    </Box>
  );
};

export default AccountTypeSelection;
