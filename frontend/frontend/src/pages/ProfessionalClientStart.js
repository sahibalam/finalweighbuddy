import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Subscriptions as SubscriptionsIcon,
  Add as AddIcon,
  History as HistoryIcon,
  DirectionsCar as DirectionsCarIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ProfessionalClientStart = () => {
  const [clientMode, setClientMode] = useState('new');
  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    notes: ''
  });
  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    setClientForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (clientMode === 'new') {
      try {
        const payload = {
          firstName: clientForm.firstName,
          lastName: clientForm.lastName,
          email: clientForm.email,
          phone: clientForm.phone,
          password: clientForm.password,
          notes: clientForm.notes,
        };

        // Persist the raw draft for any future use
        localStorage.setItem('professionalClientDraft', JSON.stringify(payload));

        // Also persist a normalized pending client object used by
        // professional confirm/result screens to create a DIY client
        // and send the welcome email.
        const pendingClient = {
          ...payload,
          clientType: 'new',
        };
        localStorage.setItem('weighbuddy_pendingClient', JSON.stringify(pendingClient));
      } catch (err) {
        console.error('Failed to persist client draft locally', err);
      }
    }

    navigate('/professional-weigh-start');
  };

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
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Paper sx={{ width: '100%', maxWidth: 900, p: 4 }} elevation={3}>
          <Grid container>
            <Grid item xs={12} sx={{ p: 0 }}>
              <Typography variant="h5" align="center" gutterBottom>
                WeighBuddy Compliance Check
              </Typography>

              <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                <FormControl fullWidth>
                  <InputLabel id="client-mode-label">New or existing client</InputLabel>
                  <Select
                    labelId="client-mode-label"
                    label="New or existing client"
                    value={clientMode}
                    onChange={(e) => setClientMode(e.target.value)}
                  >
                    <MenuItem value="new">New Client</MenuItem>
                    <MenuItem value="existing-same-setup">Existing Client with same set up</MenuItem>
                    <MenuItem value="existing-new-setup">Existing Client with new set up</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {clientMode === 'new' ? 'Create a new Client' : 'Existing Client'}
                </Typography>

                <form onSubmit={handleSubmit}>
                  {clientMode === 'new' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          size="small"
                          value={clientForm.firstName}
                          onChange={handleChange('firstName')}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          size="small"
                          value={clientForm.lastName}
                          onChange={handleChange('lastName')}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          size="small"
                          value={clientForm.email}
                          onChange={handleChange('email')}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          size="small"
                          value={clientForm.phone}
                          onChange={handleChange('phone')}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Password"
                          type="password"
                          size="small"
                          value={clientForm.password}
                          onChange={handleChange('password')}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Additional Information"
                          size="small"
                          multiline
                          minRows={3}
                          value={clientForm.notes}
                          onChange={handleChange('notes')}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {clientMode !== 'new' && (
                    <Box sx={{ mt: 2 }}>
                      {/* Placeholder for existing client search / selection */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Search existing client (name, email, phone)"
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button type="submit" variant="contained">
                      Continue
                    </Button>
                  </Box>
                </form>
              </Box>

              <Box sx={{ mt: 6 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="center"
                  sx={{ display: 'block' }}
                >
                  YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProfessionalClientStart;
