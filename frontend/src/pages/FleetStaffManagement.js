import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FleetStaffManagement = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const canCreate = useMemo(() => {
    if (!String(firstName).trim() || !String(lastName).trim() || !String(email).trim()) {
      return false;
    }

    const pwd = String(password);
    const confirm = String(confirmPassword);

    // If either password field is used, require both + match.
    if (pwd || confirm) {
      if (!pwd || !confirm) return false;
      if (pwd !== confirm) return false;
      if (pwd.length < 6) return false;
    }

    return true;
  }, [confirmPassword, email, firstName, lastName, password]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/fleet/staff');
      setStaff(res?.data?.staff || []);
    } catch (error) {
      console.error('Failed to load fleet staff:', error?.response?.data || error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async () => {
    if (saving || !canCreate) return;

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        window.alert('Password and Confirm Password do not match.');
        return;
      }
      if (String(password).length < 6) {
        window.alert('Password must be at least 6 characters.');
        return;
      }
    }

    setSaving(true);
    try {
      const submittedPassword = password;
      const res = await axios.post('/api/fleet/staff', {
        firstName,
        lastName,
        email,
        ...(password ? { password } : {}),
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      const tempPassword = res?.data?.tempPassword;
      try {
        const passwordToEmail = tempPassword || submittedPassword || '';
        if (email && passwordToEmail) {
          window.sessionStorage.setItem(
            'weighbuddy_fleet_new_staff_credentials',
            JSON.stringify({
              email: String(email).trim().toLowerCase(),
              firstName: String(firstName).trim(),
              password: passwordToEmail,
              sent: false,
            })
          );
        }
      } catch (e) {
        // ignore storage errors
      }
      if (tempPassword) {
        window.alert(`User created. Temporary password: ${tempPassword}`);
      }
      navigate('/new-weigh');
    } catch (error) {
      console.error('Failed to create staff member:', error?.response?.data || error);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member) => {
    setEditId(member?._id || null);
    setEditFirstName(member?.firstName || '');
    setEditLastName(member?.lastName || '');
    setEditEmail(member?.email || '');
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditId(null);
  };

  const handleSaveEdit = async () => {
    if (saving || !editId) return;
    setSaving(true);
    try {
      await axios.put(`/api/fleet/staff/${editId}`, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
      });
      closeEdit();
      await loadStaff();
    } catch (error) {
      console.error('Failed to update staff member:', error?.response?.data || error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (saving || !id) return;
    setSaving(true);
    try {
      await axios.delete(`/api/fleet/staff/${id}`);
      await loadStaff();
    } catch (error) {
      console.error('Failed to remove staff member:', error?.response?.data || error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Staff Management
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, width: 160 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Loading staff...' : 'No staff members yet.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell>
                    {member.firstName} {member.lastName}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleRemove(member._id)}
                      disabled={saving}
                      sx={{ mr: 1 }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openEdit(member)}
                      disabled={saving}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, textAlign: 'center' }}>
          Create new User
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean((password || confirmPassword) && password !== confirmPassword)}
              helperText={
                (password || confirmPassword) && password !== confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || !canCreate}
          >
            Create User
          </Button>
        </Box>
      </Paper>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FleetStaffManagement;
