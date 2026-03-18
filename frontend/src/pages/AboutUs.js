import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AboutUs = () => {
  const navigate = useNavigate();

  const primary = '#2DC5A1';
  const heroBg = 'linear-gradient(180deg, rgba(139, 224, 195, 0.55) 0%, rgba(45, 197, 161, 0.30) 100%)';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Navbar />

      <Box sx={{ background: heroBg, py: 6 }}>
        <Container maxWidth="lg">
          <Typography align="center" sx={{ fontSize: 38, fontWeight: 800, color: '#111827' }}>
            About
          </Typography>
        </Container>
      </Box>

      <Box sx={{ bgcolor: '#ffffff' }}>
        <Container maxWidth="lg" sx={{ py: 5 }}>
          <Box sx={{ borderTop: '1px solid rgba(17, 24, 39, 0.10)', pt: 3 }}>
            <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>
              About Us
            </Typography>

            <Typography sx={{ mt: 2, color: '#111827', fontWeight: 700, fontSize: 14 }}>
              Founded by Ross McLennan and Damian Cox — family, innovators, and travellers at heart.
            </Typography>

            <Typography sx={{ mt: 2, color: '#6B7280', fontSize: 14, lineHeight: 1.85 }}>
              Ross and Damian are brothers-in-law who share a deep passion for travel, adventure, and exploring Australia with their families. Having both towed caravans across the country, they understand the importance of ensuring every setup meets compliance requirements — without unnecessary complexity or cost.
            </Typography>
            <Typography sx={{ mt: 2, color: '#6B7280', fontSize: 14, lineHeight: 1.85 }}>
              Ross operates a professional vehicle weighing business in Townsville, North Queensland, where he’s helped hundreds of families and businesses understand their vehicle weights and compliance obligations. Damian brings over 25 years of experience in the IT industry, specialising in building practical, user-focused digital solutions.
            </Typography>
            <Typography sx={{ mt: 2, color: '#6B7280', fontSize: 14, lineHeight: 1.85 }}>
              Together, they created <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>WeighBuddy</Box> — a platform designed to simplify the weighing process, streamline record-keeping, and make compliance management easier and more accessible for everyone — from individual travellers to professional operators and fleet managers.
            </Typography>
            <Typography sx={{ mt: 2, color: '#6B7280', fontSize: 14, lineHeight: 1.85 }}>
              Whether it’s your family’s next adventure or your organisation’s day-to-day operations, <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>WeighBuddy</Box> provides confidence and clarity around vehicle compliance.
            </Typography>
          </Box>
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

export default AboutUs;