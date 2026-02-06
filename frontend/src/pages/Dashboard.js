import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Stack,
  Divider,
  CircularProgress
} from '@mui/material';
import ProfessionalDashboard from './ProfessionalDashboard';
import {
  Add,
  History,
  TrendingUp,
  CheckCircle,
  DirectionsCar,
  LocalShipping,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Fetch all weighs for compliance calculation (same as Weigh History)
  const { data: weighsData, isLoading: weighsLoading } = useQuery(
    'userWeighs', 
    async () => {
      const response = await axios.get('/api/weighs');
      return response.data;
    },
    {
      enabled: !!user && user.userType !== 'professional',
    }
  );

  // Calculate compliance dynamically using the same logic as Weigh History
  const calculateCompliance = (weigh) => {
    if (!weigh || !weigh.vehicleData || !weigh.caravanData) return false;
    
    // Calculate compliance dynamically based on actual data and limits
    const gvmOk = (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0);
    const tbmOk = (weigh.towBallWeight || 0) <= (weigh.vehicleData?.tbm || (weigh.caravanData?.atm * 0.1) || 0);
    const atmOk = (weigh.caravanWeight || 0) <= (weigh.caravanData?.atm || 0);
    const gcmOk = ((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) <= (weigh.vehicleData?.gcm || 0);
    
    // GTM check: Calculate based on actual GTM limit if available
    const calculatedGTM = (weigh.caravanWeight || 0) - (weigh.towBallWeight || 0);
    const gtmOk = weigh.caravanData?.gtm > 0 ? 
      calculatedGTM <= (weigh.caravanData?.gtm || 0) : true;
    
    return gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
  };

  // Calculate compliance statistics from weighs data (same as Weigh History)
  const totalWeighs = weighsData?.weighs?.length || 0;
  const compliantWeighs = weighsData?.weighs?.filter(weigh => calculateCompliance(weigh)).length || 0;
  const totalRevenue = weighsData?.weighs?.reduce((sum, weigh) => sum + (weigh.payment?.amount || 0), 0) || 0;

  // Redirect admins to admin overview and DIY users to new-weigh
  useEffect(() => {
    if (user?.userType === 'admin') {
      navigate('/admin/overview');
    } else if (user?.userType === 'fleet') {
      navigate('/fleet');
    } else if (user?.userType === 'diy') {
      navigate('/new-weigh');
    }
  }, [user?.userType, navigate]);

  // Sync user's weigh count with actual weighs data
  useEffect(() => {
    if (user && weighsData && totalWeighs > 0) {
      // Only sync if there's a discrepancy
      if (user.weighCount !== totalWeighs) {
        axios.post('/api/auth/sync-weigh-count')
          .then(response => {
            console.log('Weigh count synchronized:', response.data);
          })
          .catch(error => {
            console.error('Failed to sync weigh count:', error);
          });
      }
    }
  }, [user, weighsData, totalWeighs]);

  // Loading state while auth/user is being resolved
  if (authLoading || !user || weighsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect professional users to their dashboard
  if (user.userType === 'professional') {
    return <ProfessionalDashboard />;
  }

  if (user?.userType === 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: color, mr: 2 }}>
              {icon}
            </Avatar>
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ mb: 1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon, action, color }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-4px)',
            transition: 'all 0.3s ease-in-out'
          }
        }}
        onClick={action}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          <Avatar sx={{ bgcolor: color, mx: 'auto', mb: 2, width: 56, height: 56 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your caravan compliance and weight measurements.
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Weighs"
            value={totalWeighs}
            icon={<Assessment />}
            color="primary.main"
            subtitle="All time weighs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Compliant Weighs"
            value={compliantWeighs}
            icon={<CheckCircle />}
            color="success.main"
            subtitle="Safe and compliant"
          />
        </Grid>
        {user?.userType !== 'diy' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Free Weighs"
              value={Math.floor(totalWeighs / 10)}
              icon={<TrendingUp />}
              color="warning.main"
              subtitle="Available rewards"
            />
          </Grid>
        )}
        {user?.userType !== 'diy' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={`$${totalRevenue.toLocaleString()}`}
              icon={<TrendingUp />}
              color="info.main"
              subtitle="All time earnings"
            />
          </Grid>
        )}
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="New Weigh"
            description="Create a new weigh entry and compliance check"
            icon={<Add />}
            color="primary.main"
            action={() => navigate('/new-weigh')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Weigh History"
            description="View and manage your previous weigh entries"
            icon={<History />}
            color="secondary.main"
            action={() => navigate('/weigh-history')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Payment History"
            description="View your payments and receipts"
            icon={<TrendingUp />}
            color="success.main"
            action={() => navigate('/payment-history')}
          />
        </Grid>
        {/* <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Vehicle Search"
            description="Search and find vehicle specifications"
            icon={<DirectionsCar />}
            color="info.main"
            action={() => navigate('/vehicle-search')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Caravan Search"
            description="Search and find caravan specifications"
            icon={<LocalShipping />}
            color="success.main"
            action={() => navigate('/caravan-search')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <QuickActionCard
            title="Profile Settings"
            description="Update your account information and preferences"
            icon={<Assessment />}
            color="warning.main"
            action={() => navigate('/profile')}
          />
        </Grid> */}
        {user?.userType === 'admin' && (
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="Admin Dashboard"
              description="Manage system and user administration"
              icon={<Assessment />}
              color="error.main"
              action={() => navigate('/admin')}
            />
          </Grid>
        )}
      </Grid>

      {/* User Info Card (hidden for DIY users) */}
      {user?.userType !== 'diy' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      User Type
                    </Typography>
                    <Chip 
                      label="DIY Customer" 
                      color="secondary"
                      size="small"
                    />
                  </Box>
                  {user?.businessName && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Business Name
                      </Typography>
                      <Typography variant="body1">
                        {user.businessName}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user?.email}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Weigh Count
                    </Typography>
                    <Typography variant="h6">
                      {totalWeighs} weighs
                    </Typography>
                  </Box>
                  {user?.userType !== 'diy' && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Free Weighs Available
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {Math.floor(totalWeighs / 10)} free weighs
                      </Typography>
                    </Box>
                  )}
                  {user?.userType !== 'diy' && user?.subscription && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Subscription Status
                      </Typography>
                      <Chip 
                        label={user.subscription.status} 
                        color={user.subscription.status === 'active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
      )}

      {/* Recent Activity or Tips */}
      {user?.userType !== 'diy' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips & Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    • Every 10 weighs = 1 free weigh (reward system)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    • Ensure all weight measurements are accurate for compliance
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    • Download PDF reports for record keeping
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="warning.main">
                    • DIY users are limited to 3 weighs per day
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  );
};

export default Dashboard;