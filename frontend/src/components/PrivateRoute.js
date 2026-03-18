import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children, adminOnly = false, superadminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (superadminOnly && user?.userType !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  if (adminOnly && user?.userType !== 'admin' && user?.userType !== 'superadmin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute; 