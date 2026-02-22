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
import axios from 'axios';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingQuery, setExistingQuery] = useState('');
  const [existingClient, setExistingClient] = useState(null);
  const [existingClientError, setExistingClientError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    setClientForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleExistingQueryChange = async (event) => {
    const value = event.target.value;
    setExistingQuery(value);
    setExistingClient(null);
    setExistingClientError('');

    const query = value.trim();
    if (!query) return;

    setIsLookingUp(true);
    try {
      const { data } = await axios.get('/api/auth/professional-clients/lookup', {
        params: { query }
      });

      const client = data?.client;
      if (!client) {
        setExistingClient(null);
        setExistingClientError('Client not found');
        return;
      }

      setExistingClient(client);
      setExistingClientError('');

      const nameParts = String(client.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');

      const draft = {
        firstName,
        lastName,
        email: client.email || '',
        phone: client.phone || '',
        notes: '',
        diyClientUserId: client.id,
      };

      localStorage.setItem('professionalClientDraft', JSON.stringify(draft));
    } catch (err) {
      if (err?.response?.status === 404) {
        setExistingClient(null);
        setExistingClientError('Client not found');
      } else {
        console.error('Failed to lookup existing client', err);
        setExistingClient(null);
        setExistingClientError('Error looking up client');
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (clientMode === 'new') {
      setIsSubmitting(true);
      try {
        const emailQuery = String(clientForm.email || '').trim();
        if (emailQuery) {
          try {
            // See if a client with this email already exists for this professional
            await axios.get('/api/auth/professional-clients/lookup', {
              params: { query: emailQuery }
            });

            // If we reach here without throwing, a client already exists
            alert('A client with this email already exists. Please choose "Existing Client" from the dropdown instead of creating a new one.');
            setIsSubmitting(false);
            return;
          } catch (lookupErr) {
            // 404 = not found, which is fine for creating a new client
            if (lookupErr?.response?.status !== 404) {
              console.error('Error checking for existing client by email', lookupErr);
              alert('Could not verify whether this client already exists. Please try again.');
              setIsSubmitting(false);
              return;
            }
          }
        }

        const payload = {
          firstName: clientForm.firstName,
          lastName: clientForm.lastName,
          email: clientForm.email,
          phone: clientForm.phone,
          password: clientForm.password,
        };

        const res = await axios.post('/api/auth/create-diy-client-from-professional', payload);
        const diyClientUserId = res?.data?.diyClientUserId;

        const draft = {
          firstName: clientForm.firstName,
          lastName: clientForm.lastName,
          email: clientForm.email,
          phone: clientForm.phone,
          notes: clientForm.notes,
          diyClientUserId,
        };

        localStorage.setItem('professionalClientDraft', JSON.stringify(draft));
      } catch (err) {
        console.error('Failed to create DIY client from professional flow', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to create client';
        alert(msg);
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    } else {
      // Existing client mode: ensure we have a draft with diyClientUserId
      const draftRaw = localStorage.getItem('professionalClientDraft');
      const draft = draftRaw ? JSON.parse(draftRaw) : null;
      if (!draft || !draft.diyClientUserId) {
        alert('Please look up an existing client by email or phone before continuing.');
        return;
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
                      <TextField
                        fullWidth
                        size="small"
                        label="Search existing client (email or phone)"
                        value={existingQuery}
                        onChange={handleExistingQueryChange}
                        helperText={
                          existingClientError
                            ? existingClientError
                            : existingClient
                            ? `${existingClient.name} (${existingClient.email}, ${existingClient.phone})`
                            : isLookingUp
                            ? 'Looking up client...'
                            : 'Enter email or phone number to find an existing client'
                        }
                        error={Boolean(existingClientError)}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
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
