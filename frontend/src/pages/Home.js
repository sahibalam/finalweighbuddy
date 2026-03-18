import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider
} from '@mui/material';
import {
  Remove,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const heroVideoSrc = '/images/caravanvid.mp4';

  const primary = '#2DC5A1';
  const primaryLight = '#8BE0C3';
  const heroBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.55) 0%, rgba(45, 197, 161, 0.30) 100%)';
  const featureBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.45) 0%, rgba(45, 197, 161, 0.18) 100%)';
  const dottedBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.20) 0%, rgba(45, 197, 161, 0.08) 100%)';
  const surfaceShadow = '0 16px 40px rgba(14, 30, 50, 0.10)';
  const surfaceBorder = '1px solid rgba(17, 24, 39, 0.08)';
  const hoverShadow = '0 20px 50px rgba(14, 30, 50, 0.14)';

  const accountCards = [
    {
      title: 'Professional Weighing Company',
      description:
        'WeighBuddy gives professional weighers a simple platform to record client weights, manage data, and grow their business.',
      cta: 'Create Professional Account',
      imgSrc: 'https://weighbuddy.webintouch.net/wp-content/uploads/2025/12/businessman.png',
      onClick: () => navigate('/signup'),
    },
    {
      title: 'DIY',
      description:
        'WeighBuddy helps DIY users easily check vehicle and trailer compliance without confusion or complicated calculations.',
      cta: 'Create a DIY Account',
      imgSrc: 'https://weighbuddy.webintouch.net/wp-content/uploads/2025/12/tools.png',
      onClick: () => navigate('/signup'),
    },
    {
      title: 'Fleet Mangers',
      description:
        'WeighBuddy provides fleet managers with a full compliance overview, instant weight comparisons, and clear history tracking.',
      cta: 'Create a Fleet Account',
      imgSrc: 'https://weighbuddy.webintouch.net/wp-content/uploads/2025/12/professionalism.png',
      onClick: () => navigate('/signup'),
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Navbar />

      {/* 1.png / 4.png: Hero */}
      <Box
        sx={{
          background: heroBg,
          py: { xs: 6, md: 10 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: { xs: 56, md: 84 }, fontWeight: 900, lineHeight: 0.98, color: '#111827' }}>
                Smart.
                <br />
                Simple.
                <br />
                Compliant.
              </Typography>

              <Typography sx={{ mt: 3, fontSize: { xs: 22, md: 34 }, fontWeight: 700, lineHeight: 1.1, color: '#111827' }}>
                Your complete vehicle weighing
                <br />
                solution — built for by
                <br />
                professionals for professionals,
                <br />
                fleet owners, and DIY users.
              </Typography>

              <Box sx={{ mt: 4 }}>
                <Grid container spacing={2} sx={{ maxWidth: 520 }}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/register')}
                      sx={{
                        bgcolor: primary,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 44,
                        fontSize: 13,
                        lineHeight: 1.2,
                        '&:hover': { bgcolor: primary },
                      }}
                    >
                      signup
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/weighbridges')}
                      sx={{
                        bgcolor: primary,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 44,
                        fontSize: 13,
                        lineHeight: 1.2,
                        '&:hover': { bgcolor: primary },
                      }}
                    >
                      Find a Weighbridge
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/login')}
                      sx={{
                        bgcolor: primary,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 44,
                        fontSize: 13,
                        lineHeight: 1.2,
                        '&:hover': { bgcolor: primary },
                      }}
                    >
                      Login
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate('/find-a-professional-weighing-company')}
                      sx={{
                        bgcolor: primary,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        minHeight: 44,
                        fontSize: 13,
                        lineHeight: 1.2,
                        px: 1.5,
                        '& .MuiButton-startIcon': { margin: 0 },
                        '&:hover': { bgcolor: primary },
                      }}
                    >
                      Find a Professinal Weighing Company
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(17, 24, 39, 0.35)',
                  bgcolor: '#ffffff',
                  boxShadow: surfaceShadow,
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: hoverShadow },
                }}
              >
                <video src={heroVideoSrc} controls style={{ width: '100%', height: '100%', display: 'block' }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3.png: Why Weighbuddy */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Typography align="center" sx={{ fontSize: { xs: 36, md: 44 }, fontWeight: 900, color: '#111827' }}>
            Why Weighbuddy ?
          </Typography>

          <Grid container spacing={2.5} sx={{ mt: 3 }}>
            {[
              'WeighBuddy simplifies complex vehicle and trailer compliance by comparing real weights to official limits instantly.',
              'Track weigh history, monitor fleet compliance, and keep every setup safe, accurate, and fully transparent.',
              'Low-cost tools help individuals, fleets, and professional weighers stay compliant and grow through WeighBuddy’s platform.',
            ].map((text, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box
                  sx={{
                    border: `2px dotted ${primary}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    minHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: dottedBg,
                    boxShadow: surfaceShadow,
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 20px 50px rgba(14, 30, 50, 0.14)' },
                  }}
                >
                  <Typography sx={{ color: '#111827', fontWeight: 500, fontSize: 16, lineHeight: 1.6 }}>{text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 1.png: Account cards */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#F3F4F6' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {accountCards.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: surfaceShadow,
                    border: surfaceBorder,
                    height: '100%',
                    transition: 'transform 180ms ease, box-shadow 180ms ease',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: hoverShadow },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>{card.title}</Typography>
                    <Divider sx={{ width: 80, mx: 'auto', my: 2 }} />
                    <Box
                      component="img"
                      src={card.imgSrc}
                      alt={card.title}
                      sx={{
                        width: 48,
                        height: 48,
                        objectFit: 'contain',
                        display: 'block',
                        mx: 'auto',
                        my: 2,
                      }}
                    />
                    <Typography sx={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, minHeight: 84 }}>
                      {card.description}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        onClick={card.onClick}
                        sx={{ bgcolor: primary, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3, '&:hover': { bgcolor: primary } }}
                      >
                        {card.cta}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 2.png: FAQ */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              borderRadius: 3,
              boxShadow: surfaceShadow,
              p: { xs: 3, md: 4 },
              border: `2px dotted ${primary}`,
              background: dottedBg,
            }}
          >
            <Typography align="center" sx={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
              Frequently Asked Questions
            </Typography>

            <Box sx={{ mt: 3 }}>
              {[
                {
                  q: '1. How do I weigh my setup?',
                  a: 'WeighBuddy provides a step-by-step process for weighing your vehicle and trailer—whether you’re using individual scales, an in-ground weighbridge, a GoWeigh weighbridge, or an above-ground weighbridge. WeighBuddy guides you through each method so you get accurate and consistent results.',
                },
                {
                  q: '2. Why is this different from just using a GoWeigh weighbridge?',
                  a: 'GoWeigh weighbridges are excellent tools, but they only give you part of the picture.\nWeighBuddy automatically pulls the compliance data for your car and trailer and generates a clear, easy-to-understand report that shows how your real weights compare to your legal limits.',
                },
                {
                  q: '3. How accurate are weighbridges?',
                  a: 'Most public weighbridges are accurate to within 20–30 kg. If your weights are close to your limits, WeighBuddy can recommend professional weighers in your area who measure to within 1 kg for greater precision.',
                },
                {
                  q: '4. Should I still use a professional weighing service?',
                  a: 'Yes. Professional weighers with good reviews and proven experience offer far more than a basic weight report. They can provide setup advice, safety guidance, and personalised recommendations.\nWeighBuddy supports the professional weighing network and industry groups like the MWAA that promote best practice. View the directory here',
                },
              ].map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <Box key={item.q} sx={{ mt: idx === 0 ? 0 : 2 }}>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setOpenFaqIndex(isOpen ? -1 : idx);
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: '#111827',
                        cursor: 'pointer',
                        userSelect: 'none',
                        p: 1.6,
                        borderRadius: 2,
                        background: '#ffffff',
                        border: '1px solid rgba(17, 24, 39, 0.08)',
                        boxShadow: '0 8px 18px rgba(14, 30, 50, 0.06)',
                        transition: 'transform 160ms ease, box-shadow 160ms ease',
                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 12px 26px rgba(14, 30, 50, 0.10)' },
                      }}
                    >
                      {isOpen ? <Remove sx={{ fontSize: 18 }} /> : <Add sx={{ fontSize: 18 }} />}
                      <Typography sx={{ fontWeight: 600 }}>{item.q}</Typography>
                    </Box>

                    {isOpen ? (
                      <Box
                        sx={{
                          border: '1px solid rgba(17, 24, 39, 0.10)',
                          mt: 1.5,
                          p: 2,
                          color: '#6B7280',
                          fontSize: 14,
                          lineHeight: 1.7,
                          whiteSpace: 'pre-line',
                          background: 'rgba(255,255,255,0.85)',
                          borderRadius: 2,
                        }}
                      >
                        {item.a}
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/faqs')}
                sx={{ bgcolor: primary, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4, '&:hover': { bgcolor: primary } }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2.png bottom: footer */}
      <Box sx={{ bgcolor: '#E5E7EB', py: 2.5 }}>
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

export default Home;




