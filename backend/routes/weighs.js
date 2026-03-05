const express = require('express');
const { body, validationResult } = require('express-validator');
const Weigh = require('../models/Weigh');
const Vehicle = require('../models/Vehicle');
const Caravan = require('../models/Caravan');
const User = require('../models/User');
const { protect, authorize, checkSubscription } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { drawExactLandscape } = require('../pdfdemo');

const router = express.Router();

// @desc    Create new weigh entry
// @route   POST /api/weighs
// @access  Private
router.post('/', protect, checkSubscription, [
  body('customerName', 'Customer name is required').not().isEmpty(),
  body('customerPhone', 'Customer phone is required').not().isEmpty(),
  body('customerEmail', 'Customer email is required').isEmail(),
  body('vehicleId', 'Vehicle ID is required').not().isEmpty(),
  body('caravanId', 'Caravan ID is required').not().isEmpty(),
  body('vehicleNumberPlate', 'Vehicle number plate is required').not().isEmpty(),
  body('vehicleState', 'Vehicle state is required').not().isEmpty(),
  body('vehicleDescription', 'Vehicle description is required').not().isEmpty(),
  body('caravanNumberPlate', 'Caravan number plate is required').not().isEmpty(),
  body('caravanState').optional({ nullable: true, checkFalsy: true }).isString(),
  body('caravanDescription').optional({ nullable: true, checkFalsy: true }).isString(),
  body('caravanComplianceImage').optional({ nullable: true, checkFalsy: true }).isString(),
  body('caravanTare').optional({ nullable: true, checkFalsy: true }),
  body('weights.frontAxle', 'Front axle weight is required').isNumeric(),
  body('weights.rearAxle', 'Rear axle weight is required').isNumeric(),
  body('weights.totalVehicle', 'Total vehicle weight is required').isNumeric(),
  // DIY: separate front/rear axle-group inputs are optional; we accept zeros
  body('weights.totalCaravan', 'Total caravan weight is required').isNumeric(),
  body('weights.grossCombination', 'Gross combination weight is required').isNumeric(),
  body('weights.tbm', 'Tow ball mass is required').isNumeric()
], async (req, res) => {
  console.log(' Weigh entry creation request received');
  console.log('User:', req.user.email);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // For fleet owners and fleet staff, when the frontend explicitly passes a
  // clientUserId (the DIY login for the customer created from
  // FleetStaffManagement), attach it directly so that the DIY customer can
  // see this weigh in their own history via clientUserId-based lookups.
  let validatedClientUserId = undefined;
  console.log('POST /api/weighs: initial clientUserId wiring', {
    requester: {
      id: req.user?.id,
      email: req.user?.email,
      userType: req.user?.userType,
      fleetOwnerUserId: req.user?.fleetOwnerUserId || null,
    },
    rawClientUserId: req.body?.clientUserId || null,
  });

  if ((req.user.userType === 'fleet' || req.user.fleetOwnerUserId) && req.body.clientUserId) {
    validatedClientUserId = req.body.clientUserId;
    console.log('POST /api/weighs: fleet context, adopting clientUserId from body:', validatedClientUserId);
  }

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,

      clientUserId,
      vehicleId,
      caravanId,
      vehicleNumberPlate,
      vehicleState,
      vehicleDescription,
      vehicleVin,
      caravanNumberPlate,
      caravanState,
      caravanDescription,
      caravanVin,
      caravanComplianceImage,
      caravanTare,
      weights,
      preWeigh,
      notes,
      payment: clientPayment
    } = req.body;

    // Debug: log customer-related fields for professional/fleet flows so we
    // can verify what the frontend is actually sending.
    console.log('POST /api/weighs customer debug', {
      requester: {
        id: req.user?.id,
        userType: req.user?.userType,
        fleetOwnerUserId: req.user?.fleetOwnerUserId || null,
      },
      incomingCustomer: {
        customerName,
        customerPhone,
        customerEmail,
        clientUserId,
      },
    });

    let effectiveCustomerName = customerName;
    let effectiveCustomerPhone = customerPhone;
    let effectiveCustomerEmail = customerEmail;

    if (req.user.userType === 'professional' && clientUserId) {
      const client = await User.findOne({
        _id: clientUserId,
        userType: 'diy',
        professionalOwnerUserId: req.user.id,
      }).select('name email phone');

      if (!client) {
        return res.status(403).json({
          success: false,
          message: 'Client not found or not associated with this professional account',
        });
      }

      validatedClientUserId = client._id;

      // For professional flows with an attached DIY client, prefer the
      // client's details for customer fields so history/reporting shows
      // the end customer, not the professional account.
      effectiveCustomerName = client.name || customerName || req.user.name;
      effectiveCustomerPhone = client.phone || customerPhone || req.user.phone;
      effectiveCustomerEmail = client.email || customerEmail || req.user.email;
    }

    // For fleet owners and fleet staff (DIY users with fleetOwnerUserId), do
    // not fall back to the account's own details for the end-customer fields.
    // Always prefer the explicit customerName/Phone/Email values sent in the
    // request body when they are non-empty strings, so that the New Weigh
    // "Customer Information" step fully controls what is stored.
    if (req.user.userType === 'fleet' || req.user.fleetOwnerUserId) {
      if (typeof customerName === 'string' && customerName.trim() !== '') {
        effectiveCustomerName = customerName;
      }
      if (typeof customerPhone === 'string' && customerPhone.trim() !== '') {
        effectiveCustomerPhone = customerPhone;
      }
      if (typeof customerEmail === 'string' && customerEmail.trim() !== '') {
        effectiveCustomerEmail = customerEmail;
      }
    }

    console.log('POST /api/weighs: about to create Weigh with validatedClientUserId:', validatedClientUserId);

    // Look up vehicle and caravan documents
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    let caravan = null;
    if (caravanId) {
      caravan = await Caravan.findById(caravanId);
      if (!caravan) {
        return res.status(404).json({
          success: false,
          message: 'Caravan not found'
        });
      }
    }

    // Normalize caravan identifier casing for consistent lookups
    const normalizedCaravanNumberPlate = String(caravanNumberPlate || '').toUpperCase();
    const normalizedCaravanState = String(caravanState || '').toUpperCase();

    // Vehicle compliance (DIY: simplified checks without individual axle weights)
    const vehicleCompliance = {
      gvm: {
        actual: parseFloat(weights.totalVehicle) || 0,
        limit: vehicle.gvm,
        compliant: (parseFloat(weights.totalVehicle) || 0) <= vehicle.gvm,
        percentage: vehicle.gvm > 0 ? ((parseFloat(weights.totalVehicle) || 0) / vehicle.gvm * 100).toFixed(1) : '0.0'
      },
      frontAxle: {
        actual: 0, // DIY users don't measure individual axle weights
        limit: vehicle.fawr,
        compliant: true, // Skip individual axle check for DIY
        percentage: 0
      },
      rearAxle: {
        actual: 0, // DIY users don't measure individual axle weights
        limit: vehicle.rawr,
        compliant: true, // Skip individual axle check for DIY
        percentage: 0
      },
      tbm: {
        actual: parseFloat(weights.tbm) || 0,
        // TBM Limit: First choice from vehicle manual, fallback to 10% of Caravan ATM
        limit: vehicle.tbm || (caravan.atm * 0.1) || 0,
        compliant: (parseFloat(weights.tbm) || 0) <= (vehicle.tbm || (caravan.atm * 0.1) || 0),
        percentage: (vehicle.tbm || (caravan.atm * 0.1) || 0) > 0 ? ((parseFloat(weights.tbm) || 0) / (vehicle.tbm || (caravan.atm * 0.1) || 0) * 100).toFixed(1) : '0.0'
      },
      btc: {
        actual: parseFloat(weights.totalCaravan) || 0,
        limit: vehicle.btc,
        compliant: (parseFloat(weights.totalCaravan) || 0) <= vehicle.btc,
        percentage: vehicle.btc > 0 ? ((parseFloat(weights.totalCaravan) || 0) / vehicle.btc * 100).toFixed(1) : '0.0'
      }
    };

    // Caravan compliance (DIY: check combined axle-group total vs capacity/GTM)
    const totalCaravanActual = parseFloat(weights.totalCaravan) || 0;
    const calculatedGTM = totalCaravanActual - (parseFloat(weights.tbm) || 0); // GTM = ATM - TBM
    
    const caravanCompliance = {
      atm: {
        actual: totalCaravanActual,
        limit: caravan.atm,
        compliant: totalCaravanActual <= caravan.atm,
        percentage: caravan.atm > 0 ? (totalCaravanActual / caravan.atm * 100).toFixed(1) : '0.0'
      },
      gtm: {
        actual: calculatedGTM,
        limit: caravan.gtm || 0,
        compliant: caravan.gtm > 0 ? calculatedGTM <= caravan.gtm : true, // Only check if GTM limit is available
        percentage: caravan.gtm > 0 ? (calculatedGTM / caravan.gtm * 100).toFixed(1) : '0.0'
      },
      axleGroupTotal: {
        actual: totalCaravanActual,
        // Prefer explicit axle group loading; if absent fall back to GTM
        limit: (caravan.axleGroupLoading || caravan.gtm || 0),
        compliant: totalCaravanActual <= (caravan.axleGroupLoading || caravan.gtm || 0),
        percentage: (caravan.axleGroupLoading || caravan.gtm || 0) > 0 ? (totalCaravanActual / (caravan.axleGroupLoading || caravan.gtm) * 100).toFixed(1) : '0.0'
      }
    };

    // Combination compliance
    const combinationCompliance = {
      gcm: {
        actual: parseFloat(weights.grossCombination) || 0,
        limit: vehicle.gcm,
        compliant: (parseFloat(weights.grossCombination) || 0) <= vehicle.gcm,
        percentage: vehicle.gcm > 0 ? ((parseFloat(weights.grossCombination) || 0) / vehicle.gcm * 100).toFixed(1) : '0.0'
      }
    };

    // Calculate overall compliance - only check if all required fields are present
    const overallCompliant = 
      vehicleCompliance.gvm.compliant && 
      vehicleCompliance.tbm.compliant &&
      vehicleCompliance.btc.compliant &&
      caravanCompliance.atm.compliant &&
      caravanCompliance.gtm.compliant &&
      // DIY: use combined axle-group total if capacity is known
      (caravan.axleGroupLoading || caravan.gtm ? caravanCompliance.axleGroupTotal.compliant : true) &&
      combinationCompliance.gcm.compliant;

    // Create weigh entry
    const weigh = new Weigh({
      userId: req.user.id,
      clientUserId: validatedClientUserId,
      fleetOwnerUserId:
        req.user.userType === 'fleet'
          ? req.user.id
          : req.user.fleetOwnerUserId
            ? req.user.fleetOwnerUserId
            : undefined,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      customerEmail: effectiveCustomerEmail,

      vehicle: vehicleId,
      vehicleNumberPlate,
      caravan: caravanId,
      caravanNumberPlate: normalizedCaravanNumberPlate,

      // Required legacy fields (used by history table + schema validation)
      vehicleWeightHitched: parseFloat(weights.totalVehicle) || 0,
      vehicleWeightUnhitched: parseFloat(weights.totalVehicle) || 0,
      caravanWeight: parseFloat(weights.totalCaravan) || 0,
      towBallWeight: parseFloat(weights.tbm) || 0,

      // Store complete vehicle and caravan data for admin review
      vehicleData: {
        ...vehicle.toObject(),
        description: vehicleDescription || vehicle.description || '',
        numberPlate: vehicleNumberPlate,
        state: vehicleState || vehicle.state || '',
        vin: vehicleVin || ''
      },
      caravanData: {
        ...caravan.toObject(),
        description: caravanDescription || caravan.description || '',
        numberPlate: normalizedCaravanNumberPlate,
        state: normalizedCaravanState || caravan.state || '',
        vin: caravanVin || '',
        complianceImage: caravanComplianceImage || '',
        tare:
          caravanTare != null && caravanTare !== ''
            ? Number(caravanTare) || 0
            : (caravan.tare != null
                ? caravan.tare
                : (caravan.tareMass != null ? caravan.tareMass : undefined))
      },
      weights,
      preWeigh,
      notes: notes || '',
      complianceResults: {
        vehicle: vehicleCompliance,
        caravan: caravanCompliance,
        combination: combinationCompliance,
        overallCompliant: overallCompliant
      },
      payment: (() => {
        if (req.user.userType === 'professional') {
          return {
            method: 'direct',
            amount: 0,
            status: 'completed'
          };
        }
        // DIY: allow client to pass payment method/status/amount
        if (clientPayment && typeof clientPayment === 'object') {
          return {
            method: clientPayment.method || 'card',
            amount: typeof clientPayment.amount === 'number' ? clientPayment.amount : 29.99,
            status: clientPayment.status || (clientPayment.method === 'cash' || clientPayment.method === 'direct' ? 'completed' : 'pending'),
            transactionId: clientPayment.transactionId
          };
        }
        return { method: 'card', amount: 29.99, status: 'completed' };
      })(),
      status: 'completed' // Add status field to mark weigh as completed
    });

    await weigh.save();
    console.log(' Weigh entry saved successfully:', weigh._id, 'for user:', req.user.id);
    console.log(' Weigh entry details:', {
      vehicle: weigh.vehicleNumberPlate,
      caravan: weigh.caravanNumberPlate,
      status: weigh.status,
      payment: weigh.payment.status
    });

    // Update user weigh count
    const user = await User.findById(req.user.id);
    user.weighCount += 1;
    
    // Check for reward (every 10 weighs = 1 free)
    if (user.weighCount % 10 === 0) {
      user.freeWeighs += 1;
    }
    
    await user.save();

    // Mark report as generated (will be generated on first download)
    await Weigh.findByIdAndUpdate(weigh._id, {
      reportGenerated: true,
      reportUrl: `/api/weighs/${weigh._id}/report`
    });

    res.status(201).json({
      success: true,
      weighId: weigh._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/weighs/diy-vehicle-only
// @access  Private (DIY user)
router.post('/diy-vehicle-only', protect, async (req, res) => {
  try {
    const {
      vehicleSummary = {},
      caravanSummary = null,
      weights: normalizedWeights = null,
      preWeigh = {},
      notes,
      payment: clientPayment = {},
      modifiedVehicleImages = [],
      clientUserId = null,
      customerName: incomingCustomerName = null,
      customerEmail: incomingCustomerEmail = null,
      customerPhone: incomingCustomerPhone = null,
    } = req.body || {};

    const totalUnhitched = Number(vehicleSummary.gvmUnhitched) || 0;
    const frontUnhitched = Number(vehicleSummary.frontUnhitched) || 0;
    const rearUnhitched = Number(vehicleSummary.rearUnhitched) || 0;

    const resolvedTowBallWeight =
      normalizedWeights && typeof normalizedWeights === 'object'
        ? Number(normalizedWeights.tbm) || 0
        : 0;

    const resolvedCaravanWeight =
      normalizedWeights && typeof normalizedWeights === 'object'
        ? Number(normalizedWeights.totalCaravan) || 0
        : 0;

    const resolvedAtmMeasured = Math.max(0, resolvedCaravanWeight + resolvedTowBallWeight);

    const resolvedVehicleHitched =
      normalizedWeights && typeof normalizedWeights === 'object'
        ? Number(normalizedWeights.totalVehicle) || totalUnhitched
        : totalUnhitched;

    // Confirm Caravan/Trailer Details rules (registered caravan flows):
    // all required except GTM, VIN, Axle Group Loadings.
    if (caravanSummary && typeof caravanSummary === 'object') {
      const isEmpty = (v) => String(v || '').trim() === '';

      if (isEmpty(caravanSummary.rego)) {
        return res.status(400).json({ success: false, message: 'Caravan rego is required' });
      }
      if (isEmpty(caravanSummary.state)) {
        return res.status(400).json({ success: false, message: 'Caravan state is required' });
      }
      if (isEmpty(caravanSummary.make)) {
        return res.status(400).json({ success: false, message: 'Caravan make is required' });
      }
      if (isEmpty(caravanSummary.model)) {
        return res.status(400).json({ success: false, message: 'Caravan model is required' });
      }
      if (isEmpty(caravanSummary.year)) {
        return res.status(400).json({ success: false, message: 'Caravan year is required' });
      }

      if (caravanSummary.atm == null || String(caravanSummary.atm).trim() === '') {
        return res.status(400).json({ success: false, message: 'Caravan ATM is required' });
      }
      if (caravanSummary.tare == null || String(caravanSummary.tare).trim() === '') {
        return res.status(400).json({ success: false, message: 'Caravan tare is required' });
      }
    }

    // Confirm Vehicle screen fields should always be present for vehicle flows.
    // VIN is optional; caravan-only registered flows may send an empty vehicleSummary.
    if (totalUnhitched > 0) {
      const isEmpty = (v) => String(v || '').trim() === '';

      if (isEmpty(vehicleSummary.rego)) {
        return res.status(400).json({ success: false, message: 'Vehicle rego is required' });
      }
      if (isEmpty(vehicleSummary.state)) {
        return res.status(400).json({ success: false, message: 'Vehicle state is required' });
      }
      if (isEmpty(vehicleSummary.description)) {
        return res.status(400).json({ success: false, message: 'Vehicle description is required' });
      }

      // Capacities are required on the Confirm Vehicle screen.
      if (vehicleSummary.fawr == null || Number(vehicleSummary.fawr) <= 0) {
        return res.status(400).json({ success: false, message: 'Front axle loading (FAWR) is required' });
      }
      if (vehicleSummary.rawr == null || Number(vehicleSummary.rawr) <= 0) {
        return res.status(400).json({ success: false, message: 'Rear axle loading (RAWR) is required' });
      }
      if (vehicleSummary.gvm == null || Number(vehicleSummary.gvm) <= 0) {
        return res.status(400).json({ success: false, message: 'Gross Vehicle Mass (GVM) is required' });
      }

      // Tow-vehicle flows should also include tow capacities.
      const isTowFlow = normalizedWeights && Number(normalizedWeights.totalCaravan) > 0;
      if (isTowFlow) {
        if (vehicleSummary.gcm == null || Number(vehicleSummary.gcm) <= 0) {
          return res.status(400).json({ success: false, message: 'Gross Combination Mass (GCM) is required' });
        }
        if (vehicleSummary.btc == null || Number(vehicleSummary.btc) <= 0) {
          return res.status(400).json({ success: false, message: 'Braked Towing Capacity (BTC) is required' });
        }
        if (vehicleSummary.tbm == null || Number(vehicleSummary.tbm) <= 0) {
          return res.status(400).json({ success: false, message: 'Tow Ball Mass (TBM) is required' });
        }
      }
    }

    // Resolve customer details. For professional-created DIY records with an attached
    // client, prefer the DIY client's details so history/reporting shows the end
    // customer (same behaviour as POST /api/weighs).
    let effectiveCustomerName = req.user.name || 'DIY User';
    let effectiveCustomerEmail = req.user.email || 'unknown@example.com';
    let effectiveCustomerPhone = req.user.phone || 'N/A';
    let validatedClientUserId = undefined;

    if (req.user.userType === 'professional' && clientUserId) {
      try {
        const client = await User.findOne({
          _id: clientUserId,
          userType: 'diy',
          professionalOwnerUserId: req.user.id,
        }).select('name email phone');

        if (client) {
          validatedClientUserId = client._id;
          effectiveCustomerName = client.name || effectiveCustomerName;
          effectiveCustomerEmail = client.email || effectiveCustomerEmail;
          effectiveCustomerPhone = client.phone || effectiveCustomerPhone;
        }
      } catch (lookupErr) {
        console.error('Failed to resolve DIY client for diy-vehicle-only weigh:', lookupErr);
      }
    }

    // For fleet owners and fleet staff using the legacy DIY wizard, when the
    // frontend explicitly passes a clientUserId (DIY login created from
    // FleetStaffManagement), attach it directly so the DIY customer can see
    // this record in their own history via clientUserId-based lookups.
    if ((req.user.userType === 'fleet' || req.user.fleetOwnerUserId) && clientUserId) {
      validatedClientUserId = clientUserId;
      console.log('POST /api/weighs/diy-vehicle-only: fleet context adopting clientUserId from body:', validatedClientUserId);
    }

    // For fleet owners and fleet staff using the legacy DIY wizard, prefer any
    // explicit customer fields that were forwarded from the frontend (e.g.
    // FleetStaffManagement "Create new User" draft) over the account details.
    if (req.user.userType === 'fleet' || req.user.fleetOwnerUserId) {
      if (typeof incomingCustomerName === 'string' && incomingCustomerName.trim() !== '') {
        effectiveCustomerName = incomingCustomerName.trim();
      }
      if (typeof incomingCustomerEmail === 'string' && incomingCustomerEmail.trim() !== '') {
        effectiveCustomerEmail = incomingCustomerEmail.trim();
      }
      if (typeof incomingCustomerPhone === 'string' && incomingCustomerPhone.trim() !== '') {
        effectiveCustomerPhone = incomingCustomerPhone.trim();
      }
    }

    const weigh = new Weigh({
      userId: req.user.id,
      clientUserId: validatedClientUserId,
      customerName: effectiveCustomerName,
      customerEmail: effectiveCustomerEmail,
      customerPhone: effectiveCustomerPhone,

      // Vehicle-only DIY flow: treat the unhitched total as both hitched
      // and unhitched so required fields are satisfied. Caravan-related
      // fields are zero as there is no caravan in this flow.
      vehicleWeightHitched: resolvedVehicleHitched,
      vehicleWeightUnhitched: totalUnhitched,
      caravanWeight: resolvedAtmMeasured,
      towBallWeight: resolvedTowBallWeight,

      // Store a light vehicle summary (from Info-Agent / lookup + DIY axle calc)
      vehicleData: {
        description: vehicleSummary.description,
        numberPlate: vehicleSummary.rego,
        state: vehicleSummary.state,
        vin: vehicleSummary.vin,
        // Optional capacities (present for professional vehicle-only portable flow)
        fawr: vehicleSummary.fawr != null ? Number(vehicleSummary.fawr) || 0 : undefined,
        rawr: vehicleSummary.rawr != null ? Number(vehicleSummary.rawr) || 0 : undefined,
        gvm: vehicleSummary.gvm != null ? Number(vehicleSummary.gvm) || 0 : undefined,
        gcm: vehicleSummary.gcm != null ? Number(vehicleSummary.gcm) || 0 : undefined,
        btc: vehicleSummary.btc != null ? Number(vehicleSummary.btc) || 0 : undefined,
        tbm: vehicleSummary.tbm != null ? Number(vehicleSummary.tbm) || 0 : undefined,
        // Keep a measured reference as well (some screens store measured GVM as unhitched)
        gvmUnhitched: vehicleSummary.gvmUnhitched,
        frontAxleUnhitched: frontUnhitched,
        rearAxleUnhitched: rearUnhitched
      },

      // Optional caravan summary for caravan-only registered flows
      ...(caravanSummary && typeof caravanSummary === 'object'
        ? {
            caravanData: {
              description: caravanSummary.description,
              numberPlate: caravanSummary.rego,
              state: caravanSummary.state,
              vin: caravanSummary.vin,
              make: caravanSummary.make,
              model: caravanSummary.model,
              year: caravanSummary.year,
              atm: caravanSummary.atm,
              gtm: caravanSummary.gtm,
              axleGroups: caravanSummary.axleGroups,
              tare: caravanSummary.tare,
              complianceImage: caravanSummary.complianceImage,
              tbmMeasured: caravanSummary.tbmMeasured,
              gtmMeasured: caravanSummary.gtmMeasured,
              atmMeasured: caravanSummary.atmMeasured,
            },
            caravanNumberPlate: caravanSummary.rego,
            caravanState: caravanSummary.state,
          }
        : {}),

      // Store any uploaded modified compliance plate images (up to 3 URLs)
      modifiedVehicleComplianceImages: Array.isArray(modifiedVehicleImages)
        ? modifiedVehicleImages.slice(0, 3)
        : [],

      // Optional normalized weights payload (used by newer results screens + history modal mirroring)
      weights: normalizedWeights && typeof normalizedWeights === 'object' ? normalizedWeights : undefined,
      preWeigh,
      notes,
               
      // Minimal complianceResults stub for DIY record
      complianceResults: {
        vehicle: {
          gvm: {
            actual: totalUnhitched,
            limit: vehicleSummary.gvmUnhitched || 0,
            compliant: true,
            percentage: 0
          }
        },
        overallCompliant: true
      },

      payment: {
        method: 'stripe',
        amount: typeof clientPayment.amount === 'number' ? clientPayment.amount : 20,
        status: 'completed',
        transactionId: clientPayment.transactionId
      },

      status: 'completed'
    });

    await weigh.save();

    res.status(201).json({
      success: true,
      weighId: weigh._id
    });
  } catch (error) {
    console.error('Error creating DIY vehicle-only weigh:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving DIY vehicle-only weigh'
    });
  }
});

// @desc    Generate PDF report for DIY Vehicle Only / Weighbridge Axle flow
// @route   POST /api/weighs/diy-vehicle-only/report
// @access  Private
router.post('/diy-vehicle-only/report', protect, async (req, res) => {
  try {
    const { vehicleInfo = {}, measured = {}, capacities = {}, capacityDiff = {}, carInfo = {}, notes = '', methodSelection = '' } = req.body || {};

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-vehicle-only-weigh.pdf');

    doc.pipe(res);

    const logoPath = resolveTemplatePath('weighbuddy logo green background.png');
    if (logoPath) {
      try {
        doc.image(logoPath, 18, 16, { fit: [155, 52], align: 'left', valign: 'top' });
      } catch (e) {
        // ignore logo render errors
      }
    }

    // Vehicle image above the table
    const vehicleImagePath = path.join(__dirname, '..', 'assets', 'vehicle.png');
    try {
      doc.image(vehicleImagePath, 220, 120, { width: 250 });
    } catch (imgErr) {
      console.error('Failed to render vehicle image for DIY report:', imgErr?.message || imgErr);
    }

    // Header
    doc.fontSize(16).text('Weighbuddy DIY Vehicle-Only Weigh Report', { align: 'center' });
    doc.moveDown(1);

    // Vehicle summary
    doc.fontSize(10);
    doc.text(`Car Rego: ${vehicleInfo.rego || '-'}`, { continued: true }).text(`   State: ${vehicleInfo.state || '-'}`);
    doc.text(`Make/Model: ${vehicleInfo.description || '-'}`);
    doc.text(`VIN: ${vehicleInfo.vin || '-'}`);

    doc.moveDown(1.2);

    // Compliance table header - place just below the vehicle image.
    // The image is drawn at y=120 with height ~250, so a tableTop of ~360 keeps
    // it close but not overlapping.
    const tableTop = Math.max(doc.y + 10, 360);
    const colWidth = 120;
    const startX = 150;

    const columns = ['Rear Axle', 'GVM', 'Front Axle'];
    const rows = ['Compliance', 'Weights Recorded', 'Capacity', 'Result'];

    doc.fontSize(10);

    // Column headers (with header row background + borders)
    const headerHeight = 20;
    const totalTableWidth = colWidth * columns.length;

    // Portable scales visual: individual tyre layout image to the right of the table
    if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
      const tyreImagePath = path.join(__dirname, '..', 'assets', 'individual-tyre.png');
      try {
        // Position the image starting just to the right of the table, higher above the table top
        const imageX = startX + totalTableWidth + 40;
        const imageY = tableTop - 120;
        // Make the image larger to better use the available right-hand space
        doc.image(tyreImagePath, imageX, imageY, { width: 260 });
      } catch (imgErr) {
        console.error('Failed to render individual tyre image for DIY report:', imgErr?.message || imgErr);
      }
    }

    // Draw header background and outer border for header row
    doc.save();
    doc.rect(startX - 80, tableTop, 80 + totalTableWidth, headerHeight).stroke('#bdbdbd');
    doc.rect(startX - 80, tableTop, 80, headerHeight).fillAndStroke('#f5f5f5', '#bdbdbd');
    columns.forEach((_, idx) => {
      doc.rect(startX + idx * colWidth, tableTop, colWidth, headerHeight).fillAndStroke('#e8f4ff', '#bdbdbd');
    });
    doc.restore();

    doc.fontSize(10);
    doc.text('', startX - 80, tableTop + 4); // empty corner label
    columns.forEach((col, idx) => {
      doc.text(col, startX + idx * colWidth, tableTop + 4, { width: colWidth, align: 'center' });
    });

    const rowHeight = 18;
    let y = tableTop + headerHeight;

    const val = (v) => (v || v === 0 ? v : '-');

    rows.forEach((rowLabel) => {
      // Row background & borders
      doc.rect(startX - 80, y, 80 + totalTableWidth, rowHeight).stroke('#bdbdbd');

      // Row label cell
      doc.text(rowLabel, startX - 80 + 4, y + 4, { width: 80 - 8, align: 'left' });

      let rearVal, gvmVal, frontVal;

      if (rowLabel === 'Compliance') {
        rearVal = measured.rear;
        gvmVal = measured.gvm;
        frontVal = measured.front;
      } else if (rowLabel === 'Weights Recorded') {
        rearVal = capacities.rear;
        gvmVal = capacities.gvm;
        frontVal = capacities.front;
      } else if (rowLabel === 'Capacity') {
        rearVal = capacityDiff.rear;
        gvmVal = capacityDiff.gvm;
        frontVal = capacityDiff.front;
      } else if (rowLabel === 'Result') {
        const rearOk = typeof measured.rear === 'number' && typeof capacities.rear === 'number' ? measured.rear <= capacities.rear : true;
        const gvmOk = typeof measured.gvm === 'number' && typeof capacities.gvm === 'number' ? measured.gvm <= capacities.gvm : true;
        const frontOk = typeof measured.front === 'number' && typeof capacities.front === 'number' ? measured.front <= capacities.front : true;
        rearVal = rearOk ? 'OK' : 'OVER';
        gvmVal = gvmOk ? 'OK' : 'OVER';
        frontVal = frontOk ? 'OK' : 'OVER';
      }

      [rearVal, gvmVal, frontVal].forEach((value, idx) => {
        // Vertical cell borders
        doc.rect(startX + idx * colWidth, y, colWidth, rowHeight).stroke('#bdbdbd');
        doc.text(String(val(value)), startX + idx * colWidth, y + 4, { width: colWidth, align: 'center' });
      });

      y += rowHeight;
    });

    doc.moveDown(3);

    // Car information and additional notes
    const infoTop = y + 10;
    doc.text('Car Information', 50, infoTop);
    doc.text(`Fuel: ${carInfo.fuelLevel != null ? carInfo.fuelLevel + '%' : '-'}`, 50, infoTop + 14);
    doc.text(`Passengers Front: ${carInfo.passengersFront ?? '-'}`, 50, infoTop + 28);
    doc.text(`Passengers Rear: ${carInfo.passengersRear ?? '-'}`, 50, infoTop + 42);

    doc.text('Additional Notes', 300, infoTop);
    doc.text(notes || '-', 300, infoTop + 14, { width: 400 });

    doc.end();
  } catch (error) {
    console.error('DIY vehicle-only PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
  }
}); // <--- Added closing bracket here

// @route   POST /api/weighs/diy-tow-caravan-portable-single-axle/report-1
// @access  Private
router.post('/diy-tow-caravan-portable-single-axle/report-1', protect, async (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const header = payload.header && typeof payload.header === 'object' ? payload.header : {};
    const compliance = payload.compliance && typeof payload.compliance === 'object' ? payload.compliance : {};

    const weightsRecorded = payload.weightsRecorded && typeof payload.weightsRecorded === 'object' ? payload.weightsRecorded : {};
    const capacity = payload.capacity && typeof payload.capacity === 'object' ? payload.capacity : {};
    const result = payload.result && typeof payload.result === 'object' ? payload.result : {};

    const carInfo = payload.carInfo && typeof payload.carInfo === 'object' ? payload.carInfo : {};
    const advisory = payload.advisory && typeof payload.advisory === 'object' ? payload.advisory : {};
    const notes = payload.notes != null ? String(payload.notes) : '';
    const vci01 = payload.vci01 && typeof payload.vci01 === 'object' ? payload.vci01 : {};

    const resolveTemplatePath = (filename) => {
      // ...
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const templatePath = resolveTemplatePath('Portable Scales - Individual Tyre Weights.jpg');
    if (!templatePath) {
      throw new Error(`Template image not found: ${path.join(__dirname, '..', 'assets', 'Portable Scales - Individual Tyre Weights.jpg')}`);
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-1.pdf');

    doc.pipe(res);

    const logoPath = resolveTemplatePath('weighbuddy logo green background.png');
    if (logoPath) {
      try {
        doc.image(logoPath, 18, 16, { fit: [155, 52], align: 'left', valign: 'top' });
      } catch (e) {
        // ignore logo render errors
      }
    }
    // The base template contains a very large vehicle+caravan illustration.
    // If rendered full-page it sits behind the compliance table. To mirror the
    // reference layout, crop just the vehicle+caravan region and render it
    // smaller near the top.
    try {
      doc.image(templatePath, 120, 75, {
        fit: [640, 220],
        align: 'center',
        valign: 'center',
        srcRect: [0, 80, 1800, 520],
      });
    } catch (imgErr) {
      // If cropping is not supported for the image type, fall back to a smaller render.
      doc.image(templatePath, 60, 40, { fit: [720, 300], align: 'center', valign: 'top' });
    }

    const safeText = (v) => (v == null ? '' : String(v));
    const safeNum = (v) => (v == null || v === '' ? '' : String(Number(v)));
    const okText = (b) => (b === false ? 'Over' : b === true ? 'OK' : '');

    // Draw table grid + headers so the PDF mirrors the UI screenshot.
    // The background template image sometimes lacks visible borders once scaled,
    // so we explicitly draw the table structure.
    const drawTowCaravanComplianceTable = () => {
      const headers = [
        'Front Axle',
        'GVM',
        'Rear Axle',
        'TowBall (Check Advisory)',
        'ATM',
        'GTM',
        'GCM',
        'BTC',
      ];

      // Tuned to the current template placement (842x595 landscape).
      // Slightly wider columns for the long TowBall header.
      const headerY = 304;
      const headerH = 24;
      const rowH = 23;
      // Shift slightly right to prevent left-edge clipping on some PDF viewers.
      const startX = 125;
      const labelW = 118;
      // Narrow columns slightly so the full table (including BTC) fits on A4 landscape.
      const colW = [66, 66, 66, 128, 66, 66, 66, 66];

      const tableW = labelW + colW.reduce((a, b) => a + b, 0);
      const borderColor = '#9e9e9e';

      doc.save();
      doc.lineWidth(1);
      doc.strokeColor(borderColor);

      // Outer border (header + 4 rows)
      doc.rect(startX, headerY, tableW, headerH + rowH * 4).stroke();

      // Header background
      doc.fillColor('#e8f4ff');
      doc.rect(startX + labelW, headerY, tableW - labelW, headerH).fill();
      doc.fillColor('#f5f5f5');
      doc.rect(startX, headerY, labelW, headerH).fill();

      // Header cell borders + text
      doc.fillColor('#000000');
      doc.fontSize(9);
      let x = startX;
      doc.rect(x, headerY, labelW, headerH).stroke();
      x += labelW;
      headers.forEach((h, i) => {
        doc.rect(x, headerY, colW[i], headerH).stroke();
        doc.text(String(h), x + 2, headerY + 6, { width: colW[i] - 4, align: 'center' });
        x += colW[i];
      });

      // Horizontal lines for rows
      for (let r = 0; r <= 4; r += 1) {
        const y = headerY + headerH + r * rowH;
        doc.moveTo(startX, y).lineTo(startX + tableW, y).stroke();
      }

      // Vertical lines (label boundary + each column)
      let vx = startX;
      doc.moveTo(vx, headerY).lineTo(vx, headerY + headerH + rowH * 4).stroke();
      vx += labelW;
      doc.moveTo(vx, headerY).lineTo(vx, headerY + headerH + rowH * 4).stroke();
      headers.forEach((_, i) => {
        vx += colW[i];
        doc.moveTo(vx, headerY).lineTo(vx, headerY + headerH + rowH * 4).stroke();
      });

      // Row label backgrounds and text
      const rowLabels = ['Compliance', 'Weights Recorded', 'Capacity', 'Result'];
      rowLabels.forEach((label, idx) => {
        const y = headerY + headerH + idx * rowH;
        // Row background colors (approx. to UI screenshot)
        const rowBg =
          label === 'Compliance'
            ? '#cdd9ff'
            : label === 'Weights Recorded'
              ? '#fff3b0'
              : label === 'Capacity'
                ? '#eeeeee'
                : '#ffffff';

        doc.fillColor(rowBg);
        doc.rect(startX, y, labelW, rowH).fill();
        // Fill the value row background for the first three rows.
        if (label !== 'Result') {
          doc.fillColor(rowBg);
          doc.rect(startX + labelW, y, tableW - labelW, rowH).fill();
        }
        doc.strokeColor(borderColor);
        doc.rect(startX, y, labelW, rowH).stroke();
        doc.fillColor('#000000');
        doc.fontSize(9);
        doc.text(String(label), startX + 6, y + 7, { width: labelW - 12, align: 'left' });
      });

      doc.restore();
    };

    drawTowCaravanComplianceTable();

    // Keep value placement derived from the same table geometry so it never
    // shifts a column relative to the drawn grid.
    const tableGeom = {
      headerY: 304,
      headerH: 24,
      rowH: 23,
      startX: 125,
      labelW: 118,
      colW: [66, 66, 66, 128, 66, 66, 66, 66],
    };
    const valueCellCentersX = (() => {
      const xs = [];
      let x = tableGeom.startX + tableGeom.labelW;
      for (let i = 0; i < tableGeom.colW.length; i += 1) {
        xs.push(x + tableGeom.colW[i] / 2);
        x += tableGeom.colW[i];
      }
      return xs;
    })();
    const valueRowY = {
      compliance: tableGeom.headerY + tableGeom.headerH + 7,
      weights: tableGeom.headerY + tableGeom.headerH + tableGeom.rowH + 7,
      capacity: tableGeom.headerY + tableGeom.headerH + tableGeom.rowH * 2 + 7,
      result: tableGeom.headerY + tableGeom.headerH + tableGeom.rowH * 3 + 7,
    };

    // Header row positions (tuned to match the provided template)
    doc.fillColor('#000000');
    doc.fontSize(10);
    doc.text(safeText(header.date), 240, 18, { width: 90, align: 'left' });
    doc.text(safeText(header.customerName), 340, 18, { width: 170, align: 'left' });
    doc.text(safeText(header.time || ''), 520, 18, { width: 70, align: 'left' });
    doc.text(safeText(header.location || ''), 690, 18, { width: 140, align: 'left' });

    doc.text(safeText(header.carRego), 240, 42, { width: 90, align: 'left' });
    doc.text(safeText(header.carMake), 340, 42, { width: 80, align: 'left' });
    doc.text(safeText(header.carModel), 430, 42, { width: 80, align: 'left' });
    doc.text(safeText(header.caravanRego), 520, 42, { width: 80, align: 'left' });
    doc.text(safeText(header.caravanMake), 610, 42, { width: 90, align: 'left' });
    doc.text(safeText(header.caravanModel), 710, 42, { width: 90, align: 'left' });

    // Compliance table values
    // Columns: Front Axle, GVM, Rear Axle, TowBall, ATM, GTM, GCM, BTC
    // Row Y positions (Compliance, Weights Recorded, Capacity, Result)
    const drawRow = (y, values, isResult = false) => {
      values.forEach((val, idx) => {
        const cx = valueCellCentersX[idx];
        if (cx == null) return;
        const text = isResult ? safeText(val) : safeNum(val);
        const cellW = tableGeom.colW[idx] || 60;

        if (isResult) {
          // Color result cells: green for OK, red for Over.
          const isOver = String(text).toLowerCase() === 'over';
          const bg = isOver ? '#e53935' : '#1aa64b';
          const cellX = tableGeom.startX + tableGeom.labelW + tableGeom.colW
            .slice(0, idx)
            .reduce((a, b) => a + b, 0);
          const cellY = tableGeom.headerY + tableGeom.headerH + tableGeom.rowH * 3;
          doc.save();
          doc.fillColor(bg);
          doc.rect(cellX, cellY, cellW, tableGeom.rowH).fill();
          doc.restore();
          doc.fillColor('#000000');
        }

        doc.text(text, cx - cellW / 2, y, { width: cellW, align: 'center' });
      });
    };

    drawRow(valueRowY.compliance, [
      compliance.frontAxle,
      compliance.gvm,
      compliance.rearAxle,
      compliance.tbm,
      compliance.atm,
      compliance.gtm,
      compliance.gcm,
      compliance.btc,
    ]);

    drawRow(valueRowY.weights, [
      weightsRecorded.frontAxle,
      (() => {
        const hitch = vci01 && typeof vci01 === 'object' ? vci01.hitchWeigh : null;
        if (!hitch || typeof hitch !== 'object') return weightsRecorded.gvm;
        const fl = Number(hitch.frontLeft);
        const fr = Number(hitch.frontRight);
        const rl = Number(hitch.rearLeft);
        const rr = Number(hitch.rearRight);
        const nums = [fl, fr, rl, rr].filter((n) => Number.isFinite(n));
        if (nums.length < 2) return weightsRecorded.gvm;
        const sum = nums.reduce((a, b) => a + b, 0);
        return sum > 0 ? sum : weightsRecorded.gvm;
      })(),
      weightsRecorded.rearAxle,
      weightsRecorded.tbm,
      weightsRecorded.atm,
      weightsRecorded.gtm,
      weightsRecorded.gcm,
      weightsRecorded.btc,
    ]);

    drawRow(valueRowY.capacity, [
      capacity.frontAxle,
      capacity.gvm,
      capacity.rearAxle,
      capacity.tbm,
      capacity.atm,
      capacity.gtm,
      capacity.gcm,
      capacity.btc,
    ]);

    doc.fontSize(10);
    drawRow(
      valueRowY.result,
      [
        okText(result.frontAxle),
        okText(result.gvm),
        okText(result.rearAxle),
        okText(result.tbm),
        okText(result.atm),
        okText(result.gtm),
        okText(result.gcm),
        okText(result.btc),
      ],
      true
    );

    // Sections below the compliance table (Car Information, Advisory Only, Additional Notes)
    // Layout tuned for A4 landscape.
    const blocksTop = tableGeom.headerY + tableGeom.headerH + tableGeom.rowH * 4 + 20;

    const borderColor = '#bdbdbd';
    const titleBg = '#f5f5f5';

    const drawBoxTitle = (x, y, w, h, title) => {
      doc.save();
      doc.fillColor(titleBg);
      doc.rect(x, y, w, h).fillAndStroke(titleBg, borderColor);
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(String(title), x + 8, y + 6, { width: w - 16, align: 'left' });
      doc.restore();
    };

    const drawCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', fontSize = 9, color = '#000000' } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor(borderColor);
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(fontSize);
      doc.text(String(text ?? ''), x + 6, y + 6, { width: w - 12, align });
      doc.restore();
    };

    // Car Information block
    const carX = 70;
    const carY = blocksTop;
    const carW = 250;
    const titleH = 22;
    const rowH = 20;
    drawBoxTitle(carX, carY, carW, titleH, 'Car Information');

    const carTableY = carY + titleH;
    const labelW = 120;
    const valueW = carW - labelW;
    drawCell(carX, carTableY, labelW, rowH, 'Fuel');
    drawCell(carX + labelW, carTableY, valueW, rowH, carInfo.fuelLevel != null ? `${carInfo.fuelLevel}%` : '-');
    drawCell(carX, carTableY + rowH, labelW, rowH, 'Passengers');
    drawCell(carX + labelW, carTableY + rowH, valueW / 2, rowH, 'Front', { align: 'center' });
    drawCell(carX + labelW + valueW / 2, carTableY + rowH, valueW / 2, rowH, 'Rear', { align: 'center' });
    drawCell(carX + labelW, carTableY + rowH * 2, valueW / 2, rowH, carInfo.passengersFront ?? '-', { align: 'center' });
    drawCell(carX + labelW + valueW / 2, carTableY + rowH * 2, valueW / 2, rowH, carInfo.passengersRear ?? '-', { align: 'center' });

    // Advisory Only block
    const advX = carX + carW + 40;
    const advY = blocksTop;
    const advW = 260;
    drawBoxTitle(advX, advY, advW, titleH, 'Advisory Only');
    const advTableY = advY + titleH;
    const advRowH = 22;
    const advLabelW = 200;
    const advValW = advW - advLabelW;

    const pctVal = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
    const advisoryCellColor = (pct, okIfGte) => {
      if (pct == null) return '#eeeeee';
      return pct >= okIfGte ? '#1aa64b' : '#e53935';
    };

    const vanToCar = pctVal(advisory.vanToCarRatioPct);
    drawCell(advX, advTableY, advLabelW, advRowH, 'Trailer / Caravan to Car Ratio <85%');
    drawCell(
      advX + advLabelW,
      advTableY,
      advValW,
      advRowH,
      vanToCar == null ? '-' : `${Math.round(vanToCar)}%`,
      { bg: advisoryCellColor(vanToCar, 85), align: 'center', color: '#ffffff' }
    );

    const towBallPct = pctVal(advisory.towBallPct);
    drawCell(advX, advTableY + advRowH, advLabelW, advRowH, 'Towball % (8% to 12%)');
    const towBallOk = towBallPct != null && towBallPct >= 8 && towBallPct <= 12;
    drawCell(
      advX + advLabelW,
      advTableY + advRowH,
      advValW,
      advRowH,
      towBallPct == null ? '-' : `${Math.round(towBallPct)}%`,
      { bg: towBallOk ? '#1aa64b' : '#e53935', align: 'center', color: '#ffffff' }
    );

    const btcPct = pctVal(advisory.btcPct);
    drawCell(advX, advTableY + advRowH * 2, advLabelW, advRowH, 'Braked Towing Capacity Ratio <80%');
    drawCell(
      advX + advLabelW,
      advTableY + advRowH * 2,
      advValW,
      advRowH,
      btcPct == null ? '-' : `${Math.round(btcPct)}%`,
      { bg: advisoryCellColor(btcPct, 80), align: 'center', color: '#ffffff' }
    );

    // Additional Notes block
    const notesX = advX + advW + 40;
    const notesY = blocksTop;
    const notesW = 300;
    drawBoxTitle(notesX, notesY, notesW, titleH, 'Additional Notes');
    const notesBodyY = notesY + titleH;
    const notesBodyH = 3 * advRowH;
    const notesPadL = 8;
    const notesPadR = 18;
    doc.save();
    doc.strokeColor(borderColor);
    doc.rect(notesX, notesBodyY, notesW, notesBodyH).stroke();
    doc.fillColor('#000000');
    doc.fontSize(9);
    doc.text(notes && notes.trim() !== '' ? notes : '-', notesX + notesPadL, notesBodyY + 8, {
      width: notesW - notesPadL - notesPadR,
      height: notesBodyH - 16,
    });
    doc.restore();

    doc.end();
  } catch (error) {
    console.error('DIY tow+caravan portable single-axle report-1 error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    } else {
      res.end();
    }
  }
});

// @desc    Generate PDF report part 2 for DIY Tow Vehicle + Caravan (Portable Scales, Single Axle)
// @route   POST /api/weighs/diy-tow-caravan-portable-single-axle/report-2
// @access  Private
router.post('/diy-tow-caravan-portable-single-axle/report-2', protect, async (req, res) => {
  try {
    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const templateAPath = resolveTemplatePath('Portable Scales - Individual Tyre Weights-a.jpg');
    const templateBPath = resolveTemplatePath('Portable Scales - Individual Tyre Weights-b.jpg');
    if (!templateAPath) {
      throw new Error(`Template image not found: ${path.join(__dirname, '..', 'assets', 'Portable Scales - Individual Tyre Weights-a.jpg')}`);
    }
    if (!templateBPath) {
      throw new Error(`Template image not found: ${path.join(__dirname, '..', 'assets', 'Portable Scales - Individual Tyre Weights-b.jpg')}`);
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-2.pdf');

    doc.pipe(res);

    const logoPath = resolveTemplatePath('weighbuddy logo green background.png');
    if (logoPath) {
      try {
        doc.image(logoPath, 18, 16, { fit: [155, 52], align: 'left', valign: 'top' });
      } catch (e) {
        // ignore logo render errors
      }
    }

    const payload = req.body || {};
    const header = payload.header || {};
    const compliance = payload.compliance || {};
    const weightsRecorded = payload.weightsRecorded || {};
    const capacity = payload.capacity || {};
    const result = payload.result || {};
    const carInfo = payload.carInfo || {};
    const notes = payload.notes || '';
    const vci01 = payload.vci01 || {};

    const borderColor = '#bdbdbd';
    const titleBg = '#f5f5f5';

    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const fmtKg = (v) => {
      const n = safeNum(v);
      return n == null ? '-' : `${Math.round(n)} kg`;
    };

    const okText = (ok) => (ok ? 'OK' : 'Over');

    const drawCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', fontSize = 9, color = '#000000', padL = 6, padR = 6 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor(borderColor);
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(fontSize);
      doc.text(String(text ?? ''), x + padL, y + 6, { width: w - padL - padR, align });
      doc.restore();
    };

    const headerX = 210;
    const headerY = 18;
    const headerW = 600;
    const headerRowH = 22;
    const headerRow2H = 22;

    doc.save();
    doc.strokeColor(borderColor);
    doc.rect(headerX, headerY, headerW, headerRowH + headerRow2H).stroke();
    doc.restore();

    const cols1 = [110, 190, 110, 190];
    const labels1 = ['Date', 'Customer Name', 'Time', 'Location'];
    const values1 = [header.date || '', header.customerName || '', header.time || '', header.location || ''];
    let cx = headerX;
    for (let i = 0; i < cols1.length; i += 1) {
      drawCell(cx, headerY, cols1[i], headerRowH, labels1[i], { bg: titleBg, fontSize: 8 });
      drawCell(cx, headerY + headerRowH, cols1[i], headerRow2H, values1[i], { fontSize: 9 });
      cx += cols1[i];
    }

    const row2Y = headerY + headerRowH + headerRow2H + 2;
    // Row 2: display only Car Rego + Make (description). Model is intentionally omitted.
    const row2Cols = [110, 380, 110];
    const row2Labels = ['Car Rego', 'Make', ''];
    const resolvedCarRego =
      header.carRego ||
      header.rego ||
      header.vehicleNumberPlate ||
      payload.vehicleNumberPlate ||
      payload.rego ||
      '';
    const resolvedCarMake =
      header.carMake ||
      header.make ||
      header.vehicleDescription ||
      payload.vehicleDescription ||
      payload.description ||
      '';
    const row2Values = [resolvedCarRego, resolvedCarMake, ''];
    cx = headerX;
    for (let i = 0; i < row2Cols.length; i += 1) {
      if (row2Labels[i] !== '') {
        drawCell(cx, row2Y, row2Cols[i], headerRowH, row2Labels[i], { bg: titleBg, fontSize: 8 });
        drawCell(cx, row2Y + headerRowH, row2Cols[i], headerRow2H, row2Values[i], { fontSize: 9 });
      } else {
        drawCell(cx, row2Y, row2Cols[i], headerRowH + headerRow2H, '', { bg: '#ffffff' });
      }
      cx += row2Cols[i];
    }

    const sideImgX = 90;
    // Keep clear space below the header grid so Car Rego / Make row is unobstructed.
    const sideImgY = 120;
    doc.image(templateAPath, sideImgX, sideImgY, { fit: [430, 140], align: 'left', valign: 'top' });

    const topImgX = 560;
    const topImgY = 125;
    doc.image(templateBPath, topImgX, topImgY, { fit: [230, 290], align: 'left', valign: 'top' });

    const tyre = (vci01 && vci01.hitchWeigh) || {};
    doc.save();
    doc.fillColor('#000000');
    doc.fontSize(10);
    doc.text(fmtKg(tyre.frontLeft), topImgX - 95, topImgY + 85, { width: 90, align: 'right' });
    doc.text(fmtKg(tyre.rearLeft), topImgX - 95, topImgY + 205, { width: 90, align: 'right' });
    doc.text(fmtKg(tyre.frontRight), topImgX + 245, topImgY + 85, { width: 90, align: 'left' });
    doc.text(fmtKg(tyre.rearRight), topImgX + 245, topImgY + 205, { width: 90, align: 'left' });
    doc.restore();

    const tableX = 135;
    const tableY = 270;
    const tableW = 370;
    const labelW = 110;
    const colW = (tableW - labelW) / 3;
    const headerH = 22;
    const rowH = 22;
    const headers = ['Rear Axle', 'GVM', 'Front Axle'];

    drawCell(tableX, tableY, labelW, headerH, '', { bg: titleBg, align: 'center', fontSize: 8 });
    for (let i = 0; i < 3; i += 1) {
      drawCell(tableX + labelW + i * colW, tableY, colW, headerH, headers[i], { bg: '#e8f4ff', align: 'center', fontSize: 8 });
    }

    const rowLabels = ['Compliance', 'Weights Recorded', 'Capacity', 'Result'];
    const rowBg = ['#cdd9ff', '#fff3b0', '#eeeeee', '#ffffff'];
    const vals = [
      [compliance.rearAxle, compliance.gvm, compliance.frontAxle],
      [weightsRecorded.rearAxle, weightsRecorded.gvm, weightsRecorded.frontAxle],
      [capacity.rearAxle, capacity.gvm, capacity.frontAxle],
      [okText(result.rearAxle), okText(result.gvm), okText(result.frontAxle)],
    ];

    for (let r = 0; r < rowLabels.length; r += 1) {
      const y = tableY + headerH + r * rowH;
      drawCell(tableX, y, labelW, rowH, rowLabels[r], { bg: rowBg[r], fontSize: 9 });
      for (let c = 0; c < 3; c += 1) {
        const isResult = rowLabels[r] === 'Result';
        const ok = c === 0 ? result.rearAxle : c === 1 ? result.gvm : result.frontAxle;
        const bg =
          isResult
            ? ok
              ? '#1aa64b'
              : '#e53935'
            : rowBg[r];
        const color = isResult ? '#ffffff' : '#000000';
        const text = isResult ? vals[r][c] : fmtKg(vals[r][c]).replace(' kg', '');
        drawCell(tableX + labelW + c * colW, y, colW, rowH, text, { bg, align: 'center', fontSize: 9, color });
      }
    }

    const blocksTop = 455;
    const titleH = 22;

    const drawBoxTitle = (x, y, w, h, title) => {
      doc.save();
      doc.fillColor(titleBg);
      doc.rect(x, y, w, h).fillAndStroke(titleBg, borderColor);
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(String(title), x + 8, y + 6, { width: w - 16, align: 'left' });
      doc.restore();
    };

    const carX = 70;
    const carY = blocksTop;
    const carW = 260;
    drawBoxTitle(carX, carY, carW, titleH, 'Car Information');
    const carTableY = carY + titleH;
    const infoRowH = 22;
    const infoLabelW = 120;
    drawCell(carX, carTableY, infoLabelW, infoRowH, 'Fuel');
    drawCell(carX + infoLabelW, carTableY, carW - infoLabelW, infoRowH, carInfo.fuelLevel != null ? `${carInfo.fuelLevel}%` : '-');
    drawCell(carX, carTableY + infoRowH, infoLabelW, infoRowH, 'Passengers');
    drawCell(carX + infoLabelW, carTableY + infoRowH, (carW - infoLabelW) / 2, infoRowH, 'Front', { align: 'center' });
    drawCell(carX + infoLabelW + (carW - infoLabelW) / 2, carTableY + infoRowH, (carW - infoLabelW) / 2, infoRowH, 'Rear', { align: 'center' });
    drawCell(carX + infoLabelW, carTableY + infoRowH * 2, (carW - infoLabelW) / 2, infoRowH, carInfo.passengersFront ?? '-', { align: 'center' });
    drawCell(
      carX + infoLabelW + (carW - infoLabelW) / 2,
      carTableY + infoRowH * 2,
      (carW - infoLabelW) / 2,
      infoRowH,
      carInfo.passengersRear ?? '-',
      { align: 'center' }
    );

    const notesX = carX + carW + 40;
    const notesY = blocksTop;
    const notesW = 520;
    drawBoxTitle(notesX, notesY, notesW, titleH, 'Additional Notes');
    const notesBodyY = notesY + titleH;
    const notesBodyH = infoRowH * 3;
    const notesPadL = 8;
    const notesPadR = 18;
    doc.save();
    doc.strokeColor(borderColor);
    doc.rect(notesX, notesBodyY, notesW, notesBodyH).stroke();
    doc.fillColor('#000000');
    doc.fontSize(9);
    doc.text(notes && String(notes).trim() !== '' ? String(notes) : '-', notesX + notesPadL, notesBodyY + 8, {
      width: notesW - notesPadL - notesPadR,
      height: notesBodyH - 16,
    });
    doc.restore();

    doc.end();
  } catch (error) {
    console.error('DIY tow+caravan portable single-axle report-2 error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    } else {
      res.end();
    }
  }
});

// @desc    Generate PDF report part 3 for DIY Tow Vehicle + Caravan (Portable Scales, Single Axle)
// @route   POST /api/weighs/diy-tow-caravan-portable-single-axle/report-3
// @access  Private
router.post('/diy-tow-caravan-portable-single-axle/report-3', protect, async (req, res) => {
  try {
    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const templatePath = resolveTemplatePath('Portable Scales - Individual Tyre Weights-c.jpg');
    if (!templatePath) {
      throw new Error(`Template image not found: ${path.join(__dirname, '..', 'assets', 'Portable Scales - Individual Tyre Weights-c.jpg')}`);
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-3.pdf');

    doc.pipe(res);

    const payload = req.body || {};
    const header = payload.header || {};
    const notes = payload.notes || '';
    const vci01 = payload.vci01 || {};
    const tyreWeigh = payload.tyreWeigh || null;

    const borderColor = '#bdbdbd';
    const titleBg = '#efefef';
    const lightBg = '#f7f7f7';
    const textColor = '#000000';

    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const fmtKg = (v) => {
      const n = safeNum(v);
      return n == null ? '-' : `${Math.round(n)} kg`;
    };

    const drawCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', fontSize = 9, color = textColor, padL = 6, padR = 6 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor(borderColor);
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(fontSize);
      doc.text(String(text ?? ''), x + padL, y + 6, { width: w - padL - padR, align, ellipsis: true });
      doc.restore();
    };

    // Background
    doc.save();
    doc.fillColor('#ffffff');
    doc.rect(0, 0, 842, 595).fill();
    doc.restore();

    // Header strip with logo placeholder + 2-row info grid
    const headerTop = 26;
    const logoX = 35;
    const logoY = headerTop;
    const logoW = 165;
    const logoH = 62;
    let logoRendered = false;
    const report3LogoPath = resolveTemplatePath('weighbuddy logo green background.png');
    if (report3LogoPath) {
      try {
        doc.image(report3LogoPath, logoX, logoY, { fit: [logoW, logoH], align: 'left', valign: 'top' });
        logoRendered = true;
      } catch (e) {
        logoRendered = false;
      }
    }

    if (!logoRendered) {
      doc.save();
      doc.strokeColor(borderColor);
      doc.rect(logoX, logoY, logoW, logoH).stroke();
      doc.fontSize(9);
      doc.fillColor('#333333');
      doc.text('Weighbuddy logo for DIY,\nAllow professional and\nfleet to add logo here', logoX + 10, logoY + 10, {
        width: logoW - 20,
        height: logoH - 20,
      });
      doc.restore();
    }

    const gridX = logoX + logoW + 20;
    const gridY = headerTop;
    const gridW = 842 - gridX - 35;
    const labelH = 18;
    const valueH = 22;

    // Row 1
    const row1Cols = [110, 220, 110, gridW - 110 - 220 - 110];
    const row1Labels = ['Date', 'Customer Name', 'Time', 'Location'];
    const row1Values = [header.date || '', header.customerName || '', header.time || '', header.location || ''];
    let cx = gridX;
    for (let i = 0; i < row1Cols.length; i += 1) {
      drawCell(cx, gridY, row1Cols[i], labelH, row1Labels[i], { bg: titleBg, fontSize: 8 });
      drawCell(cx, gridY + labelH, row1Cols[i], valueH, row1Values[i], { fontSize: 9 });
      cx += row1Cols[i];
    }

    // Row 2 (Car + Trailer fields)
    const row2Y = gridY + labelH + valueH;
    const row2Cols = [110, 170, 170, 110, 170, gridW - (110 + 170 + 170 + 110 + 170)];
    const row2Labels = ['Car Rego', 'Make', 'Model', 'Trailer Rego', 'Make', 'Model'];
    const row2Values = [
      header.carRego || '',
      header.carMake || '',
      header.carModel || '',
      header.caravanRego || '',
      header.caravanMake || '',
      header.caravanModel || '',
    ];
    cx = gridX;
    for (let i = 0; i < row2Cols.length; i += 1) {
      drawCell(cx, row2Y, row2Cols[i], labelH, row2Labels[i], { bg: titleBg, fontSize: 8 });
      drawCell(cx, row2Y + labelH, row2Cols[i], valueH, row2Values[i], { fontSize: 9 });
      cx += row2Cols[i];
    }

    // Diagram image
    const diagramX = 150;
    const diagramY = 135;
    const diagramW = 540;
    const diagramH = 175;
    doc.image(templatePath, diagramX, diagramY, { fit: [diagramW, diagramH], align: 'center', valign: 'center' });

    // Weight overlays
    const hitchWeigh = (vci01 && vci01.hitchWeigh) || {};
    const carFR = hitchWeigh.frontRight;
    const carRR = hitchWeigh.rearRight;
    const carFL = hitchWeigh.frontLeft;
    const carRL = hitchWeigh.rearLeft;

    const caravanLeft = tyreWeigh?.single?.left;
    const caravanRight = tyreWeigh?.single?.right;

    const carLeftTotal = (safeNum(carFL) || 0) + (safeNum(carRL) || 0);
    const carRightTotal = (safeNum(carFR) || 0) + (safeNum(carRR) || 0);
    const vanLeftTotal = safeNum(caravanLeft) || 0;
    const vanRightTotal = safeNum(caravanRight) || 0;

    // Car tyre numbers (positions tuned to template)
    doc.save();
    doc.fillColor('#000000');
    doc.fontSize(10);
    // Right side values
    doc.text(fmtKg(carFR), diagramX + 58, diagramY + 32, { width: 80, align: 'center' });
    doc.text(fmtKg(carRR), diagramX + 165, diagramY + 32, { width: 80, align: 'center' });
    // Left side values
    doc.text(fmtKg(carFL), diagramX + 58, diagramY + 137, { width: 80, align: 'center' });
    doc.text(fmtKg(carRL), diagramX + 165, diagramY + 137, { width: 80, align: 'center' });

    // Trailer left/right values (near trailer text)
    doc.text(fmtKg(vanRightTotal), diagramX + 410, diagramY + 40, { width: 90, align: 'center' });
    doc.text(fmtKg(vanLeftTotal), diagramX + 410, diagramY + 135, { width: 90, align: 'center' });
    doc.restore();

    // Left/Right KG boxes
    const boxW = 70;
    const boxH = 48;
    const boxPad = 10;

    const drawKgStack = (x, y, rightKg, leftKg) => {
      drawCell(x, y, boxW, boxH, `Right KG\n${Math.round(rightKg || 0)}`, { bg: titleBg, align: 'center', fontSize: 9, padL: boxPad, padR: boxPad });
      drawCell(x, y + boxH, boxW, boxH, `Left KG\n${Math.round(leftKg || 0)}`, { bg: titleBg, align: 'center', fontSize: 9, padL: boxPad, padR: boxPad });
    };

    // Car stacks (left of car)
    drawKgStack(60, diagramY + 25, carRightTotal, carLeftTotal);
    // Trailer stacks (right of trailer)
    drawKgStack(842 - 60 - boxW, diagramY + 25, vanRightTotal, vanLeftTotal);

    // Middle helper text (very small, light)
    doc.save();
    doc.fillColor('#777777');
    doc.fontSize(7);
    doc.text('Right kg split between tyres', 60, diagramY + 25 + boxH - 12, { width: boxW, align: 'center' });
    doc.text('Right kg split between tyres', 842 - 60 - boxW, diagramY + 25 + boxH - 12, { width: boxW, align: 'center' });
    doc.restore();

    // Additional Notes block
    const notesX = 35;
    const notesY = 350;
    const notesW = 842 - 70;
    const notesTitleH = 22;
    const notesBodyH = 160;

    drawCell(notesX, notesY, notesW, notesTitleH, 'Additional Notes', { bg: titleBg, fontSize: 10 });
    doc.save();
    doc.fillColor(lightBg);
    doc.rect(notesX, notesY + notesTitleH, notesW, notesBodyH).fill();
    doc.strokeColor(borderColor);
    doc.rect(notesX, notesY + notesTitleH, notesW, notesBodyH).stroke();
    doc.fillColor('#000000');
    doc.fontSize(10);
    doc.text(notes && String(notes).trim() !== '' ? String(notes) : '-', notesX + 10, notesY + notesTitleH + 10, {
      width: notesW - 20,
      height: notesBodyH - 20,
    });
    doc.restore();

    // Footer
    const footerY = 575;
    doc.save();
    doc.fillColor('#000000');
    doc.fontSize(10);
    doc.text('powered by weighbuddy', 0, footerY, { width: 842, align: 'center' });
    doc.fontSize(9);
    doc.text('help - FAQ', 600, footerY, { width: 100, align: 'left' });
    doc.text('Terms and Conditions', 690, footerY, { width: 150, align: 'left' });
    doc.restore();

    doc.end();
  } catch (error) {
    console.error('DIY tow+caravan portable single-axle report-3 error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    } else {
      res.end();
    }
  }
});

// @route   GET /api/weighs
// @access  Private
router.get('/', protect, async (req, res) => {
  console.log(' GENERAL WEIGHS ROUTE HIT - User:', req.user.email);
  console.log(' Query params:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const { search, status, compliance } = req.query;

    // Base ownership/visibility filter
    const ownershipFilter =
      req.user.userType === 'fleet'
        ? {
            $or: [
              { fleetOwnerUserId: req.user.id },
              // Backwards compatibility for older fleet weighs created before
              // fleetOwnerUserId existed.
              { userId: req.user.id },
            ],
          }
        : req.user.userType === 'diy'
          ? {
              // DIY users (including those created as fleet staff clients) should
              // see both their own DIY weighs and any weighs where they are the
              // linked clientUserId (e.g. fleet-created weighs for them).
              $or: [{ userId: req.user.id }, { clientUserId: req.user.id }],
            }
          : { userId: req.user.id };

    const filters = [ownershipFilter];

    // Text search across common fields (case-insensitive)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      filters.push({
        $or: [
          { customerName: regex },
          { customerEmail: regex },
          { customerPhone: regex },
          { vehicleNumberPlate: regex },
          { caravanNumberPlate: regex },
        ],
      });
    }

    // Status filter (e.g. completed, draft, archived)
    if (status && typeof status === 'string' && status !== 'all') {
      filters.push({ status });
    }

    // Compliance filter: compliant / non-compliant
    if (compliance && typeof compliance === 'string' && compliance !== 'all') {
      const isCompliant = compliance === 'compliant';
      filters.push({
        $or: [
          { 'complianceResults.overallCompliant': isCompliant },
          { 'compliance.overallCompliant': isCompliant },
        ],
      });
    }

    const weighsQuery = filters.length > 1 ? { $and: filters } : ownershipFilter;

    const weighs = await Weigh.find(weighsQuery)
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .populate('clientUserId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Weigh.countDocuments(weighsQuery);

    // Normalize customer details for history consumers so that professional
    // flows with an attached DIY client show the end-customer consistently
    // in the table, regardless of which route created the record.
    const normalizedWeighs = weighs.map((w) => {
      const obj = w.toObject({ virtuals: true });

      if (w.clientUserId) {
        const client = w.clientUserId;
        obj.customer = {
          name: client.name || obj.customerName || 'N/A',
          email: client.email || obj.customerEmail || 'unknown@example.com',
          phone: client.phone || obj.customerPhone || 'N/A',
        };
      } else {
        obj.customer = {
          name: obj.customerName || 'N/A',
          email: obj.customerEmail || 'unknown@example.com',
          phone: obj.customerPhone || 'N/A',
        };
      }

      return obj;
    });

    res.json({
      success: true,
      count: normalizedWeighs.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      weighs: normalizedWeighs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get weigh statistics
// @route   GET /api/weighs/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await Weigh.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(String(req.user._id))
        }
      },
      {
        $group: {
          _id: null,
          totalWeighs: { $sum: 1 },
          totalRevenue: { $sum: '$payment.amount' },
          compliantWeighs: {
            $sum: {
              $cond: [
                { $in: ['$complianceResults.overallCompliant', [true, 'true', 1]] },
                1,
                0
              ]
            }
          },
          nonCompliantWeighs: {
            $sum: {
              $cond: [
                { $in: ['$complianceResults.overallCompliant', [false, 'false', 0]] },
                1,
                0
              ]
            }
          },
          avgCompliance: {
            $avg: {
              $cond: [
                { $in: ['$complianceResults.overallCompliant', [true, 'true', 1]] },
                100,
                0
              ]
            }
          }
        }
      }
    ]);

    const monthlyStats = await Weigh.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(String(req.user._id)),
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          monthlyWeighs: { $sum: 1 },
          monthlyRevenue: { $sum: '$payment.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalWeighs: 0,
        totalRevenue: 0,
        compliantWeighs: 0,
        nonCompliantWeighs: 0,
        avgCompliance: 0
      },
      monthlyStats: monthlyStats[0] || {
        monthlyWeighs: 0,
        monthlyRevenue: 0
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


// @desc    Get single weigh entry
// @route   GET /api/weighs/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('GET /api/weighs/:id', { id: req.params.id, userId: req.user?.id });
    const weigh = await Weigh.findById(req.params.id)
      .populate('vehicleRegistryId')
      .populate('caravanRegistryId')
      .populate('vehicle')
      .populate('caravan')
      .populate('userId', 'name email userType');

    if (!weigh) {
      console.log('GET /api/weighs/:id not found', { id: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry, is admin, or (fleet manager) owns the company
    const weighUserId = weigh.userId?._id?.toString?.() || weigh.userId?.toString?.();
    const weighFleetOwnerId = weigh.fleetOwnerUserId?.toString?.() || null;
    const weighClientUserId = weigh.clientUserId?.toString?.() || null;
    console.log('GET /api/weighs/:id ownership check', {
      weighUserId,
      weighFleetOwnerId,
      weighClientUserId,
      requesterId: req.user?.id,
      requesterType: req.user?.userType,
      requesterFleetOwnerUserId: req.user?.fleetOwnerUserId?.toString?.() || null
    });

    const isDirectOwner = weighUserId === req.user.id;
    const isClientOwner = weighClientUserId && weighClientUserId === req.user.id;
    const isAdmin = req.user.userType === 'admin';
    const isFleetCompanyOwner = req.user.userType === 'fleet' && weighFleetOwnerId && weighFleetOwnerId === req.user.id;

    if (!isDirectOwner && !isClientOwner && !isAdmin && !isFleetCompanyOwner) {
      console.log('GET /api/weighs/:id unauthorized', { id: req.params.id, requesterId: req.user?.id });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this weigh entry'
      });
    }

    res.json({
      success: true,
      weigh
    });
  } catch (error) {
    console.error('GET /api/weighs/:id error', { id: req.params.id, err: error?.message, stack: error?.stack });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Generate PDF report for weigh entry
// @route   GET /api/weighs/:id/report
// @access  Private
router.get('/:id/report', protect, async (req, res) => {
  try {
    console.log('GET /api/weighs/:id/report', { id: req.params.id, userId: req.user?.id });
    const weigh = await Weigh.findById(req.params.id)
      .populate('vehicleRegistryId')
      .populate('caravanRegistryId')
      .populate('userId', 'name email userType')
      .populate('clientUserId', 'name email userType');

    if (!weigh) {
      console.log('GET /api/weighs/:id/report not found', { id: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry, is the linked client, is admin, or (fleet manager) owns the company
    const weighUserId = weigh.userId?._id?.toString?.() || weigh.userId?.toString?.();
    const weighFleetOwnerId = weigh.fleetOwnerUserId?.toString?.() || null;
    const weighClientUserId = weigh.clientUserId?.toString?.() || null;

    const isDirectOwner = weighUserId === req.user.id;
    const isClientOwner = weighClientUserId && weighClientUserId === req.user.id;
    const isAdmin = req.user.userType === 'admin';
    const isFleetCompanyOwner = req.user.userType === 'fleet' && weighFleetOwnerId && weighFleetOwnerId === req.user.id;

    console.log('GET /api/weighs/:id/report ownership check', {
      weighUserId,
      weighFleetOwnerId,
      weighClientUserId,
      requesterId: req.user?.id,
      requesterType: req.user?.userType,
    });

    if (!isDirectOwner && !isClientOwner && !isAdmin && !isFleetCompanyOwner) {
      console.log('GET /api/weighs/:id/report unauthorized', { id: req.params.id, requesterId: req.user?.id });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this weigh entry'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 18 });
    console.log('Creating PDF document', { id: weigh._id });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=weigh-report-${weigh._id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header attribution (who generated it + who it is for)
    const generatedByLabel = weigh.userId
      ? `${weigh.userId.name || '-'} (${weigh.userId.email || '-'})`
      : '-';
    const generatedByType = weigh.userId?.userType || '-';

    const reportForLabel = weigh.clientUserId
      ? `${weigh.clientUserId.name || '-'} (${weigh.clientUserId.email || '-'})`
      : `${weigh.customerName || '-'} (${weigh.customerEmail || '-'})`;
    const reportForType = weigh.clientUserId?.userType || 'customer';

    doc.save();
    doc.fillColor('#111');
    doc.fontSize(10).text('WeighBuddy • Caravan Compliance Report', 18, 12, { align: 'left' });
    doc.fontSize(8);
    doc.text(`Generated by: ${generatedByLabel} [${generatedByType}]`, 18, 28, { align: 'left' });
    doc.text(`Report for: ${reportForLabel} [${reportForType}]`, 18, 40, { align: 'left' });
    doc.text(`Report ID: ${weigh._id}`, 560, 28, { align: 'left' });
    doc.text(`Date: ${new Date(weigh.createdAt).toLocaleDateString()}`, 560, 40, { align: 'left' });
    doc.restore();

    const w = weigh.weights || {};
    const vd = weigh.vehicleData || weigh.vehicle || {};
    const cd = weigh.caravanData || weigh.caravan || {};
    const frontAxleMeasured = w.frontAxle || 0;
    const rearAxleMeasured = w.rearAxle || 0;
    const vehicleOnly = w.totalVehicle || weigh.vehicleWeightUnhitched || 0;
    const caravanOnly = w.totalCaravan || weigh.caravanWeight || 0;
    const gcmMeasured = w.grossCombination || 0;
    const tbmMeasured = w.tbm || weigh.towBallWeight || Math.max(0, gcmMeasured - vehicleOnly);
    const gtmMeasured = caravanOnly || 0;
    const atmMeasured = (caravanOnly || 0) + (tbmMeasured || 0);
    const values = {
      frontAxleLimit: vd.fawr || 0,
      frontAxleMeasured,
      gvmLimit: vd.gvm || 0,
      gvmMeasured: vehicleOnly,
      rearAxleLimit: vd.rawr || 0,
      rearAxleMeasured,
      tbmLimit: vd.btc ? vd.btc * 0.1 : 0,
      tbmMeasured,
      gtmLimit: cd.gtm || 0,
      gtmMeasured,
      atmLimit: cd.atm || 0,
      atmMeasured,
      btcLimit: vd.btc || 0,
      btcMeasured: caravanOnly || 0
    };
    console.log('Report values', values);
    console.log('Rendering exact landscape');
    drawExactLandscape(doc, values);
    console.log('Rendered exact landscape');
    await Weigh.findByIdAndUpdate(weigh._id, { reportGenerated: true, reportUrl: `/api/weighs/${weigh._id}/report` });
    doc.end();
    console.log('PDF generation done', { id: weigh._id });
    return;

    // Header band
    const headerY = 20;
    doc
      .rect(0, headerY, doc.page.width, 40)
      .fill('#f5f5f5');
    doc
      .fill('#000')
      .fontSize(20)
      .text('WeighBuddy • Caravan Compliance Report', 36, headerY + 10, { align: 'left' });

    doc.moveDown(2);

    // Report meta
    const metaY = 70;
    doc.fontSize(10);
    doc.text(`Report ID: ${weigh._id}`, 36, metaY);
    doc.text(`Date: ${new Date(weigh.createdAt).toLocaleDateString()}`, 200, metaY);
    doc.text(`Customer: ${weigh.customerName || weigh.customer?.name || '-'}`, 36, metaY + 14);
    doc.text(`Phone: ${weigh.customerPhone || weigh.customer?.phone || '-'}`, 200, metaY + 14);
    doc.text(`Email: ${weigh.customerEmail || weigh.customer?.email || '-'}`, 36, metaY + 28);

    // Vehicle/Caravan summary cards
    const cardTop = metaY + 55;
    const leftCardX = 36;
    const rightCardX = doc.page.width / 2 + 6;
    const cardW = doc.page.width / 2 - 42;
    const cardH = 110;

    // Vehicle card
    doc.roundedRect(leftCardX, cardTop, cardW, cardH, 6).stroke('#bdbdbd');
    doc.fontSize(12).text('Vehicle', leftCardX + 10, cardTop + 8);
    doc.fontSize(10);
    doc.text(`Make/Model: ${weigh.vehicleData?.make || ''} ${weigh.vehicleData?.model || ''}`, leftCardX + 10, cardTop + 26);
    doc.text(`Year: ${weigh.vehicleData?.year || '-'}`, leftCardX + 10, cardTop + 40);
    doc.text(`Number Plate: ${weigh.vehicleData?.numberPlate || '-'}`, leftCardX + 10, cardTop + 54);
    doc.text(`GVM limit: ${weigh.vehicleData?.gvm || 0} kg`, leftCardX + 10, cardTop + 68);

    // Caravan card
    doc.roundedRect(rightCardX, cardTop, cardW, cardH, 6).stroke('#bdbdbd');
    doc.fontSize(12).text('Caravan', rightCardX + 10, cardTop + 8);
    doc.fontSize(10);
    doc.text(`Make/Model: ${weigh.caravanData?.make || ''} ${weigh.caravanData?.model || ''}`, rightCardX + 10, cardTop + 26);
    doc.text(`Year: ${weigh.caravanData?.year || '-'}`, rightCardX + 10, cardTop + 40);
    doc.text(`Number Plate: ${weigh.caravanData?.numberPlate || '-'}`, rightCardX + 10, cardTop + 54);
    doc.text(`ATM limit: ${weigh.caravanData?.atm || 0} kg`, rightCardX + 10, cardTop + 68);
    doc.text(`GTM limit: ${weigh.caravanData?.gtm || 0} kg`, rightCardX + 10, cardTop + 82);

    // Helper to draw status chip
    const drawStatus = (x, y, ok, labelOk = 'OK', labelBad = 'OVER') => {
      const text = ok ? labelOk : labelBad;
      const fill = ok ? '#e8f5e9' : '#ffebee';
      const stroke = ok ? '#66bb6a' : '#ef5350';
      doc.save();
      doc.roundedRect(x, y, 46, 16, 8).fillAndStroke(fill, stroke);
      doc.fill('#000').fontSize(9).text(text, x, y + 3, { width: 46, align: 'center' });
      doc.restore();
    };

    // Compliance comparison table
    const tableTop = cardTop + cardH + 20;
    doc.fontSize(12).text('Compliance Summary', 36, tableTop - 18);

    const rows = [
      {
        name: 'GVM',
        actual: weigh.vehicleWeightUnhitched || 0,
        limit: weigh.vehicleData?.gvm || 0,
        ok: (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0)
      },
      {
        name: 'TBM',
        actual: weigh.towBallWeight || 0,
        limit: weigh.vehicleData?.btc * 0.1 || 0, // 10% of BTC as TBM limit
        ok: (weigh.towBallWeight || 0) <= (weigh.vehicleData?.btc * 0.1 || 0)
      },
      {
        name: 'BTC',
        actual: weigh.caravanWeight || 0,
        limit: weigh.vehicleData?.btc || 0,
        ok: (weigh.caravanWeight || 0) <= (weigh.vehicleData?.btc || 0)
      },
      {
        name: 'ATM',
        actual: (weigh.caravanWeight || 0) + (weigh.towBallWeight || 0),
        limit: weigh.caravanData?.atm || 0,
        ok: ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)) <= (weigh.caravanData?.atm || 0)
      },
      {
        name: 'GCM',
        actual: (weigh.vehicleWeightUnhitched || 0) + ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)),
        limit: weigh.vehicleData?.gcm || 0,
        ok: ((weigh.vehicleWeightUnhitched || 0) + ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0))) <= (weigh.vehicleData?.gcm || 0)
      }
    ];

    const colX = { metric: 36, measured: 170, limit: 290, diff: 400, status: 500 };
    const rowH = 22;
    let y = tableTop;

    // Header
    doc.fontSize(10).fill('#616161');
    doc.text('Metric', colX.metric, y);
    doc.text('Measured', colX.measured, y);
    doc.text('Limit', colX.limit, y);
    doc.text('Difference', colX.diff, y);
    doc.text('Status', colX.status, y);
    doc.moveTo(36, y + 14).lineTo(doc.page.width - 36, y + 14).stroke('#e0e0e0');
    y += rowH;

    doc.fill('#000');
    rows.forEach((r) => {
      const diff = (r.limit || 0) - (r.actual || 0);
      doc.text(r.name, colX.metric, y);
      doc.text(`${r.actual.toFixed ? r.actual.toFixed(0) : r.actual} kg`, colX.measured, y);
      doc.text(`${r.limit.toFixed ? r.limit.toFixed(0) : r.limit} kg`, colX.limit, y);
      doc.text(`${diff >= 0 ? '+' : ''}${diff} kg`, colX.diff, y);
      drawStatus(colX.status, y - 2, r.ok);
      y += rowH;
      doc.moveTo(36, y + 12).lineTo(doc.page.width - 36, y + 12).stroke('#f0f0f0');
    });

    // Advisory section
    const advTop = y + 22;
    doc.fontSize(12).text('Advisory (Informational)', 36, advTop - 16);
    const towBallPct = weigh.caravanWeight > 0 ? (weigh.towBallWeight / weigh.caravanWeight) * 100 : 0;
    const vanToCarRatio = (weigh.vehicleWeightUnhitched || 0) > 0 ? (weigh.caravanWeight / (weigh.vehicleWeightUnhitched || 0)) * 100 : 0;
    const btcPct = weigh.vehicleData?.btc ? (((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)) / weigh.vehicleData.btc) * 100 : 0;

    const advisoryRows = [
      { label: 'Van to Car Ratio (< 85% ideal)', value: `${vanToCarRatio.toFixed(0)}%`, ok: vanToCarRatio < 85 },
      { label: 'Tow Ball % (8%–10% ideal)', value: `${towBallPct.toFixed(0)}%`, ok: towBallPct >= 8 && towBallPct <= 10 },
      { label: 'BTC Ratio - ATM (< 80% ideal)', value: `${btcPct.toFixed(0)}%`, ok: btcPct < 80 }
    ];

    let ay = advTop;
    advisoryRows.forEach((row) => {
      doc.fontSize(10).text(row.label, 36, ay);
      doc.text(row.value, 320, ay);
      drawStatus(420, ay - 2, row.ok, 'IDEAL', 'CHECK');
      ay += 18;
    });

    // Overall badge
    const overallOk = weigh.complianceResults?.overallCompliant || weigh.compliance?.overall?.compliant || false;
    const overallLabel = overallOk ? 'OVERALL: COMPLIANT' : 'OVERALL: NON-COMPLIANT';
    const overallFill = overallOk ? '#e8f5e9' : '#ffebee';
    const overallStroke = overallOk ? '#66bb6a' : '#ef5350';
    doc.roundedRect(36, ay + 10, 200, 20, 8).fillAndStroke(overallFill, overallStroke);
    doc.fill('#000').fontSize(11).text(overallLabel, 36, ay + 14, { width: 200, align: 'center' });

    // Notes
    if (weigh.notes) {
      doc.fontSize(12).fill('#000').text('Notes', 36, ay + 44);
      doc.fontSize(10).text(weigh.notes, 36, ay + 60, { width: doc.page.width - 72 });
    }

    // Footer
    doc.fontSize(9).fill('#616161');
    doc.text('Generated by WeighBuddy - Caravan Compliance System', 36, doc.page.height - 40, { align: 'left' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 36, doc.page.height - 26, { align: 'left' });

    // Update weigh entry to mark report as generated
    await Weigh.findByIdAndUpdate(weigh._id, {
      reportGenerated: true,
      reportUrl: `/api/weighs/${weigh._id}/report`
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', { id: req.params.id, err: error?.message, stack: error?.stack });
    res.status(500).json({
      success: false,
      message: 'Error generating PDF report'
    });
  }
});

// @desc    Update weigh entry
// @route   PUT /api/weighs/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let weigh = await Weigh.findById(req.params.id);

    if (!weigh) {
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry
    if (weigh.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this weigh entry'
      });
    }

    // Only allow updates if status is draft
    if (weigh.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed weigh entry'
      });
    }

    weigh = await Weigh.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('vehicle').populate('caravan');

    res.json({
      success: true,
      weigh
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Fix pending payment status for completed weighs
// @route   POST /api/weighs/fix-pending-payments
// @access  Private
router.post('/fix-pending-payments', protect, async (req, res) => {
  try {
    // Find all weigh entries for this user that have pending payment status
    const pendingWeighs = await Weigh.find({
      userId: req.user.id,
      'payment.status': 'pending',
      status: { $ne: 'cancelled' }
    });

    if (pendingWeighs.length === 0) {
      return res.json({
        success: true,
        message: 'No pending payments found',
        updated: 0
      });
    }

    // Update all pending weighs to completed
    const updateResult = await Weigh.updateMany(
      {
        userId: req.user.id,
        'payment.status': 'pending',
        status: { $ne: 'cancelled' }
      },
      {
        $set: {
          'payment.status': 'completed',
          status: 'completed'
        }
      }
    );

    res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} weigh entries`,
      updated: updateResult.modifiedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update payment status for weigh entry
// @route   PUT /api/weighs/:id/payment-status
// @access  Private
router.put('/:id/payment-status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const weigh = await Weigh.findById(req.params.id);
    
    if (!weigh) {
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry or is admin
    if (weigh.userId.toString() !== req.user.id && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this weigh entry'
      });
    }

    // Update payment status and weigh status
    weigh.payment.status = status;
    weigh.status = status === 'completed' ? 'completed' : weigh.status;
    
    await weigh.save();

    res.json({
      success: true,
      weigh
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete weigh entry
// @route   DELETE /api/weighs/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const weigh = await Weigh.findById(req.params.id);

    if (!weigh) {
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry
    if (weigh.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this weigh entry'
      });
    }

    await weigh.remove();

    res.json({
      success: true,
      message: 'Weigh entry deleted'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


module.exports = router;