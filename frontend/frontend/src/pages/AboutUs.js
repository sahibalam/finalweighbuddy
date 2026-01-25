import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Paper,
  useTheme,
  Button,
  Divider
} from '@mui/material';
import {
  DirectionsCar,
  Security,
  Speed,
  Support,
  Star,
  TrendingUp,
  Verified,
  EmojiEvents,
  Business,
  Person,
  CheckCircle,
  Favorite,
  Lightbulb,
  Group,
  LocationOn,
  ConnectWithoutContact,
  Handshake,
  Phone,
  Email,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AboutUs = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const values = [
    {
      icon: <Security sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Trust & Security',
      description: 'We prioritize the security of your data and the trust of our customers above all else.',
      color: '#4CAF50'
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Innovation',
      description: 'Continuously improving our technology to provide the best compliance solutions.',
      color: '#2196F3'
    },
    {
      icon: <Support sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: 'Customer First',
      description: 'Every decision we make is centered around providing exceptional customer experience.',
      color: '#FF9800'
    },
    {
      icon: <CheckCircle sx={{ fontSize: 40, color: '#FFD700' }} />,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service and product delivery.',
      color: '#FFD700'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      avatar: 'SJ',
      bio: 'Former fleet manager with 15+ years in the caravan industry. Passionate about making compliance accessible to everyone.',
      expertise: ['Fleet Management', 'Compliance', 'Business Strategy'],
      accentColor: '#4CAF50'
    },
    {
      name: 'Mike Chen',
      role: 'CTO',
      avatar: 'MC',
      bio: 'Technology leader with expertise in cloud infrastructure and real-time systems. Drives our technical innovation.',
      expertise: ['Cloud Architecture', 'AI/ML', 'System Design'],
      accentColor: '#2196F3'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Head of Operations',
      avatar: 'ER',
      bio: 'Operations specialist focused on delivering exceptional customer experiences and streamlined processes.',
      expertise: ['Customer Success', 'Process Optimization', 'Team Leadership'],
      accentColor: '#FF9800'
    },
    {
      name: 'David Thompson',
      role: 'Lead Developer',
      avatar: 'DT',
      bio: 'Full-stack developer with a passion for creating intuitive user experiences and robust backend systems.',
      expertise: ['React/Node.js', 'API Design', 'UI/UX'],
      accentColor: '#FFD700'
    }
  ];

  const stats = [
    { number: '15,000+', label: 'Weighs Completed', icon: <TrendingUp sx={{ color: '#667eea' }} />, color: '#667eea' },
    { number: '750+', label: 'Happy Customers', icon: <Star sx={{ color: '#FFD700' }} />, color: '#FFD700' },
    { number: '99.9%', label: 'Uptime', icon: <Verified sx={{ color: '#4CAF50' }} />, color: '#4CAF50' },
    { number: '24/7', label: 'Support', icon: <Support sx={{ color: '#FF9800' }} />, color: '#FF9800' }
  ];

  const milestones = [
    { year: '2018', title: 'Founded', description: 'WeighBuddy was established in Melbourne' },
    { year: '2019', title: 'First Prototype', description: 'Launched our MVP to select customers' },
    { year: '2020', title: 'National Expansion', description: 'Expanded services across Australia' },
    { year: '2022', title: 'Mobile App Launch', description: 'Released iOS and Android applications' },
    { year: '2023', title: 'AI Integration', description: 'Implemented AI-powered compliance checks' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e6e9f2 100%)',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(102,126,234,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 80%, rgba(118,75,162,0.1) 0%, transparent 20%)',
        animation: 'rotate 30s linear infinite',
        zIndex: 0,
        '@keyframes rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    }}>
      <Navbar />
      
   {/* Hero Section */}
<Box
  sx={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    py: { xs: 8, md: 12 },
    mt: 8,
    position: 'relative',
    overflow: 'hidden'
  }}
>
  <Container maxWidth="lg">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Chip 
        label="Our Story" 
        sx={{ 
          mb: 3, 
          bgcolor: 'rgba(255,255,255,0.2)', 
          color: 'white', 
          fontWeight: 700,
          fontSize: '1.1rem',
          py: 1.5,
          px: 3
        }} 
      />
      <Typography
        variant="h1"
        component="h1"
        gutterBottom
        sx={{
          fontSize: { xs: '2.5rem', md: '4rem' },
          fontWeight: 900,
          mb: 3,
          textShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        About WeighBuddy
      </Typography>
      <Typography
        variant="h5"
        sx={{
          maxWidth: 800,
          opacity: 0.9,
          lineHeight: 1.6,
          fontSize: { xs: '1.1rem', md: '1.3rem' },
          mb: 4
        }}
      >
        Revolutionizing caravan compliance checking with cutting-edge technology and unwavering commitment to safety.
      </Typography>
      
      {/* Wrap buttons in Box with bottom padding */}
      <Box sx={{ 
        display: 'flex', 
        gap: 3, 
        mt: 4,
        pb: 6 // Add padding bottom here
      }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            onClick={() => navigate('/register')}
            startIcon={<ArrowForward />}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': { 
                bgcolor: 'white', 
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
              }
            }}
          >
            Get Started
          </Button>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outlined" 
            size="large"
            onClick={() => navigate('/contact')}
            startIcon={<ConnectWithoutContact />}
            sx={{
              borderColor: 'white',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.1rem',
              px: 4,
              py: 1.5,
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
            Contact
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  </Container>
  
  {/* Wave Divider */}
  <Box sx={{ 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    height: '100px',
    background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23${theme.palette.background.default.replace('#', '')}' fill-opacity='1' d='M0,96L60,112C120,128,240,160,360,165.3C480,171,600,149,720,138.7C840,128,960,128,1080,138.7C1200,149,1320,171,1380,181.3L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundSize: 'cover',
    backgroundPosition: 'bottom'
  }} />
</Box>

      {/* Our Story Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative' }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Typography 
                variant="h2" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 800, 
                  mb: 4,
                  position: 'relative',
                  display: 'inline-block',
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: 0,
                    width: '80px',
                    height: '5px',
                    background: 'linear-gradient(to right, #667eea, #764ba2)',
                    borderRadius: '5px'
                  }
                }}
              >
                Our Journey
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
                WeighBuddy was born from a simple observation: the caravan industry was struggling with complex, 
                time-consuming compliance processes that often led to errors and delays.
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
                Our founder, Sarah Johnson, spent 15 years managing a large fleet of caravans and experienced 
                firsthand the challenges of ensuring compliance while maintaining operational efficiency.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                Today, WeighBuddy serves thousands of professionals and individuals across Australia, 
                making caravan compliance checking simple, accurate, and accessible to everyone.
              </Typography>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                  position: 'relative'
                }}
              >
                <Box sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  background: 'linear-gradient(45deg, #f5f7fa, #e4e8f0)'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '80%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '15px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2)'
                  }}>
                    <DirectionsCar sx={{ 
                      fontSize: 120, 
                      color: 'white',
                      opacity: 0.8,
                      filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))'
                    }} />
                  </Box>
                  
                  <motion.div
                    animate={{ 
                      y: [0, -20, 0],
                      rotate: [0, 5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      position: 'absolute',
                      top: '30%',
                      left: '30%',
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 50, color: '#4CAF50' }} />
                  </motion.div>
                  
                  <motion.div
                    animate={{ 
                      y: [0, 20, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '25%',
                      right: '30%',
                    }}
                  >
                    <Star sx={{ fontSize: 40, color: '#FFD700' }} />
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Mission & Vision */}
      <Box sx={{ bgcolor: 'grey.50', py: 8, position: 'relative' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%', 
                  p: 4, 
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
                  color: 'white',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }
                }}>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Lightbulb sx={{ fontSize: 60, color: 'white', mb: 3 }} />
                    <Typography variant="h3" component="h3" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                      Our Mission
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                      To democratize caravan compliance checking by providing professional-grade tools 
                      that are accessible, accurate, and easy to use for everyone in the industry.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%', 
                  p: 4, 
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #FF9800 0%, #FFD700 100%)',
                  color: 'white',
                  boxShadow: '0 15px 30px rgba(0,0,0,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    bottom: -50,
                    left: -50,
                    width: 150,
                    height: 150,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }
                }}>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <EmojiEvents sx={{ fontSize: 60, color: 'white', mb: 3 }} />
                    <Typography variant="h3" component="h3" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                      Our Vision
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                      To become the global standard for caravan compliance checking, making roads safer 
                      and businesses more efficient through innovative technology and exceptional service.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Container maxWidth="lg" sx={{ py: 8, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Typography 
            variant="h2" 
            component="h2" 
            textAlign="center" 
            gutterBottom 
            sx={{ 
              fontWeight: 800, 
              mb: 6,
              position: 'relative',
              display: 'inline-block',
              left: '50%',
              transform: 'translateX(-50%)',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100px',
                height: '5px',
                background: 'linear-gradient(to right, #667eea, #764ba2)',
                borderRadius: '5px'
              }
            }}
          >
            Our Core Values
          </Typography>
        </motion.div>

        <Grid container spacing={4}>
          {values.map((value, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 4, 
                  borderRadius: '20px',
                  background: 'white',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      mb: 3,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `${value.color}20`
                    }}>
                      {value.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      {value.title}
                    </Typography>
                    <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ 
        bgcolor: 'grey.50', 
        py: 8, 
        position: 'relative',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e6e9f2 100%)'
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography 
              variant="h2" 
              component="h2" 
              textAlign="center" 
              gutterBottom 
              sx={{ 
                fontWeight: 800, 
                mb: 6,
                position: 'relative',
                display: 'inline-block',
                left: '50%',
                transform: 'translateX(-50%)',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '5px',
                  background: 'linear-gradient(to right, #667eea, #764ba2)',
                  borderRadius: '5px'
                }
              }}
            >
              By The Numbers
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card sx={{ 
                    textAlign: 'center', 
                    p: 4, 
                    borderRadius: '20px',
                    background: 'white',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    borderBottom: `5px solid ${stat.color}`,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ 
                        mb: 3, 
                        color: stat.color,
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `${stat.color}20`
                      }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 2, color: stat.color }}>
                        {stat.number}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

  

      {/* CTA Section */}
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        py: 8,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
              Join the WeighBuddy Family
            </Typography>
            <Typography variant="h5" textAlign="center" sx={{ mb: 6, opacity: 0.9, maxWidth: 700, mx: 'auto' }}>
              Experience the future of caravan compliance checking with our innovative platform.
            </Typography>
            
            <Grid container justifyContent="center" spacing={4}>
              <Grid item>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    onClick={() => navigate('/register')}
                    startIcon={<ArrowForward />}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { 
                        bgcolor: 'white', 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
                      }
                    }}
                  >
                    Get Started Free
                  </Button>
                </motion.div>
              </Grid>
              <Grid item>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large"
                    onClick={() => navigate('/contact')}
                    startIcon={<ConnectWithoutContact />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1.1rem',
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
                    Contact Sales
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
            
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Stack direction="row" justifyContent="center" spacing={1} alignItems="center">
                <LocationOn sx={{ color: '#FFD700' }} />
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  Proudly serving Australia from our headquarters in Melbourne
                </Typography>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>

     
          {/* Footer */}
            <Box sx={{ 
              py: 4, 
              bgcolor: '#1a1a2e', 
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #667eea, #764ba2)'
              }
            }}>
              <Container maxWidth="lg">
                <Grid container spacing={4} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DirectionsCar sx={{ mr: 1, fontSize: 32, color: '#FFD700' }} />
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>WeighBuddy</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.8, maxWidth: 400 }}>
                      Your trusted partner for caravan compliance and weighing solutions across Australia.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
                      <Button variant="outlined" size="small" onClick={() => navigate('/about')} sx={{ 
                        borderColor: 'rgba(255,255,255,0.3)', 
                        color: 'white', 
                        '&:hover': { 
                          borderColor: 'white', 
                          bgcolor: 'rgba(255,255,255,0.1)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}>
                        About
                      </Button>
                      <Button variant="outlined" size="small" onClick={() => navigate('/contact')} sx={{ 
                        borderColor: 'rgba(255,255,255,0.3)', 
                        color: 'white', 
                        '&:hover': { 
                          borderColor: 'white', 
                          bgcolor: 'rgba(255,255,255,0.1)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}>
                        Contact
                      </Button>
                      <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ 
                        bgcolor: '#FFD700', 
                        color: 'primary.dark', 
                        fontWeight: 700,
                        '&:hover': { 
                          bgcolor: '#FFC400', 
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(255, 212, 0, 0.3)'
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

      export default AboutUs;