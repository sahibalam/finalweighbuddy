const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/auth');

const normalizeRego = (value) => {
  const v = value === undefined || value === null ? '' : String(value);
  const trimmed = v.trim();
  return trimmed ? trimmed.toUpperCase() : '';
};

const computeSetupKey = ({ vehicleRego, trailerRego }) => {
  const v = normalizeRego(vehicleRego);
  const t = normalizeRego(trailerRego);
  if (v && t) return `VT:${v}|${t}`;
  if (v) return `V:${v}`;
  if (t) return `T:${t}`;
  return '';
};

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

    // eslint-disable-next-line no-console
    console.log('confirm-payment STEP 0 received body', {
      paymentIntentId: paymentIntentId || null,
      hasReportData: Boolean(reportData),
      userId: req.user?.id ? String(req.user.id) : null,
    });

    if (!paymentIntentId || !reportData) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and report data are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // eslint-disable-next-line no-console
    console.log('confirm-payment stripe intent', {
      paymentIntentId: paymentIntent?.id || null,
      status: paymentIntent?.status || null,
      amount: paymentIntent?.amount || null,
      currency: paymentIntent?.currency || null,
    });

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // eslint-disable-next-line no-console
    console.log('confirm-payment STEP 1 payment succeeded', {
      paymentIntentId: paymentIntent?.id || null,
      userId: req.user?.id ? String(req.user.id) : null,
    });

    // For certain flows we defer DB persistence until the user completes
    // a later step (e.g. DIY Vehicle Only / Weighbridge Axle flow where
    // the record should only be saved when the user clicks Finish on the
    // Weigh Results screen).
    const isVehicleOnlyAxle = reportData?.flowType === 'VEHICLE_ONLY_WEIGHBRIDGE_AXLE';

    // For the special Vehicle Only / Weighbridge Axle DIY flow, do not
    // create a Weigh record here. We only confirm the payment and let the
    // frontend save the weigh on the final Weigh Results screen.
    if (isVehicleOnlyAxle) {
      return res.json({
        success: true,
        message: 'Payment confirmed (weigh will be saved on Finish)',
        transactionId: paymentIntent.id
      });
    }

    // Default behaviour for all other flows: create a Weigh record now.
    const Weigh = require('../models/Weigh');

    // eslint-disable-next-line no-console
    console.log('confirm-payment STEP 2 creating Weigh record');

    // Normalise incoming data so validation does not fail for DIY payment-only flows
    const customerName = reportData.customerData?.name || req.user.name || 'DIY User';
    const customerEmail = reportData.customerData?.email || req.user.email || 'unknown@example.com';
    const customerPhone = reportData.customerData?.phone || req.user.phone || 'N/A';

    const weightsData = reportData.weightsData || {};
    const vehicleCaravanCombined = Number(weightsData.vehicleCaravanCombined) || 0;
    const vehicleOnly = Number(weightsData.vehicleOnly) || 0;
    const caravanOnly = Number(weightsData.caravanOnly) || 0;

    let towBallWeight = 0;
    if (typeof weightsData.towBallWeight === 'number' && !isNaN(weightsData.towBallWeight)) {
      towBallWeight = weightsData.towBallWeight;
    } else if (vehicleCaravanCombined && vehicleOnly) {
      towBallWeight = vehicleCaravanCombined - vehicleOnly;
    }

    const reportRecord = new Weigh({
      userId: req.user.id,
      customerName,
      customerEmail,
      customerPhone,

      // Persist top-level selection fields for Weigh History detection
      weighingSelection:
        reportData?.flowType === 'TRAILER_TARE_REPORT'
          ? 'custom_build_trailer_tare'
          : (reportData?.weighingSelection || reportData?.diyWeighingSelection || undefined),
      diyWeighingSelection:
        reportData?.flowType === 'TRAILER_TARE_REPORT'
          ? 'custom_build_trailer_tare'
          : (reportData?.diyWeighingSelection || undefined),
      methodSelection:
        reportData?.flowType === 'TRAILER_TARE_REPORT'
          ? (
              reportData?.weightsData?.methodSelection ||
              reportData?.weightsData?.diyMethodSelection ||
              reportData?.vehicleOnlyMethodLabel ||
              reportData?.vehicleData?.diyMethodSelection ||
              reportData?.vehicleData?.methodSelection ||
              undefined
            )
          : (reportData?.methodSelection || reportData?.weightsData?.methodSelection || undefined),

      // Vehicle data
      vehicleWeightHitched: vehicleCaravanCombined || vehicleOnly,
      vehicleWeightUnhitched: vehicleOnly || undefined,
      caravanWeight: caravanOnly,
      towBallWeight,

      // Individual wheel weights (DIY users don't measure these, so we'll use placeholder values)
      vehicleFrontLeft: 0, // DIY users don't have individual wheel data
      vehicleFrontRight: 0,
      vehicleRearLeft: 0, 
      vehicleRearRight: 0,

      // Vehicle specification data (for admin review if user-provided)
      vehicleData: reportData.vehicleData,
      caravanData: reportData.caravanData,
      preWeigh: reportData.preWeigh,

      // Persist weights metadata for payment-only flows so Weigh History can
      // reliably detect the correct report type.
      weights:
        reportData?.flowType === 'TRAILER_TARE_REPORT'
          ? {
              weightsType: 'diy_caravan_only',
              diyMethodSelection:
                reportData?.weightsData?.methodSelection ||
                reportData?.weightsData?.diyMethodSelection ||
                reportData?.vehicleOnlyMethodLabel ||
                reportData?.vehicleData?.diyMethodSelection ||
                reportData?.vehicleData?.methodSelection ||
                null,
              diyWeighingSelection: 'custom_build_trailer_tare',
              weighingSelection: 'custom_build_trailer_tare',
              raw: {
                tyreWeigh: reportData?.vehicleData?.diyTyreWeigh || reportData?.weightsData?.tyreWeigh || null,
                axleWeigh: reportData?.vehicleData?.diyAxleWeigh || reportData?.weightsData?.axleWeigh || null,
                methodSelection:
                  reportData?.weightsData?.methodSelection ||
                  reportData?.weightsData?.diyMethodSelection ||
                  reportData?.vehicleOnlyMethodLabel ||
                  reportData?.vehicleData?.methodSelection ||
                  null,
                diyWeighingSelection: 'custom_build_trailer_tare',
                weighingSelection: 'custom_build_trailer_tare',
              },
            }
          : reportData?.weightsData?.weights || reportData?.weights || undefined,

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

    // eslint-disable-next-line no-console
    console.log('confirm-payment STEP 3 about to save Weigh', {
      userId: req.user?.id ? String(req.user.id) : null,
      vehiclePlate: reportData?.vehicleData?.numberPlate || null,
      caravanPlate: reportData?.caravanData?.numberPlate || null,
      amount: paymentIntent?.amount || null,
      paymentIntentId: paymentIntent?.id || null,
    });

    await reportRecord.save();

    // eslint-disable-next-line no-console
    console.log('confirm-payment STEP 4 saved Weigh', {
      weighId: String(reportRecord._id),
      paymentIntentId: paymentIntent?.id || null,
    });

    // Safeguard: ensure payment transactionId is persisted even if a later
    // middleware/overwrite stripped it for some reason.
    try {
      reportRecord.payment = reportRecord.payment || {};
      reportRecord.payment.transactionId = reportRecord.payment.transactionId || paymentIntent.id;
      await reportRecord.save();
    } catch (e) {
      // non-blocking
    }

    // eslint-disable-next-line no-console
    console.log('confirm-payment saved weigh', {
      weighId: String(reportRecord._id),
      userId: String(req.user.id),
      payment: {
        method: reportRecord?.payment?.method,
        status: reportRecord?.payment?.status,
        amount: reportRecord?.payment?.amount,
        transactionId: reportRecord?.payment?.transactionId,
        currency: reportRecord?.payment?.currency,
      },
    });

    // Wallet credit: if this is a professional-created DIY user, and the
    // setupKey matches a registered setup for that professional, credit $1.
    try {
      // eslint-disable-next-line no-console
      console.log('confirm-payment STEP 5 starting wallet credit', {
        weighId: String(reportRecord._id),
        paymentIntentId: paymentIntent?.id || null,
      });

      const User = require('../models/User');
      const ProfessionalCustomerSetup = require('../models/ProfessionalCustomerSetup');
      const WalletTransaction = require('../models/WalletTransaction');

      const diyUser = await User.findById(req.user.id).select('professionalOwnerUserId');
      const professionalId = diyUser?.professionalOwnerUserId;

      // eslint-disable-next-line no-console
      console.log('wallet/credit check', {
        diyUserId: String(req.user.id),
        professionalId: professionalId ? String(professionalId) : null,
        paymentIntentId: paymentIntent?.id || null,
      });

      if (professionalId) {
        const vehicleRego =
          reportData?.vehicleData?.numberPlate ||
          reportData?.vehicleData?.rego ||
          reportData?.vehicleData?.registration ||
          reportData?.vehicleData?.plate;

        const trailerRego =
          reportData?.caravanData?.numberPlate ||
          reportData?.trailerData?.numberPlate ||
          reportData?.towedData?.numberPlate ||
          reportData?.trailerData?.rego ||
          reportData?.caravanData?.rego ||
          reportData?.trailerRego ||
          reportData?.caravanRego ||
          reportData?.rego;

        const setupKey = computeSetupKey({ vehicleRego, trailerRego });

        // eslint-disable-next-line no-console
        console.log('wallet/credit computed identifiers', {
          diyUserId: String(req.user.id),
          professionalId: String(professionalId),
          setupKey: setupKey || null,
          vehicleRego: normalizeRego(vehicleRego) || null,
          trailerRego: normalizeRego(trailerRego) || null,
          weighId: String(reportRecord._id),
          paymentIntentId: paymentIntent?.id || null,
        });

        if (setupKey) {
          const mapping = await ProfessionalCustomerSetup.findOne({
            professionalId,
            diyUserId: req.user.id,
            setupKey,
          }).select('_id');

          // eslint-disable-next-line no-console
          console.log('wallet/credit mapping lookup', {
            diyUserId: String(req.user.id),
            professionalId: String(professionalId),
            setupKey,
            mappingFound: Boolean(mapping),
          });

          if (mapping) {
            const createdTx = await WalletTransaction.create({
              professionalId,
              diyUserId: req.user.id,
              weighId: reportRecord._id,
              setupKey,
              vehicleRego: normalizeRego(vehicleRego) || null,
              trailerRego: normalizeRego(trailerRego) || null,
              amount: 1,
              type: 'credit',
              source: 'diy_payment',
              paymentIntentId: paymentIntent.id,
            });

            // eslint-disable-next-line no-console
            console.log('wallet/credit created', {
              id: String(createdTx?._id),
              professionalId: String(professionalId),
              diyUserId: String(req.user.id),
              setupKey,
              amount: 1,
              paymentIntentId: paymentIntent?.id || null,
              weighId: String(reportRecord._id),
            });
          } else {
            // Self-healing: create the mapping if missing so the professional
            // still gets credited for professional-created DIY users.
            // eslint-disable-next-line no-console
            console.warn('Wallet mapping missing; auto-registering setup before credit', {
              professionalId: String(professionalId),
              diyUserId: String(req.user.id),
              setupKey,
              vehicleRego: normalizeRego(vehicleRego) || null,
              trailerRego: normalizeRego(trailerRego) || null,
              paymentIntentId: paymentIntent.id,
              weighId: String(reportRecord._id),
            });

            await ProfessionalCustomerSetup.updateOne(
              {
                professionalId,
                diyUserId: req.user.id,
                setupKey,
              },
              {
                $setOnInsert: {
                  professionalId,
                  diyUserId: req.user.id,
                  setupKey,
                  vehicleRego: normalizeRego(vehicleRego) || null,
                  trailerRego: normalizeRego(trailerRego) || null,
                },
              },
              { upsert: true }
            );

            const createdTx = await WalletTransaction.create({
              professionalId,
              diyUserId: req.user.id,
              weighId: reportRecord._id,
              setupKey,
              vehicleRego: normalizeRego(vehicleRego) || null,
              trailerRego: normalizeRego(trailerRego) || null,
              amount: 1,
              type: 'credit',
              source: 'diy_payment',
              paymentIntentId: paymentIntent.id,
            });

            // eslint-disable-next-line no-console
            console.log('wallet/credit created (after auto-mapping)', {
              id: String(createdTx?._id),
              professionalId: String(professionalId),
              diyUserId: String(req.user.id),
              setupKey,
              amount: 1,
              paymentIntentId: paymentIntent?.id || null,
              weighId: String(reportRecord._id),
            });
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn('Wallet credit skipped: unable to compute setupKey', {
            professionalId: String(professionalId),
            diyUserId: String(req.user.id),
            vehicleRego: normalizeRego(vehicleRego) || null,
            trailerRego: normalizeRego(trailerRego) || null,
            paymentIntentId: paymentIntent.id,
            weighId: String(reportRecord._id),
          });
        }
      }
    } catch (walletErr) {
      // Do not block successful payment flow on wallet credit failure
      // (e.g. duplicate credit due to retry, transient DB error, etc.)
      if (walletErr?.code === 11000) {
        // ignore duplicate credit attempts
      } else {
        console.error('Wallet credit error:', {
          paymentIntentId: paymentIntent?.id || null,
          weighId: reportRecord?._id ? String(reportRecord._id) : null,
          error: walletErr,
        });
      }
    }

    res.json({
      success: true,
      message: 'Payment confirmed and report saved',
      reportId: reportRecord._id,
      transactionId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error confirming payment:', {
      paymentIntentId: req.body?.paymentIntentId || null,
      userId: req.user?.id ? String(req.user.id) : null,
      error,
    });
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