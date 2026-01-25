import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Star,
  Business,
  Diamond,
  AttachMoney,
  Schedule,
  TrendingUp,
  Support,
  Api,
  Groups, 
  Assessment,
  Security
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = loadStripe('pk_test_51RtkJxQIoLE8hev1341PsYzfvMA601wnHDV2mV2QT9iLIh7V6iZ1WSIsCmzL5CiqDNcmZL8KailgObH0ozdoQS6F009JIHecNx');

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription plans
      const plansResponse = await axios.get('/api/subscriptions/plans');
      setPlans(plansResponse.data.plans);
      
      // Fetch current subscription if user is professional
      if (user?.userType === 'professional') {
        const subscriptionResponse = await axios.get('/api/subscriptions/current');
        setCurrentSubscription(subscriptionResponse.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planType) => {
    setSelectedPlan(planType);
    setPaymentDialogOpen(true);
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('support')) return <Support />;
    if (feature.includes('API')) return <Api />;
    if (feature.includes('Multi-user')) return <Groups />;
    if (feature.includes('analytics') || feature.includes('Advanced')) return <Assessment />;
    if (feature.includes('Custom')) return <Security />;
    return <CheckCircle />;
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'basic': return <Business />;
      case 'premium': return <Star />;
      case 'enterprise': return <Diamond />;
      default: return <Business />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'basic': return 'primary';
      case 'premium': return 'secondary';
      case 'enterprise': return 'warning';
      default: return 'primary';
    }
  };

  const formatUsage = () => {
    if (!currentSubscription) return null;
    
    const { usage } = currentSubscription;
    const percentage = usage.weighLimit > 0 ? (usage.currentMonthWeighs / usage.weighLimit) * 100 : 0;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Monthly Usage
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ minWidth: 80 }}>
            {usage.currentMonthWeighs} / {usage.weighLimit > 0 ? usage.weighLimit : 'Unlimited'} weighs
          </Typography>
        </Box>
        {usage.weighLimit > 0 && (
          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentage, 100)} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        )}
      </Box>
    );
  };

  if (user?.userType !== 'professional') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Subscription management is only available for professional users.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading subscription information...
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscription Management
      </Typography>
      
      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Current Subscription
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getPlanIcon(currentSubscription.type)}
                  <Typography variant="h5" sx={{ ml: 1, mr: 2 }}>
                    {currentSubscription.plan?.name}
                  </Typography>
                  <Chip 
                    label={currentSubscription.status}
                    color={currentSubscription.status === 'active' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Valid until: {new Date(currentSubscription.endDate).toLocaleDateString()}
                </Typography>
                {formatUsage()}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    ${currentSubscription.plan?.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per month
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        {currentSubscription ? 'Upgrade or Change Plan' : 'Choose Your Plan'}
      </Typography>
      
      <Grid container spacing={3}>
        {Object.entries(plans).map(([planType, plan]) => {
          const isCurrentPlan = currentSubscription?.type === planType;
          const planColor = getPlanColor(planType);
          
          return (
            <Grid item xs={12} md={4} key={planType}>
              <Card 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  border: isCurrentPlan ? 2 : 1,
                  borderColor: isCurrentPlan ? `${planColor}.main` : 'divider'
                }}
              >
                {planType === 'premium' && (
                  <Chip
                    label="Most Popular"
                    color="secondary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1
                    }}
                  />
                )}
                
                <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    {getPlanIcon(planType)}
                  </Box>
                  
                  <Typography variant="h5" component="h3" gutterBottom>
                    {plan.name}
                  </Typography>
                  
                  <Typography variant="h3" color="primary" gutterBottom>
                    ${plan.price}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    per month
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {plan.weighLimit > 0 ? `${plan.weighLimit} weighs/month` : 'Unlimited weighs'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getFeatureIcon(feature)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={isCurrentPlan ? "outlined" : "contained"}
                    color={planColor}
                    disabled={isCurrentPlan}
                    onClick={() => handlePlanSelect(planType)}
                  >
                    {isCurrentPlan ? 'Current Plan' : 
                     currentSubscription ? 'Switch to This Plan' : 'Select Plan'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Payment Dialog */}
      <Elements stripe={stripePromise}>
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          selectedPlan={selectedPlan}
          plans={plans}
          onSuccess={fetchPlansAndSubscription}
        />
      </Elements>
    </Container>
  );
};

// Payment Dialog Component
const PaymentDialog = ({ open, onClose, selectedPlan, plans, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    setError('');
    
    try {
      // Create payment intent
      const response = await axios.post('/api/subscriptions/create', {
        planType: selectedPlan
      });
      
      const { clientSecret } = response.data;
      
      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });
      
      if (result.error) {
        setError(result.error.message);
      } else {
        // Confirm subscription activation
        await axios.post('/api/subscriptions/confirm', {
          paymentIntentId: result.paymentIntent.id,
          planType: selectedPlan
        });
        
        onSuccess();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const plan = plans[selectedPlan];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Subscribe to {plan?.name}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">
            ${plan?.price}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            per month
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Information
            </Typography>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </Box>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!stripe || processing}
        >
          {processing ? <CircularProgress size={24} /> : `Subscribe for $${plan?.price}/month`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionManagement;
