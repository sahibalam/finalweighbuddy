import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_51RtkJxQIoLE8hev1341PsYzfvMA601wnHDV2mV2QT9iLIh7V6iZ1WSIsCmzL5CiqDNcmZL8KailgObH0ozdoQS6F009JIHecNx');

const StripeContext = createContext();

export const StripeProvider = ({ children }) => {
  return (
    <StripeContext.Provider value={{ stripePromise }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};