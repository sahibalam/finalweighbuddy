const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Subscription pricing tiers
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 49.99, // Monthly price in AUD
    features: [
      'Up to 50 weighs per month',
      'Basic compliance reports',
      'Email support',
      'Standard dashboard'
    ],
    weighLimit: 50
  },
  premium: {
    name: 'Premium Plan',
    price: 99.99,
    features: [
      'Up to 200 weighs per month',
      'Advanced compliance reports',
      'Priority email support',
      'Advanced analytics dashboard',
      'Export to Excel/PDF',
      'Custom branding'
    ],
    weighLimit: 200
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 199.99,
    features: [
      'Unlimited weighs',
      'Premium compliance reports',
      'Phone & email support',
      'Advanced analytics & insights',
      'API access',
      'Multi-user accounts',
      'Custom integrations',
      'Dedicated account manager'
    ],
    weighLimit: -1 // Unlimited
  }
};

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
});

// @desc    Get current subscription
// @route   GET /api/subscriptions/current
// @access  Private (Professional users only)
router.get('/current', protect, authorize('professional'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      subscription: {
        type: user.subscription.type,
        status: user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        plan: SUBSCRIPTION_PLANS[user.subscription.type],
        usage: {
          currentMonthWeighs: await getCurrentMonthWeighs(user._id),
          weighLimit: SUBSCRIPTION_PLANS[user.subscription.type].weighLimit
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create subscription
// @route   POST /api/subscriptions/create
// @access  Private (Professional users only)
router.post('/create', protect, authorize('professional'), async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    const plan = SUBSCRIPTION_PLANS[planType];
    
    // Create Stripe subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // Convert to cents
      currency: 'aud',
      metadata: {
        userId: req.user.id,
        planType: planType,
        subscriptionType: 'monthly'
      }
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      plan: plan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Subscription creation failed'
    });
  }
});

// @desc    Confirm subscription payment
// @route   POST /api/subscriptions/confirm
// @access  Private (Professional users only)
router.post('/confirm', protect, authorize('professional'), async (req, res) => {
  try {
    const { paymentIntentId, planType } = req.body;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }
    
    // Update user subscription
    const user = await User.findById(req.user.id);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    
    user.subscription = {
      type: planType,
      status: 'active',
      startDate: startDate,
      endDate: endDate
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Subscription confirmation failed'
    });
  }
});

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private (Professional users only)
router.post('/cancel', protect, authorize('professional'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.subscription.status = 'cancelled';
    await user.save();
    
    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Subscription cancellation failed'
    });
  }
});

// @desc    Upgrade/Downgrade subscription
// @route   PUT /api/subscriptions/change
// @access  Private (Professional users only)
router.put('/change', protect, authorize('professional'), async (req, res) => {
  try {
    const { newPlanType } = req.body;
    
    if (!SUBSCRIPTION_PLANS[newPlanType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    const user = await User.findById(req.user.id);
    const newPlan = SUBSCRIPTION_PLANS[newPlanType];
    
    // Create payment intent for plan change
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(newPlan.price * 100),
      currency: 'aud',
      metadata: {
        userId: req.user.id,
        planType: newPlanType,
        subscriptionType: 'plan_change'
      }
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      newPlan: newPlan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Plan change failed'
    });
  }
});

// Helper function to get current month weigh count
async function getCurrentMonthWeighs(userId) {
  const Weigh = require('../models/Weigh');
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  return await Weigh.countDocuments({
    user: userId,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });
}

module.exports = router;



