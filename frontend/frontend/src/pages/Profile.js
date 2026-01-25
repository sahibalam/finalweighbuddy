import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    postcode: user?.postcode || '',
    businessName: user?.businessName || '',
    userType: user?.userType || 'diy'
  });

  const initialFirst = (user?.name || '').trim().split(' ').slice(0, -1).join(' ') || (user?.name || '').trim().split(' ')[0] || '';
  const initialLast = (user?.name || '').trim().split(' ').length > 1 ? (user?.name || '').trim().split(' ').slice(-1).join(' ') : '';
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile update mutation
  const profileMutation = useMutation(
    async (data) => {
      const response = await axios.put('/api/auth/profile', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        updateProfile(data.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
        queryClient.invalidateQueries(['user']);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error updating profile');
      }
    }
  );

  // Password change mutation
  const passwordMutation = useMutation(
    async (data) => {
      const response = await axios.put('/api/auth/password', data);
      return response.data;
    },
    {
      onSuccess: () => {
        setSuccess('Password changed successfully!');
        setPasswordMode(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Error changing password');
      }
    }
  );

  // Handle profile form changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Keep name in sync when first/last change
  const handleFirstNameChange = (value) => {
    setFirstName(value);
    const combined = [value, lastName].filter(Boolean).join(' ').trim();
    setProfileData(prev => ({ ...prev, name: combined }));
  };
  const handleLastNameChange = (value) => {
    setLastName(value);
    const combined = [firstName, value].filter(Boolean).join(' ').trim();
    setProfileData(prev => ({ ...prev, name: combined }));
  };

  // Handle password form changes
  const handlePasswordFormChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle profile save
  const handleProfileSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await profileMutation.mutateAsync(profileData);
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await passwordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Get user type chip
  const getUserTypeChip = (userType) => {
    switch (userType) {
      case 'professional':
        return <Chip label="Professional" color="primary" />;
      case 'diy':
        return <Chip label="DIY" color="secondary" />;
      case 'admin':
        return <Chip label="Admin" color="error" />;
      default:
        return <Chip label={userType} color="default" />;
    }
  };

  // Get subscription status chip
  const getSubscriptionChip = (subscription) => {
    if (!subscription) return <Chip label="No Subscription" color="default" />;
    
    if (subscription.status === 'active') {
      return <Chip label="Active" color="success" />;
    } else if (subscription.status === 'expired') {
      return <Chip label="Expired" color="error" />;
    } else {
      return <Chip label={subscription.status} color="warning" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage your account information and preferences
        </Typography>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Profile Information
                </Typography>
                <Box>
                  {editMode ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleProfileSave}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setEditMode(false);
                          setProfileData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            postcode: user?.postcode || '',
                            businessName: user?.businessName || '',
                            userType: user?.userType || 'diy'
                          });
                          const resetFirst = (user?.name || '').trim().split(' ').slice(0, -1).join(' ') || (user?.name || '').trim().split(' ')[0] || '';
                          const resetLast = (user?.name || '').trim().split(' ').length > 1 ? (user?.name || '').trim().split(' ').slice(-1).join(' ') : '';
                          setFirstName(resetFirst);
                          setLastName(resetLast);
                        }}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setEditMode(true)}
                      startIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    disabled={!editMode}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    disabled={!editMode}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Postcode"
                    value={profileData.postcode}
                    onChange={(e) => handleProfileChange('postcode', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                {user?.userType === 'professional' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Name"
                      value={profileData.businessName}
                      onChange={(e) => handleProfileChange('businessName', e.target.value)}
                      disabled={!editMode}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>User Type</InputLabel>
                    <Select
                      value={profileData.userType}
                      label="User Type"
                      onChange={(e) => handleProfileChange('userType', e.target.value)}
                    >
                      <MenuItem value="diy">DIY</MenuItem>
                      {profileData.userType !== 'diy' && (
                        <MenuItem value={profileData.userType} disabled>
                          {String(profileData.userType).charAt(0).toUpperCase() + String(profileData.userType).slice(1)}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1 }} />
                Account Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User Type
                </Typography>
                {getUserTypeChip(user?.userType)}
              </Box>

              {user?.userType !== 'diy' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Subscription Status
                  </Typography>
                  {getSubscriptionChip(user?.subscription)}
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Weighs
                </Typography>
                <Typography variant="h6">
                  {user?.weighCount || 0}
                </Typography>
              </Box>

              {/* <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Free Weighs Remaining
                </Typography>
                <Typography variant="h6" color="primary">
                  {user?.userType === 'diy' ? Math.max(0, 5 - (user?.weighCount || 0)) : 'Unlimited'}
                </Typography>
              </Box> */}

              {user?.userType === 'professional' && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rewards Earned
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {Math.floor((user?.weighCount || 0) / 10)} free weighs
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {passwordMode ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                          >
                            {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                          >
                            {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                          >
                            {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        onClick={handlePasswordSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                      >
                        Change Password
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setPasswordMode(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        startIcon={<CancelIcon />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => setPasswordMode(true)}
                  startIcon={<SecurityIcon />}
                >
                  Change Password
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1 }} />
                Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="SMS Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Auto-save Drafts"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Compliance Alerts"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 