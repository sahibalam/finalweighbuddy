import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Lock as SecurityIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import axios from 'axios';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#424770',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#9e2146'
    }
  },
  hidePostalCode: true
};

const CheckoutForm = ({ 
  amount, 
  currency = 'aud', 
  reportData, 
  onSuccess, 
  onError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post('/api/payments/create-payment-intent', {
        amount,
        currency,
        reportData
      });

      if (response.data.success) {
        setClientSecret(response.data.clientSecret);
      } else {
        setError('Failed to initialize payment');
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const card = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: card,
            billing_details: {
              name: reportData.customerData?.name || 'DIY User',
              email: reportData.customerData?.email,
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError && onError(stripeError);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        try {
          const confirmResponse = await axios.post('/api/payments/confirm-payment', {
            paymentIntentId: paymentIntent.id,
            reportData
          });

          if (confirmResponse.data.success) {
            onSuccess && onSuccess({
              transactionId: paymentIntent.id,
              reportId: confirmResponse.data.reportId
            });
          } else {
            setError('Payment succeeded but report save failed');
          }
        } catch (backendError) {
          console.error('Backend confirmation error:', backendError);
          setError('Payment succeeded but report save failed');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PaymentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Secure Payment
          </Typography>
          <Typography variant="h6" color="primary">
            ${amount} {currency.toUpperCase()}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              Card Details
            </Typography>
            <Box 
              sx={{ 
                p: 2, 
                border: '1px solid #ddd', 
                borderRadius: 1,
                '&:focus-within': {
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </Box>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={!stripe || isLoading || !clientSecret}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <PaymentIcon />
              )
            }
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Processing...' : `Pay $${amount} ${currency.toUpperCase()}`}
          </Button>

          <Alert severity="info" sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              <Typography variant="body2">
                Your payment is secured by Stripe. We never store your card details.
              </Typography>
            </Box>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};

const StripePaymentForm = (props) => {
  const stripePromise = loadStripe(
    'pk_test_51RtkJxQIoLE8hev1341PsYzfvMA601wnHDV2mV2QT9iLIh7V6iZ1WSIsCmzL5CiqDNcmZL8KailgObH0ozdoQS6F009JIHecNx'
  );

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
