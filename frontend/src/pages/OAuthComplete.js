import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const OAuthComplete = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const pending = params.get('pending') || '';

  useEffect(() => {
    console.log('[OAuthComplete] mounted', {
      href: window.location.href,
      hasPending: Boolean(pending),
      pendingPrefix: pending ? pending.slice(0, 12) : null,
      mode: params.get('mode'),
    });
  }, [params, pending]);

  const [userType, setUserType] = useState('diy');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [postcode, setPostcode] = useState('');
  const [abn, setAbn] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [postalAddress, setPostalAddress] = useState('');
  const [stateField, setStateField] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const needsBusiness = useMemo(() => userType === 'professional' || userType === 'fleet', [userType]);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoUrl('');
      return;
    }

    const uploadLogo = async () => {
      setLogoUploading(true);
      setError('');
      try {
        const data = new FormData();
        data.append('file', file);
        const res = await axios.post('/api/uploads/logo', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.success && res.data?.url) {
          setLogoUrl(res.data.url);
        } else {
          setError('Failed to upload logo. Please try again.');
          setLogoUrl('');
        }
      } catch (err) {
        console.error('Logo upload failed:', err);
        const message =
          err.response?.data?.message ||
          'Failed to upload logo. Please try a different image.';
        setError(message);
        setLogoUrl('');
      } finally {
        setLogoUploading(false);
      }
    };

    uploadLogo();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');

    console.log('[OAuthComplete] submit', {
      hasPending: Boolean(pending),
      pendingPrefix: pending ? pending.slice(0, 12) : null,
      userType,
      phoneLen: phone ? String(phone).length : 0,
      needsBusiness,
      hasBusinessName: Boolean(businessName.trim()),
      hasPostcode: Boolean(postcode.trim()),
      hasAbn: Boolean(abn.trim()),
      hasLogoUrl: Boolean(logoUrl.trim()),
      hasPostalAddress: Boolean(postalAddress.trim()),
      hasState: Boolean(stateField.trim()),
    });

    if (!pending) {
      setError('Missing signup token. Please try again.');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (needsBusiness) {
      if (!businessName.trim()) {
        setError('Business name is required');
        return;
      }
      if (!postcode.trim()) {
        setError('Postcode is required');
        return;
      }
      if (!abn.trim()) {
        setError('ABN is required');
        return;
      }
      if (!logoUrl.trim()) {
        setError('Logo is required');
        return;
      }
      if (!postalAddress.trim()) {
        setError('Postal address is required');
        return;
      }
      if (!stateField.trim()) {
        setError('State is required');
        return;
      }
    }

    setLoading(true);
    try {
      console.log('[OAuthComplete] calling /api/auth/google/finalize');
      const res = await axios.post('/api/auth/google/finalize', {
        pending,
        phone: phone.trim(),
        userType,
        businessName: needsBusiness ? businessName.trim() : undefined,
        postcode: needsBusiness ? postcode.trim() : undefined,
        abn: needsBusiness ? abn.trim() : undefined,
        logoUrl: needsBusiness ? logoUrl.trim() : undefined,
        postalAddress: needsBusiness ? postalAddress.trim() : undefined,
        state: needsBusiness ? stateField.trim() : undefined,
      });

      console.log('[OAuthComplete] finalize response', {
        success: res?.data?.success,
        hasToken: Boolean(res?.data?.token),
        userType: res?.data?.user?.userType,
        userId: res?.data?.user?.id,
      });

      const token = res?.data?.token;
      if (!token) {
        setError('Signup completed but no token returned. Please log in.');
        setLoading(false);
        navigate('/login');
        return;
      }

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('[OAuthComplete] finalize success, redirecting to /oauth/success');
      navigate(`/oauth/success?token=${encodeURIComponent(token)}`);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to complete signup';
      console.log('[OAuthComplete] finalize error', {
        message: msg,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 6, background: '#f5f7fb' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            Complete your signup
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            We need a few more details to finish creating your account.
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="oauth-user-type">Account type</InputLabel>
              <Select
                labelId="oauth-user-type"
                value={userType}
                label="Account type"
                onChange={(e) => setUserType(e.target.value)}
              >
                <MenuItem value="diy">DIY</MenuItem>
                <MenuItem value="professional">Professional Weighing Company</MenuItem>
                <MenuItem value="fleet">Fleet</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              sx={{ mb: 2 }}
            />

            {needsBusiness ? (
              <>
                <TextField
                  fullWidth
                  label="Business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="ABN"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Logo
                  </Typography>
                  <Button variant="outlined" component="label" fullWidth disabled={logoUploading}>
                    {logoUploading ? 'Uploading…' : logoUrl ? 'Logo uploaded' : 'Upload Logo'}
                    <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  label="Postal address"
                  value={postalAddress}
                  onChange={(e) => setPostalAddress(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="oauth-state">State</InputLabel>
                  <Select
                    labelId="oauth-state"
                    value={stateField}
                    label="State"
                    onChange={(e) => setStateField(e.target.value)}
                  >
                    <MenuItem value="NSW">NSW</MenuItem>
                    <MenuItem value="VIC">VIC</MenuItem>
                    <MenuItem value="QLD">QLD</MenuItem>
                    <MenuItem value="SA">SA</MenuItem>
                    <MenuItem value="WA">WA</MenuItem>
                    <MenuItem value="TAS">TAS</MenuItem>
                    <MenuItem value="ACT">ACT</MenuItem>
                    <MenuItem value="NT">NT</MenuItem>
                  </Select>
                </FormControl>
              </>
            ) : null}

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Please wait…' : 'Finish'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OAuthComplete;
