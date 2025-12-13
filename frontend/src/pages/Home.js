import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  useTheme,
  Divider,
  Paper
} from '@mui/material';
import {
  DirectionsCar,
  RocketLaunch,
  ArrowForward,
  CheckCircle,
  Star,
  TrendingUp,
  Security,
  Speed,
  Support,
  PlayArrow,
  Pause,
  ChevronLeft,
  ChevronRight,
  LocationOn,
  Phone,
  Email
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const theme = useTheme();
  const navigate = useNavigate();

  const carouselSlides = [
    {
      title: "Smart Compliance",
      subtitle: "AI-Powered Weighing",
      description: "Advanced algorithms ensure 99.9% accuracy in compliance checking",
      icon: <Security sx={{ fontSize: 40, color: '#2DC5A1' }} />,
      color: '#2DC5A1'
    },
    {
      title: "Lightning Fast",
      subtitle: "Real-Time Processing",
      description: "Get instant results with our optimized weighing system",
      icon: <Speed sx={{ fontSize: 40, color: '#8BE0C3' }} />,
      color: '#8BE0C3'
    },
    {
      title: "24/7 Support",
      subtitle: "Always Here For You",
      description: "Round-the-clock customer support for all your needs",
      icon: <Support sx={{ fontSize: 40, color: '#2DC5A1' }} />,
      color: '#2DC5A1'
    }
  ];

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, carouselSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleSlideClick = (index) => {
    setCurrentSlide(index);
  };

  const features = [
    {
      icon: <CheckCircle sx={{ fontSize: 40, color: '#2DC5A1' }} />,
      title: "Compliance Guaranteed",
      description: "100% compliance with Australian caravan regulations"
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#8BE0C3' }} />,
      title: "Real-Time Analytics",
      description: "Live insights and detailed reporting"
    },
    {
      icon: <Star sx={{ fontSize: 40, color: '#8BE0C3' }} />,
      title: "Premium Support",
      description: "Expert assistance whenever you need it"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Weighs Completed" },
    { number: "99.9%", label: "Accuracy Rate" },
    { number: "24/7", label: "Support Available" },
    { number: "500+", label: "Happy Customers" }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%)',
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
    }}>
      <Navbar />
      
      {/* Hero Section */}
      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 }, position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
                <Typography variant="h1" sx={{ fontSize: { xs: '3.5rem', md: '5rem' }, fontWeight: 900, color: '#FFFFFF', mb: 3, textShadow: '0 4px 20px rgba(14, 30, 50, 0.3)' }}>
                  Smart. Simple. Compliant.
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 5, color: '#FFFFFF', fontSize: { xs: '1.8rem', md: '3rem' }, lineHeight: 1.2 }}>
                  Your complete vehicle weighing solution — built for by professionals for professionals, fleet owners, and DIY users.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 8 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    startIcon={<RocketLaunch />}
                    endIcon={<ArrowForward />}
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: '#0E1E32',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      boxShadow: '0 8px 24px rgba(14, 30, 50, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        bgcolor: '#FFFFFF', 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 32px rgba(14, 30, 50, 0.4)'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/about')}
                    startIcon={<PlayArrow />}
                    sx={{
                      borderColor: '#FFFFFF',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      px: 4,
                      py: 2,
                      borderRadius: 3,
                      borderWidth: 2,
                      backdropFilter: 'blur(5px)',
                      background: 'rgba(255,255,255,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        borderWidth: 2, 
                        bgcolor: 'rgba(255,255,255,0.2)',
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(255,255,255,0.2)'
                      }
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>
                {/* badges removed per request */}
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 1, delay: 0.5 }}
                style={{ position: 'relative' }}
              >
                <Box sx={{ 
                  position: 'relative', 
                  height: 500, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 30px 60px rgba(14, 30, 50, 0.4)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transform: 'perspective(1000px) rotateY(-5deg) rotateX(5deg)',
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                      transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)'
                    }
                  }}>
                    <img 
                     src="/images/caravan.jpeg" 
                      alt="Vehicle"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '20px'
                      }}
                    />
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(45, 197, 161, 0.1) 0%, rgba(139, 224, 195, 0.1) 100%)',
                      borderRadius: '20px'
                    }} />
                  </Box>
                  
                  {/* Floating elements */}
                  <Box sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '5%',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(45, 197, 161, 0.3) 0%, rgba(255,255,255,0) 70%)',
                    animation: 'float 6s ease-in-out infinite',
                    zIndex: 1
                  }} />
                  
                  <Box sx={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '5%',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 224, 195, 0.3) 0%, rgba(255,255,255,0) 70%)',
                    animation: 'float 8s ease-in-out infinite reverse',
                    zIndex: 1
                  }} />
                </Box>
              </motion.div>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* Enhanced Why Choose WeighBuddy? Section */}
      <Box sx={{ 
        py: 12,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #D9E0E7 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(45, 197, 161, 0.1) 0%, rgba(255,255,255,0) 50%), radial-gradient(circle at 90% 80%, rgba(139, 224, 195, 0.1) 0%, rgba(255,255,255,0) 50%)',
          animation: 'pulse 10s ease-in-out infinite',
          zIndex: 0
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)',
          zIndex: 1
        }
      }}>
        {/* Decorative floating elements */}
        <Box sx={{
          position: 'absolute',
          top: '15%',
          left: '5%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45, 197, 161, 0.15) 0%, rgba(255,255,255,0) 70%)',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />
        
        <Box sx={{
          position: 'absolute',
          bottom: '20%',
          right: '7%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 224, 195, 0.15) 0%, rgba(255,255,255,0) 70%)',
          animation: 'float 7s ease-in-out infinite reverse',
          zIndex: 0
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center' }}
          >
            <Chip 
              label="Why WeighBuddy?" 
              sx={{ 
                mb: 3, 
                bgcolor: '#2DC5A1', 
                color: '#FFFFFF', 
                fontWeight: 700,
                fontSize: '1.1rem',
                py: 1.5,
                px: 3,
                boxShadow: '0 4px 10px rgba(14, 30, 50, 0.3)'
              }} 
            />
            <Typography variant="h3" sx={{ 
              fontWeight: 900, 
              mb: 2, 
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'rgba(255,255,255,0)',
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                bottom: -10,
                transform: 'translateX(-50%)',
                width: '80%',
                height: 4,
                background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)',
                borderRadius: 2
              }
            }}>
              The WeighBuddy Advantage
            </Typography>
            
            <Typography variant="h6" sx={{ 
              color: '#0E1E32', 
              mb: 8, 
              maxWidth: 800, 
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.25rem' },
              fontWeight: 500,
              lineHeight: 1.6
            }}>
              Discover why thousands of caravan owners and professionals trust WeighBuddy for their compliance needs
            </Typography>
          </motion.div>

          <Grid container spacing={6} alignItems="center" justifyContent="center">
            {/* Feature Cards */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 15px 40px rgba(14, 30, 50, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 25px 60px rgba(14, 30, 50, 0.3)'
                  }
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)',
                    zIndex: 1
                  }} />
                  <CardContent sx={{ p: 4, pt: 6 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 4
                    }}>
                      <Box sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(45, 197, 161, 0.1) 0%, rgba(139, 224, 195, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(14, 30, 50, 0.1)'
                      }}>
                        <Security sx={{ fontSize: 48, color: '#2DC5A1' }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" align="center" sx={{ 
                      fontWeight: 800, 
                      mb: 3,
                      background: 'linear-gradient(135deg, #2DC5A1 0%, #8BE0C3 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'rgba(255,255,255,0)'
                    }}>
                      Smart Compliance
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ 
                      color: '#0E1E32', 
                      mb: 4,
                      fontSize: '1.1rem'
                    }}>
                      Advanced AI algorithms ensure 99.9% accuracy in compliance checking with real-time validation.
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/features')}
                        sx={{
                          fontWeight: 600,
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            background: 'rgba(14, 30, 50, 0.05)'
                          }
                        }}
                      >
                        Learn More
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 15px 40px rgba(14, 30, 50, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 25px 60px rgba(14, 30, 50, 0.3)'
                  }
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: 'linear-gradient(90deg, #8BE0C3, #2DC5A1)',
                    zIndex: 1
                  }} />
                  <CardContent sx={{ p: 4, pt: 6 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 4
                    }}>
                      <Box sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(45, 197, 161, 0.1) 0%, rgba(139, 224, 195, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(14, 30, 50, 0.1)'
                      }}>
                        <Speed sx={{ fontSize: 48, color: '#8BE0C3' }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" align="center" sx={{ 
                      fontWeight: 800, 
                      mb: 3,
                      background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'rgba(255,255,255,0)'
                    }}>
                      Lightning Fast
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ 
                      color: '#0E1E32', 
                      mb: 4,
                      fontSize: '1.1rem'
                    }}>
                      Get instant results with our optimized weighing system that processes data in real-time.
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/features')}
                        sx={{
                          fontWeight: 600,
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            background: 'rgba(14, 30, 50, 0.05)'
                          }
                        }}
                      >
                        Learn More
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 15px 40px rgba(14, 30, 50, 0.2)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 25px 60px rgba(14, 30, 50, 0.3)'
                  }
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    background: 'linear-gradient(90deg, #2DC5A1, #2DC5A1)',
                    zIndex: 1
                  }} />
                  <CardContent sx={{ p: 4, pt: 6 }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 4
                    }}>
                      <Box sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(45, 197, 161, 0.1) 0%, rgba(139, 224, 195, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(14, 30, 50, 0.1)'
                      }}>
                        <Support sx={{ fontSize: 48, color: '#2DC5A1' }} />
                      </Box>
                    </Box>
                    <Typography variant="h4" align="center" sx={{ 
                      fontWeight: 800, 
                      mb: 3,
                      background: 'linear-gradient(135deg, #2DC5A1 0%, #2DC5A1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'rgba(255,255,255,0)'
                    }}>
                      24/7 Support
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ 
                      color: '#0E1E32', 
                      mb: 4,
                      fontSize: '1.1rem'
                    }}>
                      Our expert team is always available to assist with any questions or issues you encounter.
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/features')}
                        sx={{
                          fontWeight: 600,
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            background: 'rgba(14, 30, 50, 0.05)'
                          }
                        }}
                      >
                        Learn More
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Testimonials */}
          <Box sx={{ mt: 12, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, 
              mb: 4, 
              color: '#0E1E32',
              position: 'relative',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: '50%',
                bottom: -8,
                transform: 'translateX(-50%)',
                width: '50%',
                height: 3,
                background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)',
                borderRadius: 2
              }
            }}>
              What Our Customers Say
            </Typography>
            
            <Grid container spacing={4} sx={{ mt: 4 }}>
              {[
                {
                  name: "John D.",
                  role: "Caravan Owner",
                  quote: "WeighBuddy made compliance effortless. The system caught issues I would've missed completely!",
                  rating: 5
                },
                {
                  name: "Sarah M.",
                  role: "Fleet Manager",
                  quote: "The real-time analytics have transformed how we manage our caravan fleet. Highly recommended!",
                  rating: 5
                },
                {
                  name: "Michael T.",
                  role: "Transport Operator",
                  quote: "The support team is incredible. They helped us integrate WeighBuddy with our existing systems seamlessly.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Paper sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      boxShadow: '0 10px 30px rgba(14, 30, 50, 0.05)',
                      height: '100%',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: '0 15px 40px rgba(14, 30, 50, 0.1)'
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', mb: 3 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} sx={{ color: i < testimonial.rating ? '#8BE0C3' : '#D9E0E7', mr: 0.5 }} />
                        ))}
                      </Box>
                      <Typography variant="body1" sx={{ 
                        color: '#0E1E32', 
                        fontStyle: 'italic', 
                        mb: 3,
                        fontSize: '1.1rem',
                        position: 'relative',
                        '&::before, &::after': {
                          content: '"\\201C"',
                          fontSize: '3rem',
                          color: 'rgba(14, 30, 50, 0.2)',
                          position: 'absolute',
                        },
                        '&::before': {
                          top: -20,
                          left: -10
                        },
                        '&::after': {
                          content: '"\\201D"',
                          bottom: -40,
                          right: -10
                        }
                      }}>
                        {testimonial.quote}
                      </Typography>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0E1E32' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#0E1E32' }}>
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Enhanced Professional & DIY Services Section */}
      <Box sx={{ 
        py: 12, 
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 20%)',
          zIndex: 0,
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" align="center" sx={{ 
            fontWeight: 800, 
            color: '#FFFFFF', 
            mb: 6, 
            fontSize: { xs: '2rem', md: '3rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              display: 'block',
              width: 100,
              height: 4,
              background: 'linear-gradient(90deg, #ffffff, rgba(255,255,255,0.5))',
              borderRadius: 2,
              margin: '16px auto 0',
            }
          }}>
            DIY Professional and Fleet Services
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {/* Professional Services */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                style={{ width: '100%' }}
              >
                <Card sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden', 
                  boxShadow: '0 20px 50px rgba(14, 30, 50, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                  height: '100%',
                  position: 'relative',
                  '&:hover': { 
                    transform: 'translateY(-10px) scale(1.02)',
                    boxShadow: '0 30px 60px rgba(14, 30, 50, 0.4)'
                  },
                  background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        mb: 3
                      }}>
                        <TrendingUp sx={{ fontSize: 48, color: '#FFFFFF' }} />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 800, 
                        mb: 1,
                        background: 'linear-gradient(45deg, #ffffff, #D9E0E7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'rgba(255,255,255,0)'
                      }}>
                        DIY User
                      </Typography>
                      <Chip 
                        label="PREMIUM" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: '#FFFFFF', 
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          px: 2,
                          py: 1
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ 
                      mb: 3, 
                      opacity: 0.95, 
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      flexGrow: 0
                    }}>
                      Weigh Smarter — From Home or the Weighbridge
                      <br />
                      Want to check your towing setup? Weighbuddy.ai offers a simple DIY tool for enthusiasts who use a public weighbridge or home-based scales.
                      <br />
                      Log your axle weights, compare setups, and ensure your configuration meets legal and compliance standards before you travel.
                    </Typography>
                    
                    <Box sx={{ 
                      mb: 4,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 3,
                      p: 3,
                      flexGrow: 1
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        mb: 3, 
                        color: '#FFFFFF', 
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: '#8BE0C3',
                          mr: 2 
                        }} />
                        DIY users can:
                      </Typography>
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 2
                      }}>
                        {[
                          'Check all compliance areas in five simple steps',
                          'Report included: GVM, front and rear axle loadings, Tow Ball Weight, GCM, BTC, ATM and GTM',
                          'Compare different load setups',
                          'Store data for future trips',
                          'Share results with experts for modifications or insurers'
                        ].map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start',
                              p: 1.5,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                              }
                            }}>
                              <CheckCircle sx={{ fontSize: 20, color: '#8BE0C3', mt: '4px', mr: 2 }} />
                              <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.95, fontWeight: 500 }}>
                                {feature}
                              </Typography>
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/register')}
                      sx={{
                        bgcolor: '#FFFFFF',
                        color: '#0E1E32',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        py: 2,
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(14, 30, 50, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': { 
                          bgcolor: '#FFFFFF', 
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 32px rgba(14, 30, 50, 0.4)'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))',
                          transition: 'left 0.5s ease',
                        },
                        '&:hover::before': {
                          left: '100%'
                        }
                      }}
                    >
                      Start DIY Plan
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>

            {/* DIY Services */}
            <Grid item xs={12} md={4} sx={{ display: 'flex' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                style={{ width: '100%' }}
              >
                <Card sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden', 
                  boxShadow: '0 20px 50px rgba(14, 30, 50, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                  height: '100%',
                  position: 'relative',
                  '&:hover': { 
                    transform: 'translateY(-10px) scale(1.02)',
                    boxShadow: '0 30px 60px rgba(14, 30, 50, 0.4)'
                  },
                  background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        mb: 3
                      }}>
                        <Star sx={{ fontSize: 48, color: '#FFFFFF' }} />
                      </Box>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 800, 
                        mb: 1,
                        background: 'linear-gradient(45deg, #ffffff, #D9E0E7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'rgba(255,255,255,0)'
                      }}>
                        Professional User
                      </Typography>
                      <Chip 
                        label="ESSENTIAL" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.2)', 
                          color: '#FFFFFF', 
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          px: 2,
                          py: 1
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="body1" sx={{ 
                      mb: 3, 
                      opacity: 0.95, 
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      flexGrow: 0
                    }}>
                      Simplify Your Operation
                      <br />
                      Weighbuddy.ai gives weighing professionals the tools to save time, reduce paperwork, and improve consistency.
                      <br />
                      Manage customers, record weigh sessions, store results securely, and generate detailed reports — all from one intuitive dashboard.
                    </Typography>
                    
                    <Box sx={{ 
                      mb: 4,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 3,
                      p: 3,
                      flexGrow: 1
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        mb: 3, 
                        color: '#FFFFFF', 
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: '#8BE0C3',
                          mr: 2 
                        }} />
                        Key features:
                      </Typography>
                      <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        gap: 2
                      }}>
                        {[
                          'Digital weigh records & reports',
                          'Customer management tools',
                          'Cloud-based data storage',
                          'Compliance tracking and history'
                        ].map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start',
                              p: 1.5,
                              borderRadius: 2,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                              }
                            }}>
                              <CheckCircle sx={{ fontSize: 20, color: '#8BE0C3', mt: '4px', mr: 2 }} />
                              <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.95, fontWeight: 500 }}>
                                {feature}
                              </Typography>
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/register')}
                      sx={{
                        bgcolor: '#FFFFFF',
                        color: '#0E1E32',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        py: 2,
                        borderRadius: 3,
                        boxShadow: '0 8px 24px rgba(14, 30, 50, 0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': { 
                          bgcolor: '#FFFFFF', 
                          transform: 'translateY(-3px)',
                          boxShadow: '0 12px 32px rgba(14, 30, 50, 0.4)'
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0))',
                          transition: 'left 0.5s ease',
                        },
                        '&:hover::before': {
                          left: '100%'
                        }
                      }}
                    >
                      Start DIY Plan
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ 
        py: 8, 
        position: 'relative', 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #D9E0E7 100%)'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ 
            fontWeight: 800, 
            mb: 6, 
            fontSize: { xs: '2rem', md: '3rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              display: 'block',
              width: 100,
              height: 4,
              background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)',
              borderRadius: 2,
              margin: '16px auto 0',
            }
          }}>
            <Box component="span" sx={{ 
              background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'rgba(255,255,255,0)'
            }}>
              Our Impact
            </Box>
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    borderRadius: 4,
                    height: '100%',
                    background: '#FFFFFF',
                    boxShadow: '0 10px 30px rgba(14, 30, 50, 0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 15px 40px rgba(14, 30, 50, 0.1)'
                    }
                  }}>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 900, 
                      mb: 1, 
                      fontSize: { xs: '2rem', md: '3rem' },
                      background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'rgba(255,255,255,0)'
                    }}>
                      {stat.number}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      color: '#0E1E32',
                      fontSize: { xs: '1rem', md: '1.2rem' }
                    }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box sx={{ 
        py: 8, 
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #8BE0C3 0%, #2DC5A1 100%)',
        color: '#FFFFFF'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ 
            fontWeight: 800, 
            mb: 6, 
            fontSize: { xs: '2rem', md: '3rem' },
            position: 'relative',
            '&::after': {
              content: '""',
              display: 'block',
              width: 100,
              height: 4,
              background: 'linear-gradient(90deg, #ffffff, rgba(255,255,255,0.5))',
              borderRadius: 2,
              margin: '16px auto 0',
            }
          }}>
            Get in Touch
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 3, 
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    background: 'rgba(255,255,255,0.15)'
                  }
                }}>
                  <LocationOn sx={{ fontSize: 60, mb: 3, color: '#8BE0C3' }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Visit Us</Typography>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    123 Business Street<br />
                    Sydney, NSW 2000<br />
                    Australia
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      color: '#FFFFFF', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        background: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onClick={() => window.open('https://maps.google.com', '_blank')}
                  >
                    View on Map
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 3, 
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    background: 'rgba(255,255,255,0.15)'
                  }
                }}>
                  <Phone sx={{ fontSize: 60, mb: 3, color: '#8BE0C3' }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Call Us</Typography>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    +61 2 1234 5678<br />
                    Mon-Fri: 9AM-6PM<br />
                    Sat: 10AM-4PM
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      color: '#FFFFFF', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        background: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onClick={() => window.location.href = 'tel:+61212345678'}
                  >
                    Call Now
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  borderRadius: 3, 
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    background: 'rgba(255,255,255,0.15)'
                  }
                }}>
                  <Email sx={{ fontSize: 60, mb: 3, color: '#8BE0C3' }} />
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Email Us</Typography>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    info@weighbuddy.com<br />
                    support@weighbuddy.com<br />
                    Response within 2 hours
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      color: '#FFFFFF', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#FFFFFF',
                        background: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onClick={() => window.location.href = 'mailto:info@weighbuddy.com'}
                  >
                    Send Email
                  </Button>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        py: 4, 
        bgcolor: '#8BE0C3', 
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #2DC5A1, #8BE0C3)'
        }
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ mr: 1, fontSize: 32, color: '#8BE0C3' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#FFFFFF' }}>WeighBuddy</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 400 }}>
                Your trusted partner for caravan compliance and weighing solutions across Australia.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
                <Button variant="outlined" size="small" onClick={() => navigate('/about')} sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)', 
                  color: '#FFFFFF', 
                  '&:hover': { 
                    borderColor: '#FFFFFF', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  About
                </Button>
                <Button variant="outlined" size="small" onClick={() => navigate('/contact')} sx={{ 
                  borderColor: 'rgba(255,255,255,0.3)', 
                  color: '#FFFFFF', 
                  '&:hover': { 
                    borderColor: '#FFFFFF', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  Contact
                </Button>
                <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ 
                  bgcolor: '#8BE0C3', 
                  color: '#0E1E32', 
                  fontWeight: 700,
                  '&:hover': { 
                    bgcolor: '#8BE0C3', 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(139, 224, 195, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  Get Started
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />
          <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
            © 2024 WeighBuddy. All rights reserved. ABN: 12 345 678 910
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;




