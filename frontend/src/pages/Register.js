import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Fade
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person, 
  Phone, 
  Business,
  LocationOn,
  DirectionsCar,
  RocketLaunch,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    postcode: '',
    userType: 'diy',
    businessName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }

    if (formData.userType === 'professional' && !formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required for professional users';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(formData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)',
          animation: 'rotate 30s linear infinite',
          zIndex: 0,
          '@keyframes rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        },
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 0.3,
            transform: 'scale(1)'
          },
          '50%': {
            opacity: 0.6,
            transform: 'scale(1.05)'
          }
        },
        '@keyframes float': {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-20px)'
          }
        }
      }}
    >
      <Navbar />
      
      {/* Floating background elements */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            opacity: 0.1
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        py: 8,
        position: 'relative',
        zIndex: 1
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Box sx={{ 
                  textAlign: { xs: 'center', md: 'left' },
                  mb: 4,
                  px: 2
                }}>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <DirectionsCar sx={{ 
                      fontSize: 60, 
                      color: '#FFD700',
                      mb: 1,
                      filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))'
                    }} />
                  </motion.div>
                  
                  <Typography 
                    component="h1" 
                    variant="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 800,
                      letterSpacing: 1,
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      mb: 1
                    }}
                  >
                    Join WeighBuddy
                  </Typography>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 500,
                      color: '#FFD700',
                      mb: 2
                    }}
                  >
                    Your Smart Weigh Compliance Partner
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      maxWidth: '500px',
                      mx: { xs: 'auto', md: 0 },
                      lineHeight: 1.7,
                      fontSize: '1.1rem'
                    }}
                  >
                    Create your account today to ensure your caravan meets all safety and regulatory standards. 
                    Whether you're a DIY enthusiast or a professional service provider, we've got you covered.
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: { xs: 'center', md: 'flex-start' }, 
                    mt: 3,
                    gap: 2
                  }}>
                    {['Safety', 'Compliance', 'Precision'].map((text, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                      >
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.1)',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          backdropFilter: 'blur(5px)'
                        }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                            {text}
                          </Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    }
                  }}
                >
                  <Typography 
                    component="h2" 
                    variant="h4" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      mt: 1,
                      color: '#5d5dff',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Create Your Account
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 3,
                      textAlign: 'center',
                      maxWidth: '400px'
                    }}
                  >
                    Join WeighBuddy today and ensure your caravan compliance
                  </Typography>

                  {error && (
                    <Fade in={!!error}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          width: '100%', 
                          mb: 2,
                          borderRadius: 2,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}

                  <Box 
                    component="form" 
                    onSubmit={handleSubmit} 
                    sx={{ 
                      width: '100%',
                      '& .MuiTextField-root': {
                        mb: 1.5
                      }
                    }}
                  >
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="name"
                      label="Full Name"
                      name="name"
                      autoComplete="name"
                      autoFocus
                      value={formData.name}
                      onChange={handleChange}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color={errors.name ? "error" : "action"} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                          }
                        }
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color={errors.email ? "error" : "action"} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                          }
                        }
                      }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="phone"
                          label="Phone Number"
                          id="phone"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          error={!!errors.phone}
                          helperText={errors.phone}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone color={errors.phone ? "error" : "action"} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="postcode"
                          label="Postcode"
                          id="postcode"
                          value={formData.postcode}
                          onChange={handleChange}
                          error={!!errors.postcode}
                          helperText={errors.postcode}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn color={errors.postcode ? "error" : "action"} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    <FormControl 
                      fullWidth 
                      margin="normal" 
                      error={!!errors.userType}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    >
                      <InputLabel id="user-type-label">User Type</InputLabel>
                      <Select
                        labelId="user-type-label"
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        label="User Type"
                        onChange={handleChange}
                      >
                        <MenuItem value="diy">DIY Customer</MenuItem>
                        <MenuItem value="professional">Professional Business</MenuItem>
                      </Select>
                      {errors.userType && <FormHelperText>{errors.userType}</FormHelperText>}
                    </FormControl>

                    {formData.userType === 'professional' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="businessName"
                          label="Business Name"
                          id="businessName"
                          value={formData.businessName}
                          onChange={handleChange}
                          error={!!errors.businessName}
                          helperText={errors.businessName}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business color={errors.businessName ? "error" : "action"} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                        />
                      </motion.div>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="password"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          error={!!errors.password}
                          helperText={errors.password}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color={errors.password ? "error" : "action"} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock color={errors.confirmPassword ? "error" : "action"} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&.Mui-focused fieldset': {
                                borderColor: '#667eea',
                                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                              }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? null : <RocketLaunch />}
                      endIcon={loading ? null : <ArrowForward />}
                      sx={{ 
                        mt: 3, 
                        mb: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a70d9 0%, #6a42a3 100%)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          transition: 'left 0.7s ease',
                        },
                        '&:hover::before': {
                          left: '100%'
                        }
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Already have an account?{' '}
                        <Link 
                          component={RouterLink} 
                          to="/login" 
                          variant="body2"
                          sx={{ 
                            fontWeight: 600,
                            textDecoration: 'none',
                            color: '#764ba2',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#5a42a3'
                            }
                          }}
                        >
                          Sign in here
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;