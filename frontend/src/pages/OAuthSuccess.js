import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const OAuthSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loadUser } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const token = params.get('token');
    console.log('[OAuthSuccess] mounted', {
      href: window.location.href,
      hasToken: Boolean(token),
      tokenPrefix: token ? token.slice(0, 12) : null,
    });
    if (!token) {
      console.log('[OAuthSuccess] missing token -> /login');
      navigate('/login');
      return;
    }

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('[OAuthSuccess] token stored + axios auth header set');

    Promise.resolve()
      .then(() => loadUser())
      .then(() => {
        console.log('[OAuthSuccess] loadUser done, calling /api/auth/me');
        return axios.get('/api/auth/me');
      })
      .then((res) => {
        const userType = res?.data?.user?.userType;
        console.log('[OAuthSuccess] /api/auth/me ok', {
          userType,
          userId: res?.data?.user?.id,
          email: res?.data?.user?.email,
        });

        // Remove token from URL to avoid accidental re-processing on rerenders.
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          // ignore
        }

        if (userType === 'professional') {
          console.log('[OAuthSuccess] navigate -> /professional-clients');
          navigate('/professional-clients', { replace: true });
        } else if (userType === 'fleet') {
          console.log('[OAuthSuccess] navigate -> /fleet');
          navigate('/fleet', { replace: true });
        } else {
          console.log('[OAuthSuccess] navigate -> /dashboard');
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((err) => {
        console.log('[OAuthSuccess] error, fallback -> /dashboard', {
          message: err?.response?.data?.message || err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
        });
        navigate('/dashboard', { replace: true });
      });
  }, [loadUser, navigate, params]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Signing you in…
      </Typography>
    </Box>
  );
};

export default OAuthSuccess;
