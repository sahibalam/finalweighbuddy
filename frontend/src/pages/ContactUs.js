import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Paper,
  Avatar,
  Chip,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  AccessTime,
  Send,
  Support,
  Business,
  Person,
  CheckCircle,
  DirectionsCar,
  HeadsetMic,
  Schedule,
  ExpandMore,
  Chat,
  Map,
  SupportAgent,
  ArrowForward
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ContactUs = () => {
  const theme = useTheme();
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
  const [particles, setParticles] = useState([]);

  // Generate animated particles for hero section
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1
    }));
    setParticles(newParticles);
  }, []);

  const contactInfo = [
    {
      icon: <Email sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Email Us',
      details: ['support@weighbuddy.com', 'sales@weighbuddy.com'],
      description: 'Get in touch with our support team or sales representatives.',
      color: '#4CAF50'
    },
    {
      icon: <Phone sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: 'Call Us',
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Speak directly with our team during business hours.',
      color: '#2196F3'
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: 'Visit Us',
      details: ['Sydney, NSW 2000', 'Australia'],
      description: 'Drop by our office for a face-to-face meeting.',
      color: '#FF9800'
    }
  ];

  const supportHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM', timezone: 'AEST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM', timezone: 'AEST' },
    { day: 'Sunday', hours: 'Emergency Support Only', timezone: 'AEST' }
  ];

  const faqs = [
    {
      question: "How quickly can I get started with WeighBuddy?",
      answer: "You can start using WeighBuddy immediately after registration. Our platform is designed for instant access with no complex setup required."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide comprehensive support including live chat, email support, phone support during business hours, and emergency support for critical issues."
    },
    {
      question: "Can I integrate WeighBuddy with my existing systems?",
      answer: "Yes! We offer API access for professional users and can integrate with most existing fleet management and compliance systems."
    },
    {
      question: "Is my data secure with WeighBuddy?",
      answer: "Absolutely. We use bank-grade encryption, SOC 2 compliance, and follow industry best practices to ensure your data is always secure."
    },
    {
      question: "What industries do you specialize in?",
      answer: "We serve a wide range of industries including logistics, transportation, construction, mining, and any business that needs accurate weight management solutions."
    },
    {
      question: "Do you offer custom solutions?",
      answer: "Yes, we provide custom enterprise solutions tailored to your specific business needs and workflows."
    }
  ];

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
      
      {/* Animated Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              zIndex: 0
            }}
            animate={{
              y: ['0%', '100%'],
              x: ['0%', `${Math.random() * 30 - 15}%`],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: 3 + particle.speed * 5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Chip 
              label="Contact" 
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
              Connect with the <Box component="span" sx={{ color: '#FFD700' }}>WeighBuddy</Box> Team
            </Typography>
            <Typography
              variant="h5"
              sx={{
                maxWidth: 600,
                opacity: 0.9,
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                mb: 4
              }}
            >
              We're here to help! Reach out to our team for support, sales inquiries, or any questions about our innovative solutions.
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              mt: 4,
              pb: 6
            }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  href="#contact-form"
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
                  Send Us a Message
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outlined" 
                  size="large"
                  onClick={() => navigate('/about')}
                  startIcon={<SupportAgent />}
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
                  About Our Team
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

      {/* Contact Methods Section */}
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
            How Would You Like to Connect?
          </Typography>
        </motion.div>
        
        <Grid container spacing={4}>
          {contactInfo.map((info, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <Card sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 15px 40px ${info.color}40`,
                    transform: 'translateY(-5px)'
                  }
                }}>
                  <CardContent>
                    <Box sx={{
                      mb: 3,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: `${info.color}20`,
                      color: info.color
                    }}>
                      {info.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                      {info.title}
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      {info.details.map((detail, detailIndex) => (
                        <Typography key={detailIndex} variant="body1" sx={{ fontWeight: 500 }}>
                          {detail}
                        </Typography>
                      ))}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {info.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Contact Form & Info Section */}
      <Box id="contact-form" sx={{ bgcolor: 'grey.50', py: 8, position: 'relative' }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.grey[50]})`,
          zIndex: 0
        }} />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6}>
            {/* Contact Form */}
            <Grid item xs={12} lg={7}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <Paper sx={{
                  p: { xs: 3, md: 6 },
                  borderRadius: '20px',
                  boxShadow: '0 15px 50px rgba(0,0,0,0.1)',
                  background: 'white'
                }}>
                  <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
                    Send Us a Message
                  </Typography>
                  
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box sx={{
                        mb: 4,
                        p: 3,
                        bgcolor: 'success.light',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <CheckCircle sx={{ color: 'success.main', fontSize: 30 }} />
                        <Typography variant="body1" sx={{ color: 'success.dark', fontWeight: 600 }}>
                          Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          error={!!formErrors.name}
                          helperText={formErrors.name}
                          required
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          error={!!formErrors.email}
                          helperText={formErrors.email}
                          required
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company (Optional)"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subject"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          error={!!formErrors.subject}
                          helperText={formErrors.subject}
                          required
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          multiline
                          rows={6}
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          error={!!formErrors.message}
                          helperText={formErrors.message}
                          required
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '12px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={<Send />}
                            disabled={isSubmitting}
                            sx={{
                              px: 4,
                              py: 2,
                              fontSize: '1.1rem',
                              fontWeight: 600,
                              borderRadius: '12px',
                              boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }}
                          >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                          </Button>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
              </motion.div>
            </Grid>

            {/* Support Info */}
            <Grid item xs={12} lg={5}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Stack spacing={4}>
                  {/* Support Hours */}
                  <Card sx={{
                    p: 4,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Schedule sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                          Support Hours
                        </Typography>
                      </Box>
                      <Stack spacing={2} divider={<Divider sx={{ my: 1 }} />}>
                        {supportHours.map((schedule, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {schedule.day}
                            </Typography>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {schedule.hours}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {schedule.timezone}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Quick Support */}
                  <Card sx={{
                    p: 4,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <HeadsetMic sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Typography variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                          Quick Support Options
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body1">
                            <Box component="span" sx={{ fontWeight: 600 }}>Live Chat:</Box> Available 24/7
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body1">
                            <Box component="span" sx={{ fontWeight: 600 }}>Email Response:</Box> Within 2 hours
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body1">
                            <Box component="span" sx={{ fontWeight: 600 }}>Phone Support:</Box> During business hours
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
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
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
            Find quick answers to common questions about our products, services, and support.
          </Typography>
        </motion.div>

        <Box sx={{ mt: 4 }}>
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Accordion
                sx={{
                  mb: 2,
                  borderRadius: '12px !important',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: 'primary.main' }} />}
                  sx={{
                    bgcolor: 'background.paper',
                    py: 2,
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      gap: 2
                    }
                  }}
                >
                  <Chat sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: 'grey.50', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, pl: 6 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 8,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
              Ready to Transform Your Business?
            </Typography>
            <Typography variant="h5" sx={{ mb: 6, opacity: 0.9, maxWidth: 700, mx: 'auto' }}>
              Join thousands of professionals who trust WeighBuddy for their compliance and efficiency needs.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/contact')}
                  startIcon={<SupportAgent />}
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
                  Contact Sales
                </Button>
              </motion.div>
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
                
                export default ContactUs;