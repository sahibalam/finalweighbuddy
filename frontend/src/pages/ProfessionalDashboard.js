import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Business,
  Schedule,
  Warning,
  CheckCircle,
  AttachMoney,
  People,
  Scale,
  CalendarToday
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfessionalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription info
      const subscriptionResponse = await axios.get('/api/subscriptions/current');
      setSubscription(subscriptionResponse.data.subscription);
      
      // Fetch weigh history for analytics
      const weighsResponse = await axios.get('/api/weighs');
      const weighs = weighsResponse.data.weighs || [];
      
      // Process data for analytics
      const processedData = processWeighData(weighs);
      setDashboardData(processedData);

      setPaymentsLoading(true);
      try {
        const params = new URLSearchParams({ page: 1, limit: 5 });
        const paymentsResponse = await axios.get(`/api/payments/history?${params}`);
        setPayments(Array.isArray(paymentsResponse.data?.payments) ? paymentsResponse.data.payments : []);
      } finally {
        setPaymentsLoading(false);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate compliance dynamically using the same logic as Weigh History
  const calculateCompliance = (weigh) => {
    if (!weigh || !weigh.vehicleData || !weigh.caravanData) return false;
    
    // Calculate compliance dynamically based on actual data and limits
    const gvmOk = (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0);
    const tbmOk = (weigh.towBallWeight || 0) <= (weigh.vehicleData?.tbm || (weigh.caravanData?.atm * 0.1) || 0);
    const atmOk = ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)) <= (weigh.caravanData?.atm || 0);
    const gcmOk = ((weigh.vehicleWeightUnhitched || 0) + ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0))) <= (weigh.vehicleData?.gcm || 0);
    
    // GTM check: GTM = Caravan weight on wheels
    const gtmOk = weigh.caravanData?.gtm > 0 ? 
      (weigh.caravanWeight || 0) <= (weigh.caravanData?.gtm || 0) : true;
    
    return gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
  };

  const processWeighData = (weighs) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Filter recent weighs
    const recentWeighs = weighs.filter(weigh => new Date(weigh.createdAt) >= thirtyDaysAgo);
    const weeklyWeighs = weighs.filter(weigh => new Date(weigh.createdAt) >= sevenDaysAgo);

    // Compliance statistics
    const compliantWeighs = weighs.filter(weigh => calculateCompliance(weigh)).length;
    const nonCompliantWeighs = weighs.length - compliantWeighs;
    
    // Monthly trend data
    const monthlyData = generateMonthlyTrend(weighs);
    
    // Compliance breakdown
    const complianceData = [
      { name: 'Compliant', value: compliantWeighs, color: '#4caf50' },
      { name: 'Non-Compliant', value: nonCompliantWeighs, color: '#f44336' }
    ];
    
    // Recent activity
    const recentActivity = weighs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(weigh => ({
        id: weigh._id,
        customer:
          weigh?.customer?.name ||
          weigh?.customerName ||
          weigh?.customer?.email ||
          weigh?.customerEmail ||
          'Customer',
        date: new Date(weigh.createdAt).toLocaleDateString(),
        compliant: calculateCompliance(weigh),
        vehicle:
          weigh.vehicleNumberPlate ||
          weigh.vehicleRego ||
          weigh?.vehicleData?.numberPlate ||
          weigh?.weights?.vehicleNumberPlate ||
          weigh?.weights?.raw?.vehicleNumberPlate ||
          '',
        caravan:
          weigh.caravanNumberPlate ||
          weigh.trailerRego ||
          weigh.boatRego ||
          weigh?.caravanData?.numberPlate ||
          weigh?.weights?.caravanNumberPlate ||
          weigh?.weights?.raw?.caravanNumberPlate ||
          ''
      }));
    
    return {
      totalWeighs: weighs.length,
      monthlyWeighs: recentWeighs.length,
      weeklyWeighs: weeklyWeighs.length,
      complianceRate: weighs.length > 0 ? ((compliantWeighs / weighs.length) * 100).toFixed(1) : 0,
      monthlyTrend: monthlyData,
      complianceBreakdown: complianceData,
      recentActivity
    };
  };

  const generateMonthlyTrend = (weighs) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthWeighs = weighs.filter(weigh => {
        const weighDate = new Date(weigh.createdAt);
        return weighDate >= monthStart && weighDate <= monthEnd;
      });
      
      months.push({
        month: date.toLocaleDateString('default', { month: 'short' }),
        weighs: monthWeighs.length,
        compliant: monthWeighs.filter(w => calculateCompliance(w)).length
      });
    }
    
    return months;
  };

  const getUsageColor = () => {
    if (!subscription?.usage) return 'primary';
    const percentage = (subscription.usage.currentMonthWeighs / subscription.usage.weighLimit) * 100;
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const downloadAdvancedReport = async (format) => {
    try {
      const response = await axios.get(`/api/reports/export/${format}?period=30`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `advanced-report-30days.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report');
    }
  };

  if (user?.userType !== 'professional') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Professional dashboard is only available for professional users.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Professional Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.businessName || user?.name}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Payment History Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1 }} />
                  <Typography variant="h6">Payment History</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/payment-history')}>
                  View all
                </Button>
              </Box>

              {paymentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={22} />
                </Box>
              ) : payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No payments found.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell align="right">{(p?.payment?.amount || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Total Weighs */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Scale sx={{ mr: 1 }} />
                <Typography variant="h6">Total Weighs</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {dashboardData?.totalWeighs || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time weighs completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Rate */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1 }} />
                <Typography variant="h6">Compliance Rate</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {dashboardData?.complianceRate || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vehicles meeting compliance standards
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                6-Month Trend
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={dashboardData?.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weighs" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      name="Total Weighs"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="compliant" 
                      stroke="#4caf50" 
                      strokeWidth={2}
                      name="Compliant Weighs"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Overview
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={dashboardData?.complianceBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {(dashboardData?.complianceBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Weigh Activity
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Caravan/Trailer/Boat</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dashboardData?.recentActivity || []).map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.customer}</TableCell>
                        <TableCell>{activity.date}</TableCell>
                        <TableCell>{activity.vehicle}</TableCell>
                        <TableCell>{activity.caravan}</TableCell>
                        <TableCell>
                          <Chip
                            label={activity.compliant ? 'Compliant' : 'Non-Compliant'}
                            color={activity.compliant ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
};

export default ProfessionalDashboard;
