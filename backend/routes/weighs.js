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
  body('caravanNumberPlate', 'Caravan number plate is required').not().isEmpty(),
  body('weights.frontAxle', 'Front axle weight is required').isNumeric(),
  body('weights.rearAxle', 'Rear axle weight is required').isNumeric(),
  body('weights.totalVehicle', 'Total vehicle weight is required').isNumeric(),
  // DIY: separate front/rear axle-group inputs are optional; we accept zeros
  body('weights.totalCaravan', 'Total caravan weight is required').isNumeric(),
  body('weights.grossCombination', 'Gross combination weight is required').isNumeric(),
  body('weights.tbm', 'Tow ball mass is required').isNumeric()
], async (req, res) => {
  console.log('🔍 Weigh entry creation request received');
  console.log('User:', req.user.email);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      vehicleId,
      caravanId,
      vehicleNumberPlate,
      vehicleState,
      caravanNumberPlate,
      caravanState,
      weights,
      preWeigh,
      notes,
      payment: clientPayment
    } = req.body;



    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if caravan exists (if provided)
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

    // Basic validation checks
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (!caravan) {
      return res.status(404).json({
        success: false,
        message: 'Caravan not found'
      });
    }

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
      customerName,
      customerPhone,
      customerEmail,

      vehicle: vehicleId,
      vehicleNumberPlate,
      caravan: caravanId,
      caravanNumberPlate,

      // Required legacy fields (used by history table + schema validation)
      vehicleWeightHitched: parseFloat(weights.totalVehicle) || 0,
      vehicleWeightUnhitched: parseFloat(weights.totalVehicle) || 0,
      caravanWeight: parseFloat(weights.totalCaravan) || 0,
      towBallWeight: parseFloat(weights.tbm) || 0,

      // Store complete vehicle and caravan data for admin review
      vehicleData: {
        ...vehicle.toObject(),
        numberPlate: vehicleNumberPlate,
        state: vehicleState || vehicle.state || ''
      },
      caravanData: {
        ...caravan.toObject(),
        numberPlate: caravanNumberPlate,
        state: caravanState || caravan.state || ''
      },
      weights,
      preWeigh,
      notes,
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
    console.log('✅ Weigh entry saved successfully:', weigh._id, 'for user:', req.user.id);
    console.log('📊 Weigh entry details:', {
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

// @desc    Create a simple DIY weigh entry for Vehicle Only / Weighbridge Axle flow
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
      modifiedVehicleImages = []
    } = req.body || {};

    const totalUnhitched = Number(vehicleSummary.gvmUnhitched) || 0;
    const frontUnhitched = Number(vehicleSummary.frontUnhitched) || 0;
    const rearUnhitched = Number(vehicleSummary.rearUnhitched) || 0;

    // Basic customer details from the authenticated DIY user
    const customerName = req.user.name || 'DIY User';
    const customerEmail = req.user.email || 'unknown@example.com';
    const customerPhone = req.user.phone || 'N/A';

    const weigh = new Weigh({
      userId: req.user.id,
      customerName,
      customerEmail,
      customerPhone,

      // Vehicle-only DIY flow: treat the unhitched total as both hitched
      // and unhitched so required fields are satisfied. Caravan-related
      // fields are zero as there is no caravan in this flow.
      vehicleWeightHitched: totalUnhitched,
      vehicleWeightUnhitched: totalUnhitched,
      caravanWeight: 0,
      towBallWeight: 0,

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
    console.error('Error generating DIY vehicle-only report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report'
    });
  }
});
 

// @desc    Get all weigh entries for user
// @route   GET /api/weighs
// @access  Private
router.get('/', protect, async (req, res) => {
  console.log('🔍 GENERAL WEIGHS ROUTE HIT - User:', req.user.email);
  console.log('🔍 Query params:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const weighs = await Weigh.find({ userId: req.user.id })
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Weigh.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      count: weighs.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      weighs
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

    // Check if user owns this weigh entry or is admin
    console.log('GET /api/weighs/:id ownership check', { weighUserId: weigh.userId?._id?.toString?.() || weigh.userId?.toString?.(), requesterId: req.user?.id, requesterType: req.user?.userType });
    if ((weigh.userId?._id?.toString?.() || weigh.userId?.toString?.()) !== req.user.id && req.user.userType !== 'admin') {
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
      .populate('userId', 'name email userType');

    if (!weigh) {
      console.log('GET /api/weighs/:id/report not found', { id: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Weigh entry not found'
      });
    }

    // Check if user owns this weigh entry or is admin
    console.log('GET /api/weighs/:id/report ownership check', { weighUserId: weigh.userId?._id?.toString?.() || weigh.userId?.toString?.(), requesterId: req.user?.id, requesterType: req.user?.userType });
    if ((weigh.userId?._id?.toString?.() || weigh.userId?.toString?.()) !== req.user.id && req.user.userType !== 'admin') {
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