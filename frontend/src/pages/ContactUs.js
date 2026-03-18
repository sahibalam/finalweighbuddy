import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ContactUs = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const primary = '#2DC5A1';
  const heroBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.55) 0%, rgba(45, 197, 161, 0.30) 100%)';
  const surfaceShadow = '0 16px 40px rgba(14, 30, 50, 0.10)';
  const surfaceBorder = '1px solid rgba(17, 24, 39, 0.08)';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 2000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Navbar />

      <Box sx={{ background: heroBg, py: 6 }}>
        <Container maxWidth="lg">
          <Typography align="center" sx={{ fontSize: 38, fontWeight: 800, color: '#111827' }}>
            Contact
          </Typography>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#F3F4F6' }}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
          Connect with the Weighbuddy Team
        </Typography>
        <Typography sx={{ mt: 1, color: '#6B7280', fontSize: 14 }}>
          We here to help! Reach out to our team for support , sales inquiries, or any questions about our innovative solutions
        </Typography>

        <Grid container spacing={5} sx={{ mt: 2 }}>
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                mt: 2,
                bgcolor: '#ffffff',
                borderRadius: 3,
                boxShadow: surfaceShadow,
                border: surfaceBorder,
                p: { xs: 2.5, md: 4 },
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 20px 50px rgba(14, 30, 50, 0.14)' },
              }}
            >
              <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2.2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="Company (optional)"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    error={!!formErrors.subject}
                    helperText={formErrors.subject}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    placeholder="Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    error={!!formErrors.message}
                    helperText={formErrors.message}
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 2, bgcolor: '#ffffff' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      mt: 1,
                      bgcolor: primary,
                      px: 6,
                      borderRadius: 99,
                      fontWeight: 700,
                      '&:hover': { bgcolor: primary },
                    }}
                  >
                    SEND
                  </Button>
                  {submitSuccess ? (
                    <Typography sx={{ mt: 2, color: primary, fontWeight: 600, fontSize: 14 }}>
                      Thank you! Your message has been sent.
                    </Typography>
                  ) : null}
                </Grid>
              </Grid>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box
              sx={{
                mt: 2,
                bgcolor: '#ffffff',
                borderRadius: 3,
                boxShadow: surfaceShadow,
                border: surfaceBorder,
                p: { xs: 2.5, md: 4 },
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 20px 50px rgba(14, 30, 50, 0.14)' },
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: 16 }}>
                Support Hours
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  border: `2px dotted ${primary}`,
                  borderRadius: 2,
                  p: 2,
                  background: 'linear-gradient(180deg, rgba(139, 224, 195, 0.20) 0%, rgba(45, 197, 161, 0.08) 100%)',
                }}
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 1.4, columnGap: 2 }}>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Monday to Friday</Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>9.00 am to 5 pm</Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Saturday – Sunday</Typography>
                  <Typography sx={{ color: '#6B7280', fontSize: 14 }}>Closed</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#E5E7EB', py: 2.5, mt: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#111827', fontSize: 13 }}>
                2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap', gap: 0.5 }}>
                {[
                  { label: 'Home', to: '/' },
                  { label: 'About', to: '/about' },
                  { label: 'Privacy-Policy', to: '/privacy-policy' },
                  { label: 'T&Cs', to: '/terms' },
                  { label: 'Weighbridges', to: '/weighbridges' },
                  { label: 'Professional Weighing Companies', to: '/find-a-professional-weighing-company' },
                ].map((l, idx, arr) => (
                  <React.Fragment key={l.label}>
                    <Button
                      variant="text"
                      onClick={() => navigate(l.to)}
                      sx={{
                        textTransform: 'none',
                        minWidth: 'auto',
                        p: 0,
                        color: '#111827',
                        fontSize: 13,
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      {l.label}
                    </Button>
                    {idx < arr.length - 1 ? <Typography sx={{ color: '#111827', fontSize: 13 }}>|</Typography> : null}
                  </React.Fragment>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ContactUs;