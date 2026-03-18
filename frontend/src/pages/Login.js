import React, { useEffect, useState } from 'react';
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
  Grid,
  Fade
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  DirectionsCar,
  RocketLaunch,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('token'));
    console.log('[Login] auth guard', {
      isAuthenticated,
      authLoading,
      hasToken,
      userType: user?.userType,
    });

    if (authLoading) return;

    if (isAuthenticated || (hasToken && user)) {
      const userType = user?.userType;
      if (userType === 'professional') {
        navigate('/professional-clients', { replace: true });
      } else if (userType === 'fleet') {
        navigate('/fleet', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, navigate, user]);

  const primary = '#2DC5A1';
  const primaryLight = '#8BE0C3';
  const heroBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.55) 0%, rgba(45, 197, 161, 0.30) 100%)';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);

    if (result.success) {
      const loggedInUser = result.user || user;

      if (loggedInUser?.userType === 'professional') {
        navigate('/professional-clients');
      } else if (loggedInUser?.userType === 'fleet') {
        navigate('/fleet');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogle = () => {
    const base = process.env.NODE_ENV === 'development'
      ? 'http://localhost:5001'
      : (process.env.REACT_APP_API_URL || '');

    window.location.href = `${base}/api/auth/google/start?mode=login`;
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
                      color: primary,
                      mb: 1,
                      filter: 'drop-shadow(0 0 8px rgba(45, 197, 161, 0.35))'
                    }} />
                  </motion.div>
                  
                  <Typography 
                    component="h1" 
                    variant="h3" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 800,
                      letterSpacing: 1,
                      color: '#111827',
                      textShadow: '0 2px 10px rgba(17, 24, 39, 0.10)',
                      mb: 1
                    }}
                  >
                    Welcome to WeighBuddy
                  </Typography>
                  
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 500,
                      color: '#111827',
                      mb: 2
                    }}
                  >
                    Your Smart Weigh Compliance Partner
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#374151',
                      maxWidth: '500px',
                      mx: { xs: 'auto', md: 0 },
                      lineHeight: 1.7,
                      fontSize: '1.1rem'
                    }}
                  >
                    Sign in to access your dashboard and ensure your caravan meets all safety and regulatory standards. 
                    Experience precision weighing and compliance like never before.
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: { xs: 'center', md: 'flex-start' }, 
                    mt: 3,
                    gap: 2
                  }}>
                    {['Security', 'Precision', 'Compliance'].map((text, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                      >
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.65)',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(17, 24, 39, 0.08)',
                        }}>
                          <Typography variant="body2" sx={{ color: '#111827', fontWeight: 600 }}>
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
                      background: `linear-gradient(90deg, ${primaryLight}, ${primary})`,
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
                      color: primary,
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Sign In to Your Account
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
                    Enter your credentials to access your dashboard
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
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={formData.email}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused fieldset': {
                            borderColor: primary,
                            boxShadow: '0 0 0 2px rgba(45, 197, 161, 0.20)'
                          }
                        }
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
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
                            borderColor: primary,
                            boxShadow: '0 0 0 2px rgba(45, 197, 161, 0.20)'
                          }
                        }
                      }}
                    />

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
                        background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                        boxShadow: '0 4px 15px rgba(45, 197, 161, 0.35)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${primaryLight} 0%, ${primary} 100%)`,
                          boxShadow: '0 6px 20px rgba(45, 197, 161, 0.50)',
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
                        'Sign In'
                      )}
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={loading}
                      sx={{
                        mt: 1.5,
                        textTransform: 'none',
                        fontWeight: 800,
                        borderRadius: 2,
                        py: 1.2,
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        border: '1px solid rgba(17, 24, 39, 0.12)',
                        boxShadow: '0 10px 22px rgba(14, 30, 50, 0.08)',
                        '&:hover': {
                          backgroundColor: '#ffffff',
                          boxShadow: '0 14px 30px rgba(14, 30, 50, 0.12)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'transform 160ms ease, box-shadow 160ms ease',
                      }}
                      onClick={handleGoogle}
                    >
                      Continue with Google
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Don't have an account?{' '}
                        <Link
                          component={RouterLink}
                          to="/signup"
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: '#2DC5A1',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Sign up here
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

export default Login;