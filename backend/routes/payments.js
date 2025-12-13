const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth');

// Create payment intent for DIY report
router.post('/create-payment-intent', protect, async (req, res) => {
  console.log('create-payment-intent route hit');
  try {
    const { amount, currency = 'aud', reportData } = req.body;
    
    // Validate required data
    if (!amount || !reportData) {
      return res.status(400).json({
        success: false,
        message: 'Amount and report data are required'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.id,
        customerName: reportData.customerData?.name || 'DIY User',
        vehicleMake: reportData.vehicleData?.make || 'Unknown',
        vehicleModel: reportData.vehicleData?.model || 'Unknown',
        reportType: 'DIY Compliance Report'
      },
      description: `DIY Vehicle Compliance Report - ${reportData.vehicleData?.make} ${reportData.vehicleData?.model}`,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Confirm payment and save report  
router.post('/confirm-payment', protect, async (req, res) => {
  console.log('confirm-payment route hit');
  try {
    const { paymentIntentId, reportData } = req.body;

    if (!paymentIntentId || !reportData) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and report data are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Save the report to database (you'll need to create this model)
    const Weigh = require('../models/Weigh');
    
    const reportRecord = new Weigh({
      userId: req.user.id,
      customerName: reportData.customerData?.name,
      customerEmail: reportData.customerData?.email,
      customerPhone: reportData.customerData?.phone,
      
      // Vehicle data
      vehicleWeightHitched: reportData.weightsData?.vehicleCaravanCombined,
      vehicleWeightUnhitched: reportData.weightsData?.vehicleOnly,
      caravanWeight: reportData.weightsData?.caravanOnly,
      towBallWeight: reportData.weightsData?.towBallWeight || 
        (reportData.weightsData?.vehicleCaravanCombined - reportData.weightsData?.vehicleOnly),
      
      // Individual wheel weights (DIY users don't measure these, so we'll use placeholder values)
      vehicleFrontLeft: 0, // DIY users don't have individual wheel data
      vehicleFrontRight: 0,
      vehicleRearLeft: 0, 
      vehicleRearRight: 0,
      
      // Vehicle specification data (for admin review if user-provided)
      vehicleData: reportData.vehicleData,
      caravanData: reportData.caravanData,
      
      // DATA GOVERNANCE: Flag user-provided data for admin review
      hasUserProvidedVehicleData: reportData.vehicleData?.dataSource === 'USER_PROVIDED',
      hasUserProvidedCaravanData: reportData.caravanData?.dataSource === 'USER_PROVIDED',
      requiresAdminReview: (reportData.vehicleData?.dataSource === 'USER_PROVIDED' || 
                           reportData.caravanData?.dataSource === 'USER_PROVIDED'),
      
      // Compliance results
      complianceResults: reportData.complianceResults,
      
      // Payment information
      payment: {
        method: 'stripe',
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency.toUpperCase(),
        status: 'completed',
        paidAt: new Date()
      },
      
      status: 'completed'
    });

    await reportRecord.save();

    res.json({
      success: true,
      message: 'Payment confirmed and report saved',
      reportId: reportRecord._id,
      transactionId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// Webhook to handle Stripe events (optional but recommended for production)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached to a Customer:', paymentMethod.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Get payment history for the authenticated user
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get user's weigh records that have payments
    const Weigh = require('../models/Weigh');
    
    const query = {
      userId: req.user.id,
      'payment.status': { $exists: true }
    };
    
    const [payments, total] = await Promise.all([
      Weigh.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('customerName vehicleData caravanData payment createdAt vehicleWeightHitched vehicleWeightUnhitched caravanWeight'),
      Weigh.countDocuments(query)
    ]);
    
    // Transform the data to match frontend expectations
    const transformedPayments = payments.map(weigh => ({
      _id: weigh._id,
      createdAt: weigh.createdAt,
      vehicleNumberPlate: weigh.vehicleData?.numberPlate || '-',
      caravanNumberPlate: weigh.caravanData?.numberPlate || '-',
      payment: weigh.payment,
      vehicleWeightHitched: weigh.vehicleWeightHitched,
      vehicleWeightUnhitched: weigh.vehicleWeightUnhitched,
      caravanWeight: weigh.caravanWeight
    }));
    
    res.json({
      success: true,
      payments: transformedPayments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

module.exports = router;