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

const resolvePdfLogoPath = (req, resolveTemplatePath) => {
  try {
    const userType = String(req?.user?.userType || '').toLowerCase();
    const logoUrl = req?.user?.logoUrl ? String(req.user.logoUrl).trim() : '';
    const fleetOwnerLogoUrl = req?.user?.fleetOwnerUserId?.logoUrl
      ? String(req.user.fleetOwnerUserId.logoUrl).trim()
      : '';

    const resolvedLogoUrl = fleetOwnerLogoUrl || logoUrl;
    const shouldUseAccountLogo = (userType === 'professional' || userType === 'fleet' || Boolean(req?.user?.fleetOwnerUserId));

    if (shouldUseAccountLogo && resolvedLogoUrl) {
      const candidates = [];
      if (resolvedLogoUrl.startsWith('/uploads/')) {
        candidates.push(path.join(__dirname, '..', resolvedLogoUrl.replace(/^\//, '')));
      }
      candidates.push(path.join(__dirname, '..', 'uploads', resolvedLogoUrl));
      candidates.push(path.join(__dirname, '..', 'uploads', 'logos', resolvedLogoUrl));
      candidates.push(path.join(__dirname, '..', 'uploads', 'compliance-plates', resolvedLogoUrl));
      const found = candidates.find((p) => {
        try {
          return p && fs.existsSync(p);
        } catch (e) {
          return false;
        }
      });
      if (found) return found;
    }
  } catch (e) {
    // ignore
  }

  return resolveTemplatePath('weighbuddy logo green background.png');
};

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
      location,

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
      location: typeof location === 'string' ? location.trim() : '',

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

// @desc    Generate single-page PDF report for DIY Caravan/Trailer Only (Registered) - Weighbridge methods (left image only)
// @route   POST /api/weighs/diy-caravan-only-registered/weighbridge-report
// @access  Private
router.post('/diy-caravan-only-registered/weighbridge-report', protect, async (req, res) => {
  let doc;
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const debug = String(req.query?.debug || '').trim() === '1' || payload.debug === true;

    const header = payload.header && typeof payload.header === 'object' ? payload.header : {};
    const trailerInfo = payload.trailerInfo && typeof payload.trailerInfo === 'object' ? payload.trailerInfo : {};
    const waterTanks = payload.waterTanks && typeof payload.waterTanks === 'object' ? payload.waterTanks : {};
    const capacities = payload.capacities && typeof payload.capacities === 'object' ? payload.capacities : {};
    const axleWeigh = payload.axleWeigh && typeof payload.axleWeigh === 'object' ? payload.axleWeigh : {};
    const notes = payload.notes != null ? String(payload.notes) : '';

    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const safeNum = (v) => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const fmtKg = (v) => {
      const n = safeNum(v);
      return n == null ? '-' : `${Math.round(n)}kg`;
    };

    const preWeigh = payload.preWeigh && typeof payload.preWeigh === 'object' ? payload.preWeigh : {};
    const axleConfigLabel = String(preWeigh.axleConfig || payload.axleConfig || 'Single Axle');
    const axleConfigLower = axleConfigLabel.toLowerCase();
    const isSingleAxle = axleConfigLower === 'single axle';
    const isDualAxle = axleConfigLower === 'dual axle';
    const isTripleAxle = axleConfigLower === 'triple axle';

    const sideViewPath = isTripleAxle
      ? resolveTemplatePath('triple-axle-trailer.png')
      : isDualAxle
        ? (resolveTemplatePath('double-axle-trailer.png') || resolveTemplatePath('dual-axle-trailer.png'))
        : resolveTemplatePath('single-axle-trailer.png');

    if (!sideViewPath) {
      throw new Error('Caravan-only registered side-view trailer image not found');
    }

    const methodSelection = String(
      payload.methodSelection ||
        payload.diyMethodSelection ||
        payload?.weights?.diyMethodSelection ||
        payload?.weights?.raw?.methodSelection ||
        payload?.weights?.raw?.diyMethodSelection ||
        ''
    ).trim();

    const weighingSelection = String(payload.weighingSelection || payload.diyWeighingSelection || '').trim();
    const isCustomBuildTrailerTare =
      payload.customBuildTrailerTare === true ||
      weighingSelection === 'custom_build_trailer_tare' ||
      weighingSelection === 'trailer_tare' ||
      weighingSelection === 'caravan_only_tare';

    const tbmMeasuredExplicit =
      safeNum(axleWeigh.towballMass) ??
      safeNum(axleWeigh.towBallMass) ??
      safeNum(axleWeigh.tbm) ??
      safeNum(payload.tbmMeasured) ??
      safeNum(payload.towBallMass) ??
      safeNum(payload.towballMass) ??
      null;
    const gtmMeasured =
      safeNum(axleWeigh.caravanHitchedGtm) ??
      safeNum(axleWeigh.trailerGtm) ??
      safeNum(axleWeigh.gtm) ??
      safeNum(payload.gtmMeasured) ??
      0;
    const atmMeasured =
      safeNum(axleWeigh.caravanUnhitchedAtm) ??
      safeNum(axleWeigh.trailerAtm) ??
      safeNum(axleWeigh.caravanAtm) ??
      safeNum(axleWeigh.atm) ??
      safeNum(payload.atmMeasured) ??
      Math.max(0, gtmMeasured + tbmMeasured);

    const tbmMeasured =
      tbmMeasuredExplicit != null
        ? tbmMeasuredExplicit
        : atmMeasured != null && gtmMeasured > 0
          ? Math.max(0, atmMeasured - gtmMeasured)
          : 0;

    const tbmCapacity = safeNum(capacities.tbm);
    const gtmCapacity = safeNum(capacities.gtm);
    const atmCapacity = safeNum(capacities.atm);

    const tbmOk = tbmCapacity == null ? true : tbmMeasured <= tbmCapacity;
    const gtmOk = gtmCapacity == null ? true : gtmMeasured <= gtmCapacity;
    const atmOk = atmCapacity == null ? true : atmMeasured <= atmCapacity;

    const okText = (ok) => (ok ? 'OK' : 'Over');

    if (debug) {
      // eslint-disable-next-line no-console
      console.log('DIY caravan-only registered weighbridge PDF incoming TBM debug', {
        payloadTbmMeasured: payload?.tbmMeasured ?? null,
        payloadTowBallMass: payload?.towBallMass ?? null,
        payloadTowballMass: payload?.towballMass ?? null,
        axleWeighTowballMass: axleWeigh?.towballMass ?? null,
        axleWeighTowBallMass: axleWeigh?.towBallMass ?? null,
        axleWeighTbm: axleWeigh?.tbm ?? null,
        resolvedTbmMeasured: tbmMeasured,
      });
    }

    const pageW = 842;
    const pageH = 595;

    doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=diy-caravan-only-registered-weighbridge.pdf'
    );
    doc.pipe(res);

    const drawText = (text, x, y, opts = {}) => {
      const { size = 12, width = 140, align = 'center' } = opts;
      doc.save();
      doc.fillColor('#000000');
      doc.fontSize(size);
      doc.text(String(text ?? ''), x, y, { width, align });
      doc.restore();
    };

    const drawLineRect = (x, y, w, h, stroke = '#d0d0d0') => {
      doc.save();
      doc.strokeColor(stroke);
      doc.lineWidth(1);
      doc.rect(x, y, w, h).stroke();
      doc.restore();
    };

    const fillRect = (x, y, w, h, color) => {
      doc.save();
      doc.fillColor(color);
      doc.rect(x, y, w, h).fill();
      doc.restore();
    };

    // White background
    doc.save();
    doc.fillColor('#ffffff');
    doc.rect(0, 0, pageW, pageH).fill();
    doc.restore();

    // Layout constants (mirrors portable layout)
    const headerY = 18;
    const headerH1 = 22;
    const headerH2 = 22;
    const headerLeftX = 210;
    const headerTotalW = 620;
    const headerCols = [95, 185, 110, 230];

    const infoY = headerY + headerH1;
    const infoH = headerH2;
    const infoCols = [110, 170, 170, 170];

    const leftAreaX = 40;
    const leftAreaY = 120;
    const leftAreaW = 520;
    const leftAreaH = 250;

    const bottomY = 395;
    const bottomH = 160;

    // Header blocks
    fillRect(headerLeftX, headerY, headerTotalW, headerH1, '#efefef');
    fillRect(headerLeftX, infoY, headerTotalW, infoH, '#ffffff');

    // Header grid outline
    {
      let x = headerLeftX;
      drawLineRect(headerLeftX, headerY, headerTotalW, headerH1 + infoH);
      for (let i = 0; i < headerCols.length - 1; i++) {
        x += headerCols[i];
        doc.save();
        doc.strokeColor('#d0d0d0');
        doc.moveTo(x, headerY).lineTo(x, headerY + headerH1).stroke();
        doc.restore();
      }
      doc.save();
      doc.strokeColor('#d0d0d0');
      doc.moveTo(headerLeftX, infoY).lineTo(headerLeftX + headerTotalW, infoY).stroke();
      doc.restore();
    }

    // Second row columns
    {
      let x = headerLeftX;
      for (let i = 0; i < infoCols.length - 1; i++) {
        x += infoCols[i];
        doc.save();
        doc.strokeColor('#d0d0d0');
        doc.moveTo(x, infoY).lineTo(x, infoY + infoH).stroke();
        doc.restore();
      }
    }

    const labelStyle = { size: 8, width: 120, align: 'left' };
    drawText('Date', headerLeftX + 6, headerY + 6, labelStyle);
    drawText('Customer Name', headerLeftX + headerCols[0] + 6, headerY + 6, labelStyle);
    drawText('Time', headerLeftX + headerCols[0] + headerCols[1] + 6, headerY + 6, labelStyle);
    drawText('Location', headerLeftX + headerCols[0] + headerCols[1] + headerCols[2] + 6, headerY + 6, labelStyle);
    drawText('Trailer Rego', headerLeftX + 6, infoY + 6, labelStyle);
    drawText('Make', headerLeftX + infoCols[0] + 6, infoY + 6, labelStyle);
    drawText('Model', headerLeftX + infoCols[0] + infoCols[1] + 6, infoY + 6, labelStyle);

    const valueStyle = { size: 9, width: 180, align: 'left' };
    drawText(header.date || new Date().toLocaleDateString(), headerLeftX + 6, headerY + 14, { ...valueStyle, width: headerCols[0] - 12 });
    drawText(header.customerName || '', headerLeftX + headerCols[0] + 6, headerY + 14, { ...valueStyle, width: headerCols[1] - 12 });
    drawText(header.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), headerLeftX + headerCols[0] + headerCols[1] + 6, headerY + 14, { ...valueStyle, width: headerCols[2] - 12 });
    drawText(header.location || '', headerLeftX + headerCols[0] + headerCols[1] + headerCols[2] + 6, headerY + 14, { ...valueStyle, width: headerCols[3] - 12 });
    drawText(trailerInfo.rego || header.caravanRego || '', headerLeftX + 6, infoY + 14, { ...valueStyle, width: infoCols[0] - 12 });
    drawText(trailerInfo.make || header.caravanMake || '', headerLeftX + infoCols[0] + 6, infoY + 14, { ...valueStyle, width: infoCols[1] - 12 });
    drawText(trailerInfo.model || header.caravanModel || '', headerLeftX + infoCols[0] + infoCols[1] + 6, infoY + 14, { ...valueStyle, width: infoCols[2] - 12 });

    // Side-view image only
    try {
      doc.image(sideViewPath, leftAreaX + 110, leftAreaY + 30, { fit: [leftAreaW - 120, leftAreaH - 40] });
    } catch (e) {
      console.error('Failed to render side-view trailer image (weighbridge):', e?.message || e);
    }

    // Labels + measured overlays
    drawText('TowBall kg', leftAreaX + 10, leftAreaY + 115, { size: 14, width: 120, align: 'left' });
    drawText('Axle Weight kg', leftAreaX + 215, leftAreaY + 220, { size: 14, width: 220, align: 'center' });
    drawText(fmtKg(tbmMeasured), leftAreaX + 15, leftAreaY + 155, { size: 12, width: 120, align: 'left' });
    // Option A: show a single GTM value regardless of axle count
    drawText(fmtKg(gtmMeasured), leftAreaX + 220, leftAreaY + 250, { size: 12, width: 220, align: 'center' });

    const drawCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', size = 9, color = '#000000', padL = 8 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor('#d0d0d0');
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(size);
      doc.text(String(text ?? ''), x + padL, y + 8, { width: w - padL * 2, align });
      doc.restore();
    };

    if (isCustomBuildTrailerTare) {
      // Tare Report bottom layout (matches portable tare)
      const baseY = bottomY + 30;
      const blockH = 120;
      const gap = 12;

      const leftW = 250;
      const midW = 420;
      const rightW = pageW - 40 - gap - leftW - gap - midW;

      const leftX = 40;
      const midX = leftX + leftW + gap;
      const rightX = midX + midW + gap;

      // Left table (4 rows: header + 3 metrics). 3 columns: label | value | unit
      const ltRowH = 28;
      const ltHeaderH = 26;
      const ltH = ltHeaderH + ltRowH * 3;
      fillRect(leftX, baseY, leftW, ltHeaderH, '#ededed');
      drawLineRect(leftX, baseY, leftW, ltH);
      drawText('Trailer Information', leftX + 8, baseY + 8, { size: 9, width: leftW - 16, align: 'left' });

      const ltColLabelW = 170;
      const ltColValueW = 50;
      const ltColUnitW = leftW - ltColLabelW - ltColValueW;

      const metricLabels = ['Towball Mass', 'Gross Trailer Mass (GTM)', 'Aggregated Trailer Mass (ATM)'];
      const metricMeasured = [tbmMeasured, gtmMeasured, atmMeasured];

      for (let i = 0; i < 3; i += 1) {
        const y = baseY + ltHeaderH + i * ltRowH;
        drawCell(leftX, y, ltColLabelW, ltRowH, metricLabels[i], { bg: '#ffffff', size: 9, align: 'left' });
        drawCell(leftX + ltColLabelW, y, ltColValueW, ltRowH, metricMeasured[i] > 0 ? String(Math.round(metricMeasured[i])) : '-', {
          bg: '#ffffff',
          size: 9,
          align: 'center',
          padL: 0,
        });
        drawCell(leftX + ltColLabelW + ltColValueW, y, ltColUnitW, ltRowH, 'kg', { bg: '#ffffff', size: 9, align: 'left' });
      }

      // Middle notes block
      fillRect(midX, baseY, midW, blockH, '#ededed');
      drawLineRect(midX, baseY, midW, blockH);
      drawText('Additional Notes', midX + 10, baseY + 18, { size: 12, width: midW - 20, align: 'left' });
      drawText(notes && notes.trim() !== '' ? notes : '-', midX + 10, baseY + 45, {
        size: 10,
        width: midW - 20,
        align: 'left',
      });

      // Right operator/signature block (two rows)
      fillRect(rightX, baseY, rightW, blockH, '#ededed');
      drawLineRect(rightX, baseY, rightW, blockH);
      const opRowH = blockH / 2;
      doc.save();
      doc.strokeColor('#d0d0d0');
      doc.moveTo(rightX, baseY + opRowH).lineTo(rightX + rightW, baseY + opRowH).stroke();
      doc.restore();
      drawText('Operators Name :', rightX + 10, baseY + 18, { size: 10, width: rightW - 20, align: 'left' });
      drawText('Signature :', rightX + 10, baseY + opRowH + 18, { size: 10, width: rightW - 20, align: 'left' });
    } else {
      // Bottom table: match the portable layout with columns:
      // Trailer Information | Compliance | Weights Recorded | Result | Trailer Information (Water Tanks)
      const tableX = 40;
      const tableY = bottomY + 30;
      const rowH = 28;
      const headerRowH = 26;
      const tableW = 700;
      const tableH = headerRowH + rowH * 3;

      const colWs = [150, 110, 120, 90, 230];

      // Outer border
      drawLineRect(tableX, tableY, tableW, tableH);

      // Header row
      const headers = ['Trailer Information', 'Compliance', 'Weights Recorded', 'Result', 'Trailer Information'];
      const headerBgs = ['#ededed', '#cdd9ff', '#fff3b0', '#ffffff', '#ededed'];
      let cx = tableX;
      for (let i = 0; i < colWs.length; i += 1) {
        drawCell(cx, tableY, colWs[i], headerRowH, headers[i], { bg: headerBgs[i], size: 9, align: 'left' });
        cx += colWs[i];
      }

      const labels = ['Towball Mass', 'Gross Trailer Mass (GTM)', 'Aggregated Trailer Mass (ATM)'];
      const complianceVals = [tbmCapacity, gtmCapacity, atmCapacity];
      const measuredVals = [tbmMeasured, gtmMeasured, atmMeasured];
      const results = [okText(tbmOk), okText(gtmOk), okText(atmOk)];
      const resultBgs = [tbmOk ? '#1aa64b' : '#e53935', gtmOk ? '#1aa64b' : '#e53935', atmOk ? '#1aa64b' : '#e53935'];

      for (let r = 0; r < labels.length; r += 1) {
        const y = tableY + headerRowH + r * rowH;
        // Col 1: label
        drawCell(tableX, y, colWs[0], rowH, labels[r], { bg: '#ffffff', size: 9, align: 'left' });
        // Col 2: compliance
        drawCell(tableX + colWs[0], y, colWs[1], rowH, fmtKg(complianceVals[r]), { bg: '#cdd9ff', size: 9, align: 'center', padL: 0 });
        // Col 3: weights recorded
        drawCell(tableX + colWs[0] + colWs[1], y, colWs[2], rowH, fmtKg(measuredVals[r]), { bg: '#fff3b0', size: 9, align: 'center', padL: 0 });
        // Col 4: result
        drawCell(
          tableX + colWs[0] + colWs[1] + colWs[2],
          y,
          colWs[3],
          rowH,
          results[r],
          { bg: resultBgs[r], size: 9, align: 'center', color: '#ffffff', padL:  0 }
        );
      }

      // Col 5: Water tanks block spanning rows
      const waterX = tableX + colWs[0] + colWs[1] + colWs[2] + colWs[3];
      const waterY = tableY + headerRowH;
      const waterW = colWs[4];
      const waterH = rowH * 3;
      drawCell(waterX, waterY, waterW, waterH, '', { bg: '#ffffff' });

      // Render water tanks as an internal grid so values cannot overflow outside the cell.
      const waterRowH = waterH / 3;
      const waterLabelW = Math.min(130, Math.floor(waterW * 0.6));
      const waterValueW = waterW - waterLabelW;

      drawCell(waterX, waterY, waterLabelW, waterRowH, 'Number of Tanks', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY,
        waterValueW,
        waterRowH,
        waterTanks.count != null ? String(waterTanks.count) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      drawCell(waterX, waterY + waterRowH, waterLabelW, waterRowH, 'Number Full', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY + waterRowH,
        waterValueW,
        waterRowH,
        waterTanks.fullCount != null ? String(waterTanks.fullCount) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      drawCell(waterX, waterY + waterRowH * 2, waterLabelW, waterRowH, 'Total Water (Ltrs)', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY + waterRowH * 2,
        waterValueW,
        waterRowH,
        waterTanks.litres != null ? String(waterTanks.litres) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      // Notes block to the right (grey), like portable reference
      const gap = 12;
      const notesX = tableX + tableW + gap;
      const notesY = tableY;
      const notesW = pageW - notesX - 18;
      const notesH = tableH;
      fillRect(notesX, notesY, notesW, notesH, '#ededed');
      drawLineRect(notesX, notesY, notesW, notesH);
      drawText('Additional Notes', notesX + 10, notesY + 18, { size: 12, width: notesW - 20, align: 'left' });
      drawText(notes && notes.trim() !== '' ? notes : '-', notesX + 10, notesY + 45, { size: 10, width: notesW - 20, align: 'left' });
    }

    // Footer
    drawText('powered by weighbuddy', pageW / 2 - 80, pageH - 28, { size: 12, width: 200, align: 'left' });
    drawText('help - FAQ', pageW / 2 + 130, pageH - 28, { size: 12, width: 120, align: 'left' });
    drawText('Terms and Conditions', pageW / 2 + 250, pageH - 28, { size: 12, width: 200, align: 'left' });

    if (debug) {
      const step = 50;
      doc.save();
      doc.lineWidth(0.5);
      doc.strokeColor('#ff0000');
      for (let x = 0; x <= pageW; x += step) {
        doc.moveTo(x, 0).lineTo(x, pageH).stroke();
        doc.fillColor('#ff0000');
        doc.fontSize(6);
        doc.text(String(x), x + 2, 2, { width: 40, align: 'left' });
      }
      for (let y = 0; y <= pageH; y += step) {
        doc.moveTo(0, y).lineTo(pageW, y).stroke();
        doc.fillColor('#ff0000');
        doc.fontSize(6);
        doc.text(String(y), 2, y + 2, { width: 30, align: 'left' });
      }
      doc.restore();
    }

    doc.end();
  } catch (error) {
    console.error('DIY caravan-only registered weighbridge PDF generation error:', error);
    if (res.headersSent) {
      try {
        if (doc && !doc.ended) doc.end();
      } catch (e) {
        // ignore
      }
      try {
        res.end();
      } catch (e) {
        // ignore
      }
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
  }
});

// @route   POST /api/weighs/diy-vehicle-only
// @access  Private (DIY user)
router.post('/diy-vehicle-only', protect, async (req, res) => {
  try {
    const {
      vehicleSummary: incomingVehicleSummary = {},
      caravanSummary = null,
      weights: normalizedWeights = null,
      preWeigh = {},
      notes,
      methodSelection: incomingMethodSelection = '',
      payment: clientPayment = {},
      modifiedVehicleImages = [],
      clientUserId = null,
      customerName: incomingCustomerName = null,
      customerEmail: incomingCustomerEmail = null,
      customerPhone: incomingCustomerPhone = null,
    } = req.body || {};

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

    const inferTowedAxleConfigLabelFromAxleConfig = (candidate) => {
      if (candidate == null) return null;

      if (typeof candidate === 'string') {
        const s = candidate.trim().toLowerCase();
        if (!s) return null;
        if (s === 'triple' || s.includes('triple')) return 'Triple Axle';
        if (s === 'dual' || s.includes('dual')) return 'Dual Axle';
        if (s === 'single' || s.includes('single')) return 'Single Axle';
      }

      return null;
    };

    const inferTowedAxleConfigLabelFromTyreWeigh = (candidate) => {
      if (!candidate || typeof candidate !== 'object') return null;

      const rawLabel = candidate.axleConfig;
      if (typeof rawLabel === 'string') {
        const s = rawLabel.trim().toLowerCase();
        if (s.includes('triple')) return 'Triple Axle';
        if (s.includes('dual')) return 'Dual Axle';
        if (s.includes('single')) return 'Single Axle';
      }

      // Fallback to structure-based inference
      if (candidate.triple && typeof candidate.triple === 'object') return 'Triple Axle';
      if (candidate.dual && typeof candidate.dual === 'object') return 'Dual Axle';
      if (candidate.single && typeof candidate.single === 'object') return 'Single Axle';

      return null;
    };

    const vehicleSummary =
      incomingVehicleSummary && typeof incomingVehicleSummary === 'object'
        ? incomingVehicleSummary
        : {};

    const rawWeighData =
      normalizedWeights && typeof normalizedWeights === 'object' &&
      normalizedWeights.raw && typeof normalizedWeights.raw === 'object'
        ? normalizedWeights.raw
        : null;

    const totalUnhitched = Number(vehicleSummary.gvmUnhitched) || 0;
    const frontUnhitched = Number(vehicleSummary.frontUnhitched) || 0;
    const rearUnhitched = Number(vehicleSummary.rearUnhitched) || 0;

    const resolvedTowBallWeight =
      normalizedWeights && typeof normalizedWeights === 'object'
        ? Math.max(0, Number(normalizedWeights.tbm) || 0)
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

    const diyTyreWeighCandidate =
      normalizedWeights && typeof normalizedWeights === 'object'
        ? (normalizedWeights.diyTyreWeigh || normalizedWeights.tyreWeigh || normalizedWeights.raw?.diyTyreWeigh || normalizedWeights.raw?.tyreWeigh || null)
        : null;

    // Ensure portable tow+caravan tyre weigh info is persisted to the saved record.
    // Some older flows sent tyreWeigh at the top-level (weights.tyreWeigh) but did
    // not copy it into weights.raw, resulting in raw.tyreWeigh = null in Mongo.
    const resolvedRawWeighData = (() => {
      if (!rawWeighData && !diyTyreWeighCandidate) return rawWeighData;
      const base = rawWeighData && typeof rawWeighData === 'object' ? { ...rawWeighData } : {};
      if (!base.tyreWeigh && diyTyreWeighCandidate && typeof diyTyreWeighCandidate === 'object') {
        base.tyreWeigh = diyTyreWeighCandidate;
      }
      return base;
    })();

    const inferredTowedAxleConfigFromTyreWeigh = inferTowedAxleConfigLabelFromTyreWeigh(diyTyreWeighCandidate);

    const inferredTowedAxleConfigFromPreWeighAxleConfig = (() => {
      if (!preWeigh || typeof preWeigh !== 'object') return null;
      return inferTowedAxleConfigLabelFromAxleConfig(preWeigh.axleConfig);
    })();

    // For portable tow flows, store a consistent axle config label into preWeigh so
    // history/PDF generation does not need to guess and accidentally render dual axle.
    const resolvedPreWeigh = (() => {
      if (!preWeigh || typeof preWeigh !== 'object') return preWeigh;
      const current = typeof preWeigh.towedAxleConfig === 'string' ? preWeigh.towedAxleConfig.trim() : '';
      if (current) return preWeigh;

      const inferred = inferredTowedAxleConfigFromTyreWeigh || inferredTowedAxleConfigFromPreWeighAxleConfig;
      if (!inferred) return preWeigh;

      return {
        ...preWeigh,
        towedAxleConfig: inferred,
      };
    })();

    // Confirm Caravan/Trailer Details rules (registered caravan flows):
    // all required except GTM, VIN, Axle Group Loadings.
    // For custom build trailer tare reports, rego/state may be unknown; do not hard-require.
    const isCustomBuildTrailerTare =
      String(normalizedWeights?.diyWeighingSelection || normalizedWeights?.raw?.diyWeighingSelection || '')
        .toLowerCase()
        .includes('custom_build_trailer_tare');

    if (caravanSummary && typeof caravanSummary === 'object' && !isCustomBuildTrailerTare) {
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

    const parseNullableNumber = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      const s = String(value).trim();
      if (!s || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'na') return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    const resolvedPreWeighSafe = resolvedPreWeigh && typeof resolvedPreWeigh === 'object'
      ? {
          ...resolvedPreWeigh,
          fuelLevel: (() => {
            const raw = parseNullableNumber(resolvedPreWeigh.fuelLevel);
            if (raw == null) return raw;
            let v = Number(raw);
            if (!Number.isFinite(v)) return null;
            // Some DIY flows use a 0-1000 slider; normalize down to 0-100.
            if (v > 100 && v <= 1000) v = v / 10;
            if (v < 0) v = 0;
            if (v > 100) v = 100;
            return v;
          })(),
          passengersFront: parseNullableNumber(resolvedPreWeigh.passengersFront),
          passengersRear: parseNullableNumber(resolvedPreWeigh.passengersRear),
          waterTankCount: parseNullableNumber(resolvedPreWeigh.waterTankCount),
          waterTankFullCount: parseNullableNumber(resolvedPreWeigh.waterTankFullCount),
          waterTotalLitres: parseNullableNumber(resolvedPreWeigh.waterTotalLitres),
          towballHeightMm: parseNullableNumber(resolvedPreWeigh.towballHeightMm),
          airbagPressurePsi: parseNullableNumber(resolvedPreWeigh.airbagPressurePsi),
        }
      : resolvedPreWeigh;

    const weigh = new Weigh({
      userId: req.user.id,
      clientUserId: validatedClientUserId,
      customerName: effectiveCustomerName,
      customerEmail: effectiveCustomerEmail,
      customerPhone: effectiveCustomerPhone,

      methodSelection: incomingMethodSelection || undefined,

      // Vehicle-only DIY flow: treat the unhitched total as both hitched
      // and unhitched so required fields are satisfied. Caravan-related
      // fields are zero as there is no caravan in this flow.
      vehicleWeightHitched: resolvedVehicleHitched,
      vehicleWeightUnhitched: totalUnhitched,
      caravanWeight: resolvedAtmMeasured,
      towBallWeight: resolvedTowBallWeight,

      // Persist individual unhitched tyre weights when present (vehicle-only portable scales)
      ...(diyTyreWeighCandidate && typeof diyTyreWeighCandidate === 'object'
        ? {
            vehicleFrontLeftUnhitched: Number(diyTyreWeighCandidate.frontLeft) || 0,
            vehicleFrontRightUnhitched: Number(diyTyreWeighCandidate.frontRight) || 0,
            vehicleRearLeftUnhitched: Number(diyTyreWeighCandidate.rearLeft) || 0,
            vehicleRearRightUnhitched: Number(diyTyreWeighCandidate.rearRight) || 0,
          }
        : {}),

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
        rearAxleUnhitched: rearUnhitched,
        ...(diyTyreWeighCandidate && typeof diyTyreWeighCandidate === 'object'
          ? { diyTyreWeigh: diyTyreWeighCandidate }
          : {}),
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
      rawWeighData: resolvedRawWeighData || undefined,
      preWeigh: resolvedPreWeighSafe,
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

    // Wallet credit: for professional-created DIY users, credit $1 on paid DIY completion.
    // This route is used by special flows where payment is confirmed earlier and the weigh
    // is saved later on the Results "Finish" action.
    try {
      const User = require('../models/User');
      const ProfessionalCustomerSetup = require('../models/ProfessionalCustomerSetup');
      const WalletTransaction = require('../models/WalletTransaction');

      const diyUser = await User.findById(req.user.id).select('professionalOwnerUserId');
      const professionalId = diyUser?.professionalOwnerUserId;

      console.log('diy-vehicle-only WALLET STEP 0 context', {
        weighId: String(weigh._id),
        diyUserId: req.user?.id ? String(req.user.id) : null,
        professionalId: professionalId ? String(professionalId) : null,
        clientPaymentMethod: clientPayment?.method || null,
        clientPaymentTransactionId: clientPayment?.transactionId || null,
      });

      if (professionalId && String(clientPayment?.method || '').toLowerCase() === 'stripe') {
        const paymentIntentId = clientPayment?.transactionId || null;

        const vehicleRego = vehicleSummary?.rego || vehicleSummary?.numberPlate || vehicleSummary?.plate || '';
        const trailerRego = caravanSummary?.rego || caravanSummary?.numberPlate || caravanSummary?.plate || '';

        const setupKey = computeSetupKey({ vehicleRego, trailerRego });

        console.log('diy-vehicle-only WALLET STEP 1 computed keys', {
          weighId: String(weigh._id),
          vehicleRego,
          trailerRego,
          setupKey,
          paymentIntentId,
        });

        if (setupKey && paymentIntentId) {
          const mapping = await ProfessionalCustomerSetup.findOne({
            professionalId,
            diyUserId: req.user.id,
            setupKey,
          }).select('_id');

          console.log('diy-vehicle-only WALLET STEP 2 mapping lookup', {
            weighId: String(weigh._id),
            setupKey,
            mappingFound: Boolean(mapping),
          });

          if (!mapping) {
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

            console.log('diy-vehicle-only WALLET STEP 3 mapping upserted', {
              weighId: String(weigh._id),
              setupKey,
              professionalId: String(professionalId),
              diyUserId: String(req.user.id),
            });
          }

          await WalletTransaction.create({
            professionalId,
            diyUserId: req.user.id,
            weighId: weigh._id,
            setupKey,
            vehicleRego: normalizeRego(vehicleRego) || null,
            trailerRego: normalizeRego(trailerRego) || null,
            amount: 1,
            type: 'credit',
            source: 'diy_payment',
            paymentIntentId,
          });

          console.log('diy-vehicle-only WALLET STEP 4 credit created', {
            weighId: String(weigh._id),
            setupKey,
            paymentIntentId,
            professionalId: String(professionalId),
            diyUserId: String(req.user.id),
          });
        } else {
          console.log('diy-vehicle-only WALLET SKIP missing setupKey/paymentIntentId', {
            weighId: String(weigh._id),
            setupKey,
            paymentIntentId,
          });
        }
      } else {
        console.log('diy-vehicle-only WALLET SKIP missing professionalId or non-stripe', {
          weighId: String(weigh._id),
          professionalId: professionalId ? String(professionalId) : null,
          method: clientPayment?.method || null,
        });
      }
    } catch (walletErr) {
      if (walletErr?.code === 11000) {
        // ignore duplicate credit attempts
      } else {
        console.error('Wallet credit error (diy-vehicle-only):', walletErr);
      }
    }

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
  let doc;
  try {
    const { header: incomingHeader = {}, vehicleInfo = {}, tyreWeigh = null, measured = {}, capacities = {}, capacityDiff = {}, carInfo = {}, notes = '', methodSelection = '' } = req.body || {};

    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-vehicle-only-weigh.pdf');

    doc.pipe(res);

    const logoPath = resolvePdfLogoPath(req, resolveTemplatePath);
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
      doc.image(vehicleImagePath, 220, 120, { width: 320 });
    } catch (imgErr) {
      console.error('Failed to render vehicle image for DIY report:', imgErr?.message || imgErr);
    }

    const isVehicleOnlyWeighbridgeMethod =
      methodSelection === 'Weighbridge - In Ground - Individual Axle Weights' ||
      methodSelection === 'Weighbridge - goweigh' ||
      methodSelection === 'Weighbridge - Above Ground' ||
      methodSelection ===
        'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.';

    // Portable scales + vehicle-only weighbridge layout (match tow+caravan report-2 styling)
    if (methodSelection === 'Portable Scales - Individual Tyre Weights' || isVehicleOnlyWeighbridgeMethod) {
      const borderColor = '#bdbdbd';
      const titleBg = '#f5f5f5';
      const headerTitleBg = '#f5f5f5';

      const safeNumLocal = (v) => {
        if (v == null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const fmtKg = (v) => {
        const n = safeNumLocal(v);
        return n == null ? '-' : `${Math.round(n)} kg`;
      };
      const fmtCellNumber = (v) => {
        const n = safeNumLocal(v);
        return n == null ? 'N/A' : String(Math.round(n));
      };

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

      // Header grid
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
      const values1 = [
        incomingHeader.date || new Date().toLocaleDateString(),
        incomingHeader.customerName || '',
        incomingHeader.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        incomingHeader.location || 'Location unavailable',
      ];
      let cx = headerX;
      for (let i = 0; i < cols1.length; i += 1) {
        drawCell(cx, headerY, cols1[i], headerRowH, labels1[i], { bg: headerTitleBg, fontSize: 8 });
        drawCell(cx, headerY + headerRowH, cols1[i], headerRow2H, values1[i], { fontSize: 9 });
        cx += cols1[i];
      }

      const row2Y = headerY + headerRowH + headerRow2H + 2;
      const row2Cols = [110, 380, 110];
      const row2Labels = ['Car Rego', 'Make', ''];
      const row2Values = [
        incomingHeader.carRego || vehicleInfo.rego || '-',
        incomingHeader.carMake || vehicleInfo.description || '-',
        '',
      ];
      cx = headerX;
      for (let i = 0; i < row2Cols.length; i += 1) {
        if (row2Labels[i] !== '') {
          drawCell(cx, row2Y, row2Cols[i], headerRowH, row2Labels[i], { bg: headerTitleBg, fontSize: 8 });
          drawCell(cx, row2Y + headerRowH, row2Cols[i], headerRow2H, row2Values[i], { fontSize: 9 });
        } else {
          drawCell(cx, row2Y, row2Cols[i], headerRowH + headerRow2H, '', { bg: '#ffffff' });
        }
        cx += row2Cols[i];
      }

      // Vehicle illustration
      const vehicleImagePath = path.join(__dirname, '..', 'assets', 'vehicle.png');
      try {
        // Shift right slightly so the compliance table does not overlap the left wheel.
        doc.image(vehicleImagePath, 190, 110, { fit: [520, 170], align: 'left', valign: 'top' });
      } catch (imgErr) {
        // ignore
      }

      // Tyre diagram image + labels (portable scales only)
      // NOTE: For weighbridge axle-weight methods, we intentionally do NOT render the tyre diagram/tyre readings.
      if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
        const tyreImagePath = path.join(__dirname, '..', 'assets', 'individual-tyre.png');
        // Keep the entire tyre diagram (including right-side weight labels) within A4 landscape bounds.
        const topImgX = 600;
        const topImgY = 135;
        try {
          doc.image(tyreImagePath, topImgX, topImgY, { fit: [230, 290], align: 'left', valign: 'top' });
        } catch (imgErr) {
          // ignore
        }

        const t = tyreWeigh && typeof tyreWeigh === 'object' ? tyreWeigh : {};
        doc.save();
        doc.fillColor('#000000');
        doc.fontSize(10);
        doc.text(fmtKg(t.frontLeft), topImgX - 95, topImgY + 85, { width: 90, align: 'right' });
        doc.text(fmtKg(t.rearLeft), topImgX - 95, topImgY + 205, { width: 90, align: 'right' });
        // Bring right-side labels closer to the wheel so they don't look detached.
        doc.text(fmtKg(t.frontRight), topImgX + 150, topImgY + 85, { width: 90, align: 'left' });
        doc.text(fmtKg(t.rearRight), topImgX + 150, topImgY + 205, { width: 90, align: 'left' });
        doc.restore();
      }

      // Compliance table (Rear, GVM, Front)
      const tableX = 135;
      const tableY = 310;
      const tableW = 370;
      const labelW = 110;
      const colW = (tableW - labelW) / 3;
      const headerH = 22;
      const rowH = 22;
      const headers = ['Rear Axle', 'GVM', 'Front Axle'];

      const okText = (ok) => (ok ? 'OK' : 'Over');

      drawCell(tableX, tableY, labelW, headerH, '', { bg: titleBg, align: 'center', fontSize: 8 });
      for (let i = 0; i < 3; i += 1) {
        drawCell(tableX + labelW + i * colW, tableY, colW, headerH, headers[i], { bg: '#e8f4ff', align: 'center', fontSize: 8 });
      }

      const rowLabels = ['Compliance', 'Weights Recorded', 'Capacity', 'Result'];
      const rowBg = ['#cdd9ff', '#fff3b0', '#eeeeee', '#ffffff'];
      const rearOk = typeof measured.rear === 'number' && typeof capacities.rear === 'number' ? measured.rear <= capacities.rear : true;
      const gvmOk = typeof measured.gvm === 'number' && typeof capacities.gvm === 'number' ? measured.gvm <= capacities.gvm : true;
      const frontOk = typeof measured.front === 'number' && typeof capacities.front === 'number' ? measured.front <= capacities.front : true;

      // Values for each row, in the same order as rowLabels.
      const isAboveGroundVehicleOnly = methodSelection === 'Weighbridge - Above Ground';
      const measuredRearForPdf = isAboveGroundVehicleOnly ? null : measured.rear;
      const measuredFrontForPdf = isAboveGroundVehicleOnly ? null : measured.front;

      const vals = {
        Compliance: [capacities.rear, capacities.gvm, capacities.front],
        'Weights Recorded': [measuredRearForPdf, measured.gvm, measuredFrontForPdf],
        Capacity: [isAboveGroundVehicleOnly ? null : capacityDiff.rear, capacityDiff.gvm, isAboveGroundVehicleOnly ? null : capacityDiff.front],
        Result: [okText(rearOk), okText(gvmOk), okText(frontOk)],
      };

      for (let r = 0; r < rowLabels.length; r += 1) {
        const y = tableY + headerH + r * rowH;
        drawCell(tableX, y, labelW, rowH, rowLabels[r], { bg: rowBg[r], fontSize: 9 });
        for (let c = 0; c < 3; c += 1) {
          const isResult = rowLabels[r] === 'Result';
          const ok = c === 0 ? rearOk : c === 1 ? gvmOk : frontOk;
          const bg =
            isResult
              ? ok
                ? '#1aa64b'
                : '#e53935'
              : rowBg[r];
          const color = isResult ? '#ffffff' : '#000000';
          const v = vals[rowLabels[r]]?.[c];
          const text = isResult ? String(v) : fmtCellNumber(v);
          drawCell(tableX + labelW + c * colW, y, colW, rowH, text, { bg, align: 'center', fontSize: 9, color });
        }
      }

      // Blocks bottom (Car Info + Notes)
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

      const notesX = 350;
      const notesY = blocksTop;
      const notesW = 460;
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
      return;
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
        rearVal = capacities.rear;
        gvmVal = capacities.gvm;
        frontVal = capacities.front;
      } else if (rowLabel === 'Weights Recorded') {
        rearVal = measured.rear;
        gvmVal = measured.gvm;
        frontVal = measured.front;
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
    if (res.headersSent) {
      try {
        if (doc && !doc.ended) doc.end();
      } catch (e) {
        // ignore
      }
      try {
        res.end();
      } catch (e) {
        // ignore
      }
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
  }
}); // <--- Added closing bracket here

// @desc    Generate single-page PDF report for DIY Caravan/Trailer Only (Registered) - Portable Scales (Individual Tyre Weights)
// @route   POST /api/weighs/diy-caravan-only-registered/report
// @access  Private
router.post('/diy-caravan-only-registered/report', protect, async (req, res) => {
  let doc;
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const debug =
      String(req.query?.debug || '').trim() === '1' ||
      payload.debug === true;
    const header = payload.header && typeof payload.header === 'object' ? payload.header : {};
    const trailerInfo = payload.trailerInfo && typeof payload.trailerInfo === 'object' ? payload.trailerInfo : {};
    const waterTanks = payload.waterTanks && typeof payload.waterTanks === 'object' ? payload.waterTanks : {};
    const tyreWeigh = payload.tyreWeigh && typeof payload.tyreWeigh === 'object' ? payload.tyreWeigh : {};
    const capacities = payload.capacities && typeof payload.capacities === 'object' ? payload.capacities : {};
    const notes = payload.notes != null ? String(payload.notes) : '';

    const methodSelection = String(
      payload.methodSelection ||
        payload.diyMethodSelection ||
        payload?.weights?.diyMethodSelection ||
        payload?.weights?.raw?.methodSelection ||
        payload?.weights?.raw?.diyMethodSelection ||
        ''
    ).trim();
    const isTareWeighbridgeMethod =
      methodSelection === 'GoWeigh Weighbridge' ||
      methodSelection === 'Weighbridge - In Ground -' ||
      methodSelection === 'Weighbridge - goweigh' ||
      methodSelection === 'Weighbridge - In Ground - Individual Axle Weights' ||
      String(methodSelection).toLowerCase().includes('goweigh');

    const weighingSelection = String(payload.weighingSelection || payload.diyWeighingSelection || '').trim();
    const isCustomBuildTrailerTare =
      payload.customBuildTrailerTare === true ||
      weighingSelection === 'custom_build_trailer_tare' ||
      weighingSelection === 'trailer_tare' ||
      weighingSelection === 'caravan_only_tare';

    const headerLooksEmpty =
      !String(header?.customerName || '').trim() &&
      !String(header?.caravanRego || '').trim() &&
      !String(header?.caravanMake || '').trim() &&
      !String(header?.caravanModel || '').trim();

    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const safeNum = (v) => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const fmtKg = (v) => {
      const n = safeNum(v);
      return n == null ? '-' : `${Math.round(n)}kg`;
    };

    const axleConfigLabel = String(tyreWeigh.axleConfig || '');
    const axleConfigLower = axleConfigLabel.toLowerCase();
    const isSingleAxle = axleConfigLower === 'single axle';
    const isDualAxle = axleConfigLower === 'dual axle';
    const isTripleAxle = axleConfigLower === 'triple axle';

    const topDownDiagramPath = isTripleAxle
      ? resolveTemplatePath('Caravan:Trailer Only (Registered)-3.png')
      : isDualAxle
        ? resolveTemplatePath('Caravan:Trailer Only (Registered)-2.png')
        : resolveTemplatePath('Caravan:Trailer Only (Registered)-1.png');

    const sideViewPath = isTripleAxle
      ? resolveTemplatePath('triple-axle-trailer.png')
      : isDualAxle
        ? (resolveTemplatePath('double-axle-trailer.png') || resolveTemplatePath('dual-axle-trailer.png'))
        : resolveTemplatePath('single-axle-trailer.png');

    const useTareLayout = isTareWeighbridgeMethod || isCustomBuildTrailerTare;
    const shouldShowTopDownDiagram = !useTareLayout || (isCustomBuildTrailerTare && !isTareWeighbridgeMethod);

    if (shouldShowTopDownDiagram && !topDownDiagramPath) {
      throw new Error('Caravan-only registered top-down diagram image not found');
    }
    if (!sideViewPath) {
      throw new Error('Caravan-only registered side-view trailer image not found');
    }

    // eslint-disable-next-line no-console
    console.log('DIY caravan-only registered report asset selection', {
      axleConfigLabel,
      sideViewPath,
      topDownDiagramPath,
      methodSelection,
      isTareWeighbridgeMethod,
    });

    const tbmMeasuredExplicit =
      safeNum(tyreWeigh.rightTowBallWeight) ||
      safeNum(tyreWeigh.towBallMass) ||
      safeNum(tyreWeigh.towballMass) ||
      safeNum(tyreWeigh.tbm) ||
      safeNum(payload.towBallMass) ||
      safeNum(payload.towballMass) ||
      safeNum(payload.tbm) ||
      safeNum(payload.axleWeigh?.tbm) ||
      null;

    let gtmMeasured = 0;
    if (isSingleAxle) {
      gtmMeasured = (safeNum(tyreWeigh.single?.left) || 0) + (safeNum(tyreWeigh.single?.right) || 0);
    } else if (isDualAxle) {
      gtmMeasured =
        (safeNum(tyreWeigh.dual?.frontLeft) || 0) +
        (safeNum(tyreWeigh.dual?.frontRight) || 0) +
        (safeNum(tyreWeigh.dual?.rearLeft) || 0) +
        (safeNum(tyreWeigh.dual?.rearRight) || 0);
    } else if (isTripleAxle) {
      gtmMeasured =
        (safeNum(tyreWeigh.triple?.frontLeft) || 0) +
        (safeNum(tyreWeigh.triple?.frontRight) || 0) +
        (safeNum(tyreWeigh.triple?.middleLeft) || 0) +
        (safeNum(tyreWeigh.triple?.middleRight) || 0) +
        (safeNum(tyreWeigh.triple?.rearLeft) || 0) +
        (safeNum(tyreWeigh.triple?.rearRight) || 0);
    }

    const atmMeasuredExplicit =
      safeNum(tyreWeigh.atmMeasured) ||
      safeNum(tyreWeigh.atm) ||
      safeNum(payload.atmMeasured) ||
      safeNum(payload.atm) ||
      null;

    // If ATM is supplied but TBM is not, derive TBM so the TowBall and ATM numbers
    // match the results screen logic.
    const tbmMeasured = tbmMeasuredExplicit != null
      ? tbmMeasuredExplicit
      : (atmMeasuredExplicit != null && gtmMeasured > 0)
        ? Math.max(0, atmMeasuredExplicit - gtmMeasured)
        : 0;

    const atmMeasured = atmMeasuredExplicit != null
      ? atmMeasuredExplicit
      : Math.max(0, gtmMeasured + tbmMeasured);

    const tbmCapacity = safeNum(capacities.tbm);
    const gtmCapacity = safeNum(capacities.gtm);
    const atmCapacity = safeNum(capacities.atm);

    const okText = (ok) => (ok ? 'OK' : 'Over');
    const tbmOk = tbmCapacity == null ? true : tbmMeasured <= tbmCapacity;
    const gtmOk = gtmCapacity == null ? true : gtmMeasured <= gtmCapacity;
    const atmOk = atmCapacity == null ? true : atmMeasured <= atmCapacity;

    const pageW = 842;
    const pageH = 595;

    doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-caravan-only-registered.pdf');
    doc.pipe(res);

    // Text helper (must be defined before first use)
    const drawText = (text, x, y, opts = {}) => {
      const { size = 12, width = 140, align = 'center' } = opts;
      doc.save();
      doc.fillColor('#000000');
      doc.fontSize(size);
      doc.text(String(text ?? ''), x, y, { width, align });
      doc.restore();
    };

    // White page background
    doc.save();
    doc.fillColor('#ffffff');
    doc.rect(0, 0, pageW, pageH).fill();
    doc.restore();

    // Layout constants (tuned to match the reference screenshots)
    const headerY = 18;
    const headerH1 = 22;
    const headerH2 = 22;
    const headerLeftX = 210;
    const headerTotalW = 620;
    const headerCols = [95, 185, 110, 230]; // Date, Customer, Time, Location

    const infoY = headerY + headerH1;
    const infoH = headerH2;
    const infoCols = [110, 170, 170, 170]; // Trailer Rego, Make, Model, (spare)

    const leftAreaX = 40;
    const leftAreaY = 120;
    const leftAreaW = 520;
    const leftAreaH = 250;

    const rightAreaX = 590;
    const rightAreaY = 90;
    const rightAreaW = 220;
    const rightAreaH = 300;

    const bottomY = 395;
    const bottomH = 160;

    const drawLineRect = (x, y, w, h, stroke = '#d0d0d0') => {
      doc.save();
      doc.strokeColor(stroke);
      doc.lineWidth(1);
      doc.rect(x, y, w, h).stroke();
      doc.restore();
    };

    const fillRect = (x, y, w, h, color) => {
      doc.save();
      doc.fillColor(color);
      doc.rect(x, y, w, h).fill();
      doc.restore();
    };

    // Header blocks (grey bars)
    fillRect(headerLeftX, headerY, headerTotalW, headerH1, '#efefef');
    fillRect(headerLeftX, infoY, headerTotalW, infoH, '#ffffff');

    // Header grid lines
    {
      let x = headerLeftX;
      drawLineRect(headerLeftX, headerY, headerTotalW, headerH1 + infoH);
      for (let i = 0; i < headerCols.length - 1; i++) {
        x += headerCols[i];
        doc.save();
        doc.strokeColor('#d0d0d0');
        doc.moveTo(x, headerY).lineTo(x, headerY + headerH1).stroke();
        doc.restore();
      }
      // Horizontal split
      doc.save();
      doc.strokeColor('#d0d0d0');
      doc.moveTo(headerLeftX, infoY).lineTo(headerLeftX + headerTotalW, infoY).stroke();
      doc.restore();
    }

    // Second row (Trailer Rego/Make/Model) columns
    {
      let x = headerLeftX;
      for (let i = 0; i < infoCols.length - 1; i++) {
        x += infoCols[i];
        doc.save();
        doc.strokeColor('#d0d0d0');
        doc.moveTo(x, infoY).lineTo(x, infoY + infoH).stroke();
        doc.restore();
      }
    }

    // Header labels
    const labelStyle = { size: 8, width: 120, align: 'left' };
    drawText('Date', headerLeftX + 6, headerY + 6, labelStyle);
    drawText('Customer Name', headerLeftX + headerCols[0] + 6, headerY + 6, labelStyle);
    drawText('Time', headerLeftX + headerCols[0] + headerCols[1] + 6, headerY + 6, labelStyle);
    drawText('Location', headerLeftX + headerCols[0] + headerCols[1] + headerCols[2] + 6, headerY + 6, labelStyle);

    drawText('Trailer Rego', headerLeftX + 6, infoY + 6, labelStyle);
    drawText('Make', headerLeftX + infoCols[0] + 6, infoY + 6, labelStyle);
    drawText('Model', headerLeftX + infoCols[0] + infoCols[1] + 6, infoY + 6, labelStyle);

    // Header values
    const valueStyle = { size: 9, width: 180, align: 'left' };
    drawText(header.date || '', headerLeftX + 6, headerY + 14, { ...valueStyle, width: headerCols[0] - 12 });
    drawText(header.customerName || '', headerLeftX + headerCols[0] + 6, headerY + 14, { ...valueStyle, width: headerCols[1] - 12 });
    drawText(header.time || '', headerLeftX + headerCols[0] + headerCols[1] + 6, headerY + 14, { ...valueStyle, width: headerCols[2] - 12 });
    drawText(header.location || '', headerLeftX + headerCols[0] + headerCols[1] + headerCols[2] + 6, headerY + 14, { ...valueStyle, width: headerCols[3] - 12 });

    drawText(trailerInfo.rego || header.caravanRego || '', headerLeftX + 6, infoY + 14, { ...valueStyle, width: infoCols[0] - 12 });
    drawText(trailerInfo.make || header.caravanMake || '', headerLeftX + infoCols[0] + 6, infoY + 14, { ...valueStyle, width: infoCols[1] - 12 });
    drawText(trailerInfo.model || header.caravanModel || '', headerLeftX + infoCols[0] + infoCols[1] + 6, infoY + 14, { ...valueStyle, width: infoCols[2] - 12 });

    // Main images
    try {
      doc.image(sideViewPath, leftAreaX + 110, leftAreaY + 30, { fit: [leftAreaW - 120, leftAreaH - 40] });
    } catch (e) {
      console.error('Failed to render side-view trailer image:', e?.message || e);
    }
    if (shouldShowTopDownDiagram) {
      try {
        // Top-down is portrait; fit into right area
        doc.image(topDownDiagramPath, rightAreaX + 45, rightAreaY + 30, { fit: [rightAreaW - 70, rightAreaH - 60] });
      } catch (e) {
        console.error('Failed to render top-down diagram image:', e?.message || e);
      }
    }

    // Diagram labels
    drawText('TowBall kg', leftAreaX + 10, leftAreaY + 115, { size: 14, width: 120, align: 'left' });
    drawText('Axle Weight kg', leftAreaX + 215, leftAreaY + 220, { size: 14, width: 220, align: 'center' });

    // Main measured overlays
    drawText(fmtKg(tbmMeasured), leftAreaX + 15, leftAreaY + 155, { size: 12, width: 120, align: 'left' });
    if (isSingleAxle) {
      drawText(fmtKg(gtmMeasured), leftAreaX + 220, leftAreaY + 250, { size: 12, width: 220, align: 'center' });
      if (shouldShowTopDownDiagram) {
        drawText(fmtKg(tyreWeigh.single?.left), rightAreaX - 40, rightAreaY + 170, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.single?.right), rightAreaX + rightAreaW - 60, rightAreaY + 170, { size: 11, width: 100, align: 'left' });
      }
    } else if (isDualAxle) {
      const frontAxleTotal = (safeNum(tyreWeigh.dual?.frontLeft) || 0) + (safeNum(tyreWeigh.dual?.frontRight) || 0);
      const rearAxleTotal = (safeNum(tyreWeigh.dual?.rearLeft) || 0) + (safeNum(tyreWeigh.dual?.rearRight) || 0);

      // Axle totals under the side view (approx positions matching reference)
      drawText(fmtKg(frontAxleTotal), leftAreaX + 185, leftAreaY + 250, { size: 12, width: 160, align: 'center' });
      drawText(fmtKg(rearAxleTotal), leftAreaX + 340, leftAreaY + 250, { size: 12, width: 160, align: 'center' });

      // Tyre weights around top-down diagram
      if (shouldShowTopDownDiagram) {
        drawText(fmtKg(tyreWeigh.dual?.frontLeft), rightAreaX - 40, rightAreaY + 150, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.dual?.frontRight), rightAreaX + rightAreaW - 60, rightAreaY + 150, { size: 10, width: 100, align: 'left' });
        drawText(fmtKg(tyreWeigh.dual?.rearLeft), rightAreaX - 40, rightAreaY + 215, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.dual?.rearRight), rightAreaX + rightAreaW - 60, rightAreaY + 215, { size: 10, width: 100, align: 'left' });
      }
    } else if (isTripleAxle) {
      const frontAxleTotal = (safeNum(tyreWeigh.triple?.frontLeft) || 0) + (safeNum(tyreWeigh.triple?.frontRight) || 0);
      const middleAxleTotal = (safeNum(tyreWeigh.triple?.middleLeft) || 0) + (safeNum(tyreWeigh.triple?.middleRight) || 0);
      const rearAxleTotal = (safeNum(tyreWeigh.triple?.rearLeft) || 0) + (safeNum(tyreWeigh.triple?.rearRight) || 0);

      // Axle totals under the side view (approx positions matching reference)
      drawText(fmtKg(frontAxleTotal), leftAreaX + 145, leftAreaY + 250, { size: 12, width: 150, align: 'center' });
      drawText(fmtKg(middleAxleTotal), leftAreaX + 270, leftAreaY + 250, { size: 12, width: 150, align: 'center' });
      drawText(fmtKg(rearAxleTotal), leftAreaX + 395, leftAreaY + 250, { size: 12, width: 150, align: 'center' });

      // Tyre weights around top-down diagram
      if (shouldShowTopDownDiagram) {
        drawText(fmtKg(tyreWeigh.triple?.frontLeft), rightAreaX - 40, rightAreaY + 140, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.triple?.frontRight), rightAreaX + rightAreaW - 60, rightAreaY + 140, { size: 10, width: 100, align: 'left' });
        drawText(fmtKg(tyreWeigh.triple?.middleLeft), rightAreaX - 40, rightAreaY + 195, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.triple?.middleRight), rightAreaX + rightAreaW - 60, rightAreaY + 195, { size: 10, width: 100, align: 'left' });
        drawText(fmtKg(tyreWeigh.triple?.rearLeft), rightAreaX - 40, rightAreaY + 250, { size: 10, width: 80, align: 'right' });
        drawText(fmtKg(tyreWeigh.triple?.rearRight), rightAreaX + rightAreaW - 60, rightAreaY + 250, { size: 10, width: 100, align: 'left' });
      }
    }

    // (removed) legacy overlay block that referenced diagramX/diagramY and duplicated
    // the new drawn-layout overlays above.

    const drawCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', size = 9, color = '#000000', padL = 8, vPad = 8 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor('#d0d0d0');
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(size);
      doc.text(String(text ?? ''), x + padL, y + vPad, { width: w - padL * 2, align });
      doc.restore();
    };

    if (useTareLayout) {
      // Tare Report bottom layout (matches attachment):
      // Left: Trailer Information table (labels + units + compliance/measured values)
      // Middle: Additional Notes
      // Right: Operators Name / Signature
      const baseY = bottomY + 30;
      const blockH = 120;
      const gap = 12;

      const leftW = 250;
      const midW = 420;
      const rightW = pageW - 40 - gap - leftW - gap - midW;

      const leftX = 40;
      const midX = leftX + leftW + gap;
      const rightX = midX + midW + gap;

      // Left table (4 rows: header + 3 metrics). 3 columns: label | value | unit
      const ltRowH = 28;
      const ltHeaderH = 26;
      const ltH = ltHeaderH + ltRowH * 3;
      fillRect(leftX, baseY, leftW, ltHeaderH, '#ededed');
      drawLineRect(leftX, baseY, leftW, ltH);
      drawText('Trailer Information', leftX + 8, baseY + 8, { size: 9, width: leftW - 16, align: 'left' });

      const ltColLabelW = 170;
      const ltColValueW = 50;
      const ltColUnitW = leftW - ltColLabelW - ltColValueW;

      const metricLabels = ['Towball Mass', 'Gross Trailer Mass (GTM)', 'Aggregated Trailer Mass (ATM)'];
      const metricMeasured = [tbmMeasured, gtmMeasured, atmMeasured];

      for (let i = 0; i < 3; i += 1) {
        const y = baseY + ltHeaderH + i * ltRowH;
        drawCell(leftX, y, ltColLabelW, ltRowH, metricLabels[i], { bg: '#ffffff', size: 9, align: 'left' });
        drawCell(leftX + ltColLabelW, y, ltColValueW, ltRowH, metricMeasured[i] > 0 ? String(Math.round(metricMeasured[i])) : '-', {
          bg: '#ffffff',
          size: 9,
          align: 'center',
          padL: 0,
        });
        drawCell(leftX + ltColLabelW + ltColValueW, y, ltColUnitW, ltRowH, 'kg', { bg: '#ffffff', size: 9, align: 'left' });
      }

      // Middle notes block
      fillRect(midX, baseY, midW, blockH, '#ededed');
      drawLineRect(midX, baseY, midW, blockH);
      drawText('Additional Notes', midX + 10, baseY + 18, { size: 12, width: midW - 20, align: 'left' });
      drawText(notes && notes.trim() !== '' ? notes : '-', midX + 10, baseY + 45, {
        size: 10,
        width: midW - 20,
        align: 'left',
      });

      // Right operator/signature block (two rows)
      fillRect(rightX, baseY, rightW, blockH, '#ededed');
      drawLineRect(rightX, baseY, rightW, blockH);
      const opRowH = blockH / 2;
      doc.save();
      doc.strokeColor('#d0d0d0');
      doc.moveTo(rightX, baseY + opRowH).lineTo(rightX + rightW, baseY + opRowH).stroke();
      doc.restore();
      drawText('Operators Name :', rightX + 10, baseY + 18, { size: 10, width: rightW - 20, align: 'left' });
      drawText('Signature :', rightX + 10, baseY + opRowH + 18, { size: 10, width: rightW - 20, align: 'left' });
    } else {
      // Registered caravan-only bottom table: match the reference layout with columns:
      // Trailer Information | Compliance | Weights Recorded | Result | Trailer Information (Water Tanks)
      const tableX = 40;
      const tableY = bottomY + 30;
      const rowH = 28;
      const headerRowH = 26;
      const tableW = 700;
      const tableH = headerRowH + rowH * 3;

      const colWs = [150, 110, 120, 90, 230];

      // Outer border
      drawLineRect(tableX, tableY, tableW, tableH);

      // Header row
      const headers = ['Trailer Information', 'Compliance', 'Weights Recorded', 'Result', 'Trailer Information'];
      const headerBgs = ['#ededed', '#cdd9ff', '#fff3b0', '#ffffff', '#ededed'];
      let cx = tableX;
      for (let i = 0; i < colWs.length; i += 1) {
        drawCell(cx, tableY, colWs[i], headerRowH, headers[i], { bg: headerBgs[i], size: 9, align: 'left' });
        cx += colWs[i];
      }

      const labels = ['Towball Mass', 'Gross Trailer Mass (GTM)', 'Aggregated Trailer Mass (ATM)'];
      const complianceVals = [tbmCapacity, gtmCapacity, atmCapacity];
      const measuredVals = [tbmMeasured, gtmMeasured, atmMeasured];
      const results = [okText(tbmOk), okText(gtmOk), okText(atmOk)];
      const resultBgs = [tbmOk ? '#1aa64b' : '#e53935', gtmOk ? '#1aa64b' : '#e53935', atmOk ? '#1aa64b' : '#e53935'];

      for (let r = 0; r < labels.length; r += 1) {
        const y = tableY + headerRowH + r * rowH;
        // Col 1: label
        drawCell(tableX, y, colWs[0], rowH, labels[r], { bg: '#ffffff', size: 9, align: 'left' });
        // Col 2: compliance
        drawCell(tableX + colWs[0], y, colWs[1], rowH, fmtKg(complianceVals[r]), { bg: '#cdd9ff', size: 9, align: 'center', padL: 0 });
        // Col 3: weights recorded
        drawCell(tableX + colWs[0] + colWs[1], y, colWs[2], rowH, fmtKg(measuredVals[r]), { bg: '#fff3b0', size: 9, align: 'center', padL: 0 });
        // Col 4: result
        drawCell(tableX + colWs[0] + colWs[1] + colWs[2], y, colWs[3], rowH, results[r], { bg: resultBgs[r], size: 9, align: 'center', color: '#ffffff', padL: 0 });
      }

      // Col 5: Water tanks block spanning rows
      const waterX = tableX + colWs[0] + colWs[1] + colWs[2] + colWs[3];
      const waterY = tableY + headerRowH;
      const waterW = colWs[4];
      const waterH = rowH * 3;
      drawCell(waterX, waterY, waterW, waterH, '', { bg: '#ffffff' });

      // Render water tanks as an internal grid so values cannot overflow outside the cell.
      const waterRowH = waterH / 3;
      const waterLabelW = Math.min(130, Math.floor(waterW * 0.6));
      const waterValueW = waterW - waterLabelW;

      drawCell(waterX, waterY, waterLabelW, waterRowH, 'Number of Tanks', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY,
        waterValueW,
        waterRowH,
        waterTanks.count != null ? String(waterTanks.count) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      drawCell(waterX, waterY + waterRowH, waterLabelW, waterRowH, 'Number Full', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY + waterRowH,
        waterValueW,
        waterRowH,
        waterTanks.fullCount != null ? String(waterTanks.fullCount) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      drawCell(waterX, waterY + waterRowH * 2, waterLabelW, waterRowH, 'Total Water (Ltrs)', { bg: '#ffffff', size: 8, align: 'left' });
      drawCell(
        waterX + waterLabelW,
        waterY + waterRowH * 2,
        waterValueW,
        waterRowH,
        waterTanks.litres != null ? String(waterTanks.litres) : '-',
        { bg: '#ffffff', size: 9, align: 'center', padL: 0 }
      );

      // Notes block to the right (grey), like reference
      const gap = 12;
      const notesX = tableX + tableW + gap;
      const notesY = tableY;
      const notesW = pageW - notesX - 18;
      const notesH = tableH;
      fillRect(notesX, notesY, notesW, notesH, '#ededed');
      drawLineRect(notesX, notesY, notesW, notesH);
      drawText('Additional Notes', notesX + 10, notesY + 18, { size: 12, width: notesW - 20, align: 'left' });
      drawText(notes && notes.trim() !== '' ? notes : '-', notesX + 10, notesY + 45, { size: 10, width: notesW - 20, align: 'left' });
    }

    // Footer
    drawText('powered by weighbuddy', pageW / 2 - 80, pageH - 28, { size: 12, width: 200, align: 'left' });
    drawText('help - FAQ', pageW / 2 + 130, pageH - 28, { size: 12, width: 120, align: 'left' });
    drawText('Terms and Conditions', pageW / 2 + 250, pageH - 28, { size: 12, width: 200, align: 'left' });

    if (debug) {
      const step = 50;
      doc.save();
      doc.lineWidth(0.5);
      doc.strokeColor('#ff0000');
      for (let x = 0; x <= pageW; x += step) {
        doc.moveTo(x, 0).lineTo(x, pageH).stroke();
        doc.fillColor('#ff0000');
        doc.fontSize(6);
        doc.text(String(x), x + 2, 2, { width: 40, align: 'left' });
      }
      for (let y = 0; y <= pageH; y += step) {
        doc.moveTo(0, y).lineTo(pageW, y).stroke();
        doc.fillColor('#ff0000');
        doc.fontSize(6);
        doc.text(String(y), 2, y + 2, { width: 30, align: 'left' });
      }
      doc.restore();

      // If the template is not showing in the downloaded PDF, re-draw it here
      // to confirm whether PDFKit can render this PNG at all.
      try {
        doc.save();
        doc.opacity(0.25);
        doc.image(backgroundTemplatePath, 0, 0, { width: pageW, height: pageH });
        doc.opacity(1);
        doc.restore();
      } catch (dbgBgErr) {
        console.error('DEBUG: failed to render caravan-only background template:', dbgBgErr?.message || dbgBgErr);
      }
    }

    doc.end();
  } catch (error) {
    console.error('DIY caravan-only registered PDF generation error:', error);
    if (res.headersSent) {
      // If we've already started streaming PDF bytes, avoid writing any JSON.
      // Also avoid calling res.end() directly because PDFKit may still emit data
      // events briefly; just end the PDF doc if possible.
      try {
        if (doc && !doc.ended) doc.end();
      } catch (e) {
        // ignore
      }
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
  }
});

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

    const axleConfigStr =
      payload && payload.tyreWeigh && typeof payload.tyreWeigh === 'object'
        ? String(payload.tyreWeigh.axleConfig || '').toLowerCase()
        : '';
    const isDualAxleCaravan = axleConfigStr === 'dual axle';
    const isTripleAxleCaravan = axleConfigStr === 'triple axle';
    const isTowTrailer =
      String(payload?.weighingSelection || '').toLowerCase() === 'tow_vehicle_and_trailer' ||
      String(payload?.diyWeighingSelection || '').toLowerCase() === 'tow_vehicle_and_trailer' ||
      Boolean(payload?.isTowTrailer);
    const isTowBoat =
      String(payload?.weighingSelection || '').toLowerCase() === 'tow_vehicle_and_boat' ||
      String(payload?.diyWeighingSelection || '').toLowerCase() === 'tow_vehicle_and_boat' ||
      Boolean(payload?.isTowBoat);

    // eslint-disable-next-line no-console
    console.log('report-1 template selection', {
      weighingSelection: payload?.weighingSelection,
      diyWeighingSelection: payload?.diyWeighingSelection,
      isTowTrailer,
      isTowBoat,
      axleConfigStr,
      isDualAxleCaravan,
      isTripleAxleCaravan,
    });

    const resolveTemplatePath = (filename) => {
      // ...
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const templatePath = isTripleAxleCaravan
      ? resolveTemplatePath('tri-axle-first.png')
      : isTowTrailer
        ? (isDualAxleCaravan
            ? resolveTemplatePath('vehicle-dual-axle-trailer.png')
            : resolveTemplatePath('vehicle-single-axle-trailer.png'))
        : isTowBoat
          ? (isDualAxleCaravan
              ? resolveTemplatePath('vehicle-dual-axle-boat.png')
              : resolveTemplatePath('vehicle-single-axle-boat.png'))
          : isDualAxleCaravan
            ? resolveTemplatePath('dual-axle-cravan.png')
            : resolveTemplatePath('single-axle-caravan.png') ||
              resolveTemplatePath('Portable Scales - Individual Tyre Weights.jpg');

    // eslint-disable-next-line no-console
    console.log('report-1 resolved template', {
      templatePath,
      templateFilename: templatePath ? path.basename(templatePath) : null,
    });
    if (!templatePath) {
      throw new Error(
        `Template image not found: ${path.join(__dirname, '..', 'assets', isTripleAxleCaravan ? 'tri-axle-first.png' : isDualAxleCaravan ? 'dual-axle-cravan.png' : 'single-axle-caravan.png')} (or legacy Portable Scales - Individual Tyre Weights.jpg)`
      );
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-1.pdf');

    doc.pipe(res);

    const logoPath = resolvePdfLogoPath(req, resolveTemplatePath);
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
      // Leave clear space for the header grid (date/name/time/location + car rego/make).
      doc.image(templatePath, 120, 95, {
        fit: [640, 220],
        align: 'center',
        valign: 'center',
        // crop: [0, 150, 1800, 700]
      });
    } catch (imgErr) {
      // If cropping is not supported for the image type, fall back to a smaller render.
      doc.image(templatePath, 60, 95, { fit: [720, 300], align: 'center', valign: 'top' });
    }

    const safeText = (v) => (v == null ? '' : String(v));
    const safeNum = (v) => {
      if (v == null || v === '') return 'N/A';
      const n = Number(v);
      return Number.isFinite(n) ? String(Math.round(n)) : 'N/A';
    };
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

    // Header grid (match report-2 styling)
    const headerBorderColor = '#bdbdbd';
    const headerTitleBg = '#f5f5f5';

    const drawHeaderCell = (x, y, w, h, text, opts = {}) => {
      const { bg = null, align = 'left', fontSize = 9, color = '#000000', padL = 6, padR = 6 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor(headerBorderColor);
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
    doc.strokeColor(headerBorderColor);
    doc.rect(headerX, headerY, headerW, headerRowH + headerRow2H).stroke();
    doc.restore();

    const cols1 = [110, 190, 110, 190];
    const labels1 = ['Date', 'Customer Name', 'Time', 'Location'];
    const values1 = [safeText(header.date), safeText(header.customerName), safeText(header.time || ''), safeText(header.location || '')];
    let cx = headerX;
    for (let i = 0; i < cols1.length; i += 1) {
      drawHeaderCell(cx, headerY, cols1[i], headerRowH, labels1[i], { bg: headerTitleBg, fontSize: 8 });
      drawHeaderCell(cx, headerY + headerRowH, cols1[i], headerRow2H, values1[i], { fontSize: 9 });
      cx += cols1[i];
    }

    const row2Y = headerY + headerRowH + headerRow2H + 2;
    const row2Cols = [110, 380, 110];
    const row2Labels = ['Car Rego', 'Make', ''];
    const resolvedCarRego =
      safeText(header.carRego) ||
      safeText(header.rego) ||
      safeText(header.vehicleNumberPlate) ||
      safeText(payload.vehicleNumberPlate) ||
      safeText(payload.rego) ||
      '';
    const resolvedCarMake =
      safeText(header.carMake) ||
      safeText(header.make) ||
      safeText(header.vehicleDescription) ||
      safeText(payload.vehicleDescription) ||
      safeText(payload.description) ||
      '';
    const row2Values = [resolvedCarRego, resolvedCarMake, ''];
    cx = headerX;
    for (let i = 0; i < row2Cols.length; i += 1) {
      if (row2Labels[i] !== '') {
        drawHeaderCell(cx, row2Y, row2Cols[i], headerRowH, row2Labels[i], { bg: headerTitleBg, fontSize: 8 });
        drawHeaderCell(cx, row2Y + headerRowH, row2Cols[i], headerRow2H, row2Values[i], { fontSize: 9 });
      } else {
        drawHeaderCell(cx, row2Y, row2Cols[i], headerRowH + headerRow2H, '', { bg: '#ffffff' });
      }
      cx += row2Cols[i];
    }

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

    const resolvedMethodSelection = String(payload?.methodSelection || payload?.diyMethodSelection || '');
    const isAboveGroundSingleCellByName =
      resolvedMethodSelection ===
      'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.';

    const inferAboveGroundSingleCell = (() => {
      const wr = weightsRecorded && typeof weightsRecorded === 'object' ? weightsRecorded : {};
      const hasGcm = Number.isFinite(Number(wr.gcm)) && Number(wr.gcm) > 0;
      const hasAtm = Number.isFinite(Number(wr.atm)) && Number(wr.atm) > 0;
      const missingAxles = Number(wr.frontAxle) === 0 && Number(wr.rearAxle) === 0;
      const missingGvm = Number(wr.gvm) === 0;
      return hasGcm && hasAtm && missingAxles && missingGvm;
    })();

    const isAboveGroundSingleCell = isAboveGroundSingleCellByName || inferAboveGroundSingleCell;

    const weightsRecordedFrontAxleForPdf = isAboveGroundSingleCell ? null : weightsRecorded.frontAxle;
    const weightsRecordedRearAxleForPdf = isAboveGroundSingleCell ? null : weightsRecorded.rearAxle;
    // NOTE: For Above Ground Single Cell, this (report-1) page is the combined (hitched)
    // table. Do NOT derive tow-vehicle GVM here. The derived GVM = (GCM - ATM) should be
    // shown on the vehicle-only (unhitched) page instead.
    const weightsRecordedGvmForPdf = isAboveGroundSingleCell ? null : weightsRecorded.gvm;

    const dbgTowSingleCell = {
      isAboveGroundSingleCell,
      methodSelection: resolvedMethodSelection || (inferAboveGroundSingleCell ? 'INFERRED_SINGLE_CELL' : ''),
      weightsRecorded: {
        frontAxle: weightsRecorded.frontAxle,
        rearAxle: weightsRecorded.rearAxle,
        gvm: weightsRecorded.gvm,
        atm: weightsRecorded.atm,
        gcm: weightsRecorded.gcm,
      },
      computed: {
        weightsRecordedFrontAxleForPdf,
        weightsRecordedRearAxleForPdf,
        weightsRecordedGvmForPdf,
        rendered: {
          frontAxle: safeNum(weightsRecordedFrontAxleForPdf),
          rearAxle: safeNum(weightsRecordedRearAxleForPdf),
          gvm: safeNum(weightsRecordedGvmForPdf),
        },
      },
    };

    const weightsRecordedTbmForPdf = isAboveGroundSingleCell && Number(weightsRecorded.tbm) === 0 ? null : weightsRecorded.tbm;
    const weightsRecordedGtmForPdf = isAboveGroundSingleCell && Number(weightsRecorded.gtm) === 0 ? null : weightsRecorded.gtm;

    drawRow(valueRowY.weights, [
      weightsRecordedFrontAxleForPdf,
      (() => {
        const hitch = vci01 && typeof vci01 === 'object' ? vci01.hitchWeigh : null;
        if (!hitch || typeof hitch !== 'object') return weightsRecordedGvmForPdf;
        const fl = Number(hitch.frontLeft);
        const fr = Number(hitch.frontRight);
        const rl = Number(hitch.rearLeft);
        const rr = Number(hitch.rearRight);
        const nums = [fl, fr, rl, rr].filter((n) => Number.isFinite(n));
        if (nums.length < 2) return weightsRecordedGvmForPdf;
        const sum = nums.reduce((a, b) => a + b, 0);
        return sum > 0 ? sum : weightsRecordedGvmForPdf;
      })(),
      (() => {
        const hitch = vci01 && typeof vci01 === 'object' ? vci01.hitchWeigh : null;
        if (!hitch || typeof hitch !== 'object') return weightsRecordedRearAxleForPdf;
        const rl = Number(hitch.rearLeft);
        const rr = Number(hitch.rearRight);
        const nums = [rl, rr].filter((n) => Number.isFinite(n));
        if (nums.length < 2) return weightsRecordedRearAxleForPdf;
        const sum = nums.reduce((a, b) => a + b, 0);
        return sum > 0 ? sum : weightsRecordedRearAxleForPdf;
      })(),
      weightsRecordedTbmForPdf,
      weightsRecorded.atm,
      weightsRecordedGtmForPdf,
      weightsRecorded.gcm,
      weightsRecorded.btc,
    ]);

    drawRow(valueRowY.capacity, [
      isAboveGroundSingleCell ? null : capacity.frontAxle,
      capacity.gvm,
      isAboveGroundSingleCell ? null : capacity.rearAxle,
      isAboveGroundSingleCell ? null : capacity.tbm,
      capacity.atm,
      isAboveGroundSingleCell ? null : capacity.gtm,
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

    // Bottom blocks: Car Information (left), Advisory Only (middle), Additional Notes (right)
    const blocksTop = 455;
    const titleH = 22;

    const drawBoxTitle = (x, y, w, h, title) => {
      doc.save();
      doc.fillColor('#f5f5f5');
      doc.rect(x, y, w, h).fillAndStroke('#f5f5f5', '#bdbdbd');
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(String(title), x + 8, y + 6, { width: w - 16, align: 'left' });
      doc.restore();
    };

    // Car Information
    const carX = 70;
    const carY = blocksTop;
    const carW = 260;
    drawBoxTitle(carX, carY, carW, titleH, 'Car Information');
    const carTableY = carY + titleH;
    const infoRowH = 22;
    const infoLabelW = 120;
    drawHeaderCell(carX, carTableY, infoLabelW, infoRowH, 'Fuel');
    drawHeaderCell(
      carX + infoLabelW,
      carTableY,
      carW - infoLabelW,
      infoRowH,
      carInfo.fuelLevel != null ? `${carInfo.fuelLevel}%` : '-',
      { align: 'center' }
    );
    drawHeaderCell(carX, carTableY + infoRowH, infoLabelW, infoRowH, 'Passengers');
    drawHeaderCell(carX + infoLabelW, carTableY + infoRowH, (carW - infoLabelW) / 2, infoRowH, 'Front', { align: 'center' });
    drawHeaderCell(
      carX + infoLabelW + (carW - infoLabelW) / 2,
      carTableY + infoRowH,
      (carW - infoLabelW) / 2,
      infoRowH,
      'Rear',
      { align: 'center' }
    );
    drawHeaderCell(
      carX + infoLabelW,
      carTableY + infoRowH * 2,
      (carW - infoLabelW) / 2,
      infoRowH,
      carInfo.passengersFront ?? '-',
      { align: 'center' }
    );
    drawHeaderCell(
      carX + infoLabelW + (carW - infoLabelW) / 2,
      carTableY + infoRowH * 2,
      (carW - infoLabelW) / 2,
      infoRowH,
      carInfo.passengersRear ?? '-',
      { align: 'center' }
    );

    // Advisory Only
    const advX = carX + carW + 20;
    const advY = blocksTop;
    const advW = 240;
    drawBoxTitle(advX, advY, advW, titleH, 'Advisory Only');
    const advTableY = advY + titleH;
    const advRowH = 22;
    const advLabelW = 200;
    const advValW = advW - advLabelW;

    const pctVal = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
    const advisoryCellColorLt = (pct, okIfLt) => {
      if (pct == null) return '#eeeeee';
      return pct < okIfLt ? '#1aa64b' : '#e53935';
    };

    const vanToCar = pctVal(advisory.vanToCarRatioPct);
    drawHeaderCell(advX, advTableY, advLabelW, advRowH, 'Trailer / Caravan to Car Ratio <85%');
    drawHeaderCell(
      advX + advLabelW,
      advTableY,
      advValW,
      advRowH,
      vanToCar == null ? '-' : `${Math.round(vanToCar)}%`,
      { bg: advisoryCellColorLt(vanToCar, 85), align: 'center', color: '#ffffff' }
    );

    const towBallPct = pctVal(advisory.towBallPct);
    drawHeaderCell(advX, advTableY + advRowH, advLabelW, advRowH, 'Towball % (8% to 12%)');
    const towBallOk = towBallPct != null && towBallPct >= 8 && towBallPct <= 12;
    drawHeaderCell(
      advX + advLabelW,
      advTableY + advRowH,
      advValW,
      advRowH,
      towBallPct == null ? '-' : `${Math.round(towBallPct)}%`,
      { bg: towBallPct == null ? '#eeeeee' : towBallOk ? '#1aa64b' : '#e53935', align: 'center', color: '#ffffff' }
    );

    const btcPct = pctVal(advisory.btcPct);
    drawHeaderCell(advX, advTableY + advRowH * 2, advLabelW, advRowH, 'Braked Towing Capacity Ratio <80%');
    drawHeaderCell(
      advX + advLabelW,
      advTableY + advRowH * 2,
      advValW,
      advRowH,
      btcPct == null ? '-' : `${Math.round(btcPct)}%`,
      { bg: advisoryCellColorLt(btcPct, 80), align: 'center', color: '#ffffff' }
    );

    // Additional Notes
    const notesX = advX + advW + 20;
    const notesY = blocksTop;
    const notesW = 842 - notesX - 20;
    drawBoxTitle(notesX, notesY, notesW, titleH, 'Additional Notes');
    const notesBodyY = notesY + titleH;
    const notesBodyH = infoRowH * 3;
    const notesPadL = 8;
    const notesPadR = 18;
    doc.save();
    doc.strokeColor('#bdbdbd');
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
    console.error('DIY tow+caravan portable single-axle report-1 error:', error);
    if (res.headersSent) {
      try {
        if (doc && !doc.ended) doc.end();
      } catch (e) {
        // ignore
      }
      try {
        res.end();
      } catch (e) {
        // ignore
      }
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
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

    const templateAPath = resolveTemplatePath('Portable Scales - Individual Tyre Weights-a.png');
    const templateBPath = resolveTemplatePath('Portable Scales - Individual Tyre Weights-b.jpg');
    if (!templateAPath) {
      throw new Error(`Template image not found: ${path.join(__dirname, '..', 'assets', 'Portable Scales - Individual Tyre Weights-a.png')}`);
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-2.pdf');

    doc.pipe(res);

    const logoPath = resolvePdfLogoPath(req, resolveTemplatePath);
    if (logoPath) {
      try {
        doc.image(logoPath, 18, 16, { fit: [155, 52], align: 'left', valign: 'top' });
      } catch (e) {
        // ignore logo render errors
      }
    }

    const payload = req.body || {};
    const renderMode = String(payload.report2RenderMode || '').toUpperCase();
    const aOnly = renderMode === 'A_ONLY';
    const header = payload.header || {};
    const compliance = payload.compliance || {};
    const weightsRecorded = payload.weightsRecorded || {};
    const capacity = payload.capacity || {};
    const result = payload.result || {};
    const carInfo = payload.carInfo || {};
    const notes = payload.notes || '';
    const vci01 = payload.vci01 || {};
    const vci02 = payload.vci02 || {};

    const borderColor = '#bdbdbd';
    const titleBg = '#f5f5f5';

    const safeNum = (v) => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const fmtKg = (v) => {
      const n = safeNum(v);
      return n == null ? '-' : `${Math.round(n)} kg`;
    };

    const fmtCellNumber = (v) => {
      const n = safeNum(v);
      return n == null ? 'N/A' : String(Math.round(n));
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
    const values1 = [header.date || '', header.customerName || '', header.time || '', header.location || 'Location unavailable'];
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
    doc.image(templateAPath, sideImgX, sideImgY, { fit: [590, 220], align: 'left', valign: 'top' });

    const shouldRenderTyreDiagram =
      String(payload?.methodSelection || '').trim() === 'Portable Scales - Individual Tyre Weights';

    if (shouldRenderTyreDiagram) {
      const topImgX = 630;
      const topImgY = 125;
      if (!aOnly && templateBPath) {
        doc.image(templateBPath, topImgX, topImgY, { fit: [230, 290], align: 'left', valign: 'top' });
      }

      const tyre =
        (vci02 && vci02.unhitchedWeigh) ||
        (vci01 && vci01.hitchWeigh) ||
        {};
      doc.save();
      doc.fillColor('#000000');
      doc.fontSize(10);
      doc.text(fmtKg(tyre.frontLeft), topImgX - 95, topImgY + 85, { width: 90, align: 'right' });
      doc.text(fmtKg(tyre.rearLeft), topImgX - 95, topImgY + 205, { width: 90, align: 'right' });
      doc.text(fmtKg(tyre.frontRight), topImgX + 145, topImgY + 85, { width: 90, align: 'left' });
      doc.text(fmtKg(tyre.rearRight), topImgX + 145, topImgY + 205, { width: 90, align: 'left' });
      doc.restore();
    }

    const tableX = 135;
    const tableY = 270;
    const tableW = 370;
    const labelW = 110;
    const colW = (tableW - labelW) / 3;
    const headerH = 22;
    const rowH = 22;
    const headers = ['Rear Axle', 'GVM', 'Front Axle'];

    const computeUnhitchedAxleWeights = (unhitchedWeigh) => {
      const fl = safeNum(unhitchedWeigh?.frontLeft);
      const fr = safeNum(unhitchedWeigh?.frontRight);
      const rl = safeNum(unhitchedWeigh?.rearLeft);
      const rr = safeNum(unhitchedWeigh?.rearRight);
      if ([fl, fr, rl, rr].some((v) => v == null)) {
        return null;
      }

       // Some flows (notably Above Ground Single Cell) send placeholder 0s for tyre weights.
       // Treat an all-zero set as missing so we don't render 0 axle/GVM values.
      if (fl === 0 && fr === 0 && rl === 0 && rr === 0) {
        return null;
      }

      const frontAxle = fl + fr;
      const rearAxle = rl + rr;
      const gvm = frontAxle + rearAxle;
      return { frontAxle, rearAxle, gvm };
    };

    const resolvedMethodSelection = String(payload?.methodSelection || payload?.diyMethodSelection || '');
    const isAboveGroundSingleCellByName =
      resolvedMethodSelection ===
      'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.';

    const inferAboveGroundSingleCell = (() => {
      const wr = weightsRecorded && typeof weightsRecorded === 'object' ? weightsRecorded : {};
      const hasGcm = Number.isFinite(Number(wr.gcm)) && Number(wr.gcm) > 0;
      const hasAtm = Number.isFinite(Number(wr.atm)) && Number(wr.atm) > 0;
      const missingAxles = Number(wr.frontAxle) === 0 && Number(wr.rearAxle) === 0;
      const missingGvm = Number(wr.gvm) === 0;
      return hasGcm && hasAtm && missingAxles && missingGvm;
    })();

    const isAboveGroundSingleCell = isAboveGroundSingleCellByName || inferAboveGroundSingleCell;

    const computedUnhitched = computeUnhitchedAxleWeights(vci02?.unhitchedWeigh);
    const baseWeightsRecorded = computedUnhitched || {
      rearAxle: weightsRecorded.rearAxle,
      gvm: weightsRecorded.gvm,
      frontAxle: weightsRecorded.frontAxle,
    };

    const derivedUnhitchedGvmForSingleCell = (() => {
      if (!isAboveGroundSingleCell) return null;
      const gcmNum = safeNum(weightsRecorded.gcm);
      const atmNum = safeNum(weightsRecorded.atm);
      if (gcmNum == null || atmNum == null) return null;
      const derived = gcmNum - atmNum;
      return derived > 0 ? derived : null;
    })();

    const effectiveWeightsRecorded = {
      rearAxle: isAboveGroundSingleCell ? null : baseWeightsRecorded.rearAxle,
      gvm: isAboveGroundSingleCell ? derivedUnhitchedGvmForSingleCell ?? baseWeightsRecorded.gvm : baseWeightsRecorded.gvm,
      frontAxle: isAboveGroundSingleCell ? null : baseWeightsRecorded.frontAxle,
    };

    const computeCapacity = (limit, measured) => {
      const lim = safeNum(limit);
      const meas = safeNum(measured);
      if (lim == null || meas == null) return null;
      return lim - meas;
    };

    const effectiveCapacity = {
      rearAxle: isAboveGroundSingleCell ? null : computeCapacity(compliance.rearAxle, effectiveWeightsRecorded.rearAxle) ?? capacity.rearAxle,
      gvm: computeCapacity(compliance.gvm, effectiveWeightsRecorded.gvm) ?? capacity.gvm,
      frontAxle: isAboveGroundSingleCell ? null : computeCapacity(compliance.frontAxle, effectiveWeightsRecorded.frontAxle) ?? capacity.frontAxle,
    };

    const effectiveResult = {
      rearAxle: safeNum(effectiveCapacity.rearAxle) != null ? safeNum(effectiveCapacity.rearAxle) >= 0 : result.rearAxle,
      gvm: safeNum(effectiveCapacity.gvm) != null ? safeNum(effectiveCapacity.gvm) >= 0 : result.gvm,
      frontAxle: safeNum(effectiveCapacity.frontAxle) != null ? safeNum(effectiveCapacity.frontAxle) >= 0 : result.frontAxle,
    };

    const dbgTowReport2 = {
      methodSelection: resolvedMethodSelection,
      isAboveGroundSingleCell,
      weightsRecorded: {
        frontAxle: weightsRecorded.frontAxle,
        rearAxle: weightsRecorded.rearAxle,
        gvm: weightsRecorded.gvm,
        atm: weightsRecorded.atm,
        gcm: weightsRecorded.gcm,
      },
      computed: {
        derivedUnhitchedGvmForSingleCell,
        effectiveWeightsRecorded,
        effectiveCapacity,
      },
      rendered: {
        weightsRecorded: {
          rear: fmtKg(effectiveWeightsRecorded.rearAxle),
          gvm: fmtKg(effectiveWeightsRecorded.gvm),
          front: fmtKg(effectiveWeightsRecorded.frontAxle),
        },
      },
    };

    drawCell(tableX, tableY, labelW, headerH, '', { bg: titleBg, align: 'center', fontSize: 8 });
    for (let i = 0; i < 3; i += 1) {
      drawCell(tableX + labelW + i * colW, tableY, colW, headerH, headers[i], { bg: '#e8f4ff', align: 'center', fontSize: 8 });
    }

    const rowLabels = ['Compliance', 'Weights Recorded', 'Capacity', 'Result'];
    const rowBg = ['#cdd9ff', '#fff3b0', '#eeeeee', '#ffffff'];
    const vals = [
      [compliance.rearAxle, compliance.gvm, compliance.frontAxle],
      [effectiveWeightsRecorded.rearAxle, effectiveWeightsRecorded.gvm, effectiveWeightsRecorded.frontAxle],
      [effectiveCapacity.rearAxle, effectiveCapacity.gvm, effectiveCapacity.frontAxle],
      [okText(effectiveResult.rearAxle), okText(effectiveResult.gvm), okText(effectiveResult.frontAxle)],
    ];

    for (let r = 0; r < rowLabels.length; r += 1) {
      const y = tableY + headerH + r * rowH;
      drawCell(tableX, y, labelW, rowH, rowLabels[r], { bg: rowBg[r], fontSize: 9 });
      for (let c = 0; c < 3; c += 1) {
        const isResult = rowLabels[r] === 'Result';
        const ok = c === 0 ? effectiveResult.rearAxle : c === 1 ? effectiveResult.gvm : effectiveResult.frontAxle;
        const bg =
          isResult
            ? ok
              ? '#1aa64b'
              : '#e53935'
            : rowBg[r];
        const color = isResult ? '#ffffff' : '#000000';
        const text = isResult ? vals[r][c] : fmtCellNumber(vals[r][c]);
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

    // Additional Notes block
    // Keep within the A4 landscape width so it doesn't clip at the right edge.
    const notesX = 350;
    const notesY = blocksTop;
    const notesW = 460;
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
    doc.text(notes && notes.trim() !== '' ? notes : '-', notesX + notesPadL, notesBodyY + 8, {
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
    const payload = req.body || {};

    const axleConfigStr =
      payload && payload.tyreWeigh && typeof payload.tyreWeigh === 'object'
        ? String(payload.tyreWeigh.axleConfig || '').toLowerCase()
        : '';
    const isDualAxleCaravan = axleConfigStr === 'dual axle';
    const isTripleAxleCaravan = axleConfigStr === 'triple axle';

    const isTowBoat =
      String(payload?.weighingSelection || '').toLowerCase() === 'tow_vehicle_and_boat' ||
      String(payload?.diyWeighingSelection || '').toLowerCase() === 'tow_vehicle_and_boat' ||
      Boolean(payload?.isTowBoat);

    const resolveTemplatePath = (filename) => {
      const p = path.join(__dirname, '..', 'assets', filename);
      return fs.existsSync(p) ? p : null;
    };

    const templatePath = isTripleAxleCaravan
      ? resolveTemplatePath('tri-axle-third.png')
      : isTowBoat
        ? (isDualAxleCaravan
            ? resolveTemplatePath('dual-axle-trailer.png')
            : (resolveTemplatePath('single-axle-trailer.jpg') || resolveTemplatePath('single-axle-trailer.png')))
        : isDualAxleCaravan
          ? resolveTemplatePath('dual-axle-trailer.png')
          : resolveTemplatePath('single-axle-trailer.jpg') ||
            resolveTemplatePath('Portable Scales - Individual Tyre Weights-c.jpg');
    if (!templatePath) {
      throw new Error(
        `Template image not found: ${path.join(__dirname, '..', 'assets', isTripleAxleCaravan ? 'tri-axle-third.png' : isDualAxleCaravan ? 'dual-axle-trailer.png' : 'single-axle-trailer.jpg')} (or legacy Portable Scales - Individual Tyre Weights-c.jpg)`
      );
    }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=diy-tow-caravan-portable-single-axle-3.pdf');

    doc.pipe(res);

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
      const { bg = null, align = 'left', fontSize = 9, color = textColor, padL = 6, padR = 6, padT = 4 } = opts;
      doc.save();
      if (bg) {
        doc.fillColor(bg);
        doc.rect(x, y, w, h).fill();
      }
      doc.strokeColor(borderColor);
      doc.rect(x, y, w, h).stroke();
      doc.fillColor(color);
      doc.fontSize(fontSize);
      doc.text(String(text ?? ''), x + padL, y + padT, { width: w - padL - padR, align, ellipsis: true });
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
    const report3LogoPath = resolvePdfLogoPath(req, resolveTemplatePath);
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
      doc.restore();
    }

    const gridX = logoX + logoW + 0;
    const gridY = headerTop;
    const gridW = 842 - gridX - 65;
    const labelH = 18;
    const valueH = 26;

    // Row 1
    const row1Cols = [110, 220, 110, gridW - 110 - 220 - 110];
    const row1Labels = ['Date', 'Customer Name', 'Time', 'Location'];
    const row1Values = [header.date || '', header.customerName || '', header.time || '', header.location || 'Location unavailable'];
    let cx = gridX;
    for (let i = 0; i < row1Cols.length; i += 1) {
      drawCell(cx, gridY, row1Cols[i], labelH, row1Labels[i], { bg: titleBg, fontSize: 8 });
      drawCell(cx, gridY + labelH, row1Cols[i], valueH, row1Values[i], { fontSize: 9 });
      cx += row1Cols[i];
    }

    // Row 2 (Car + Trailer fields)
    const row2Y = gridY + labelH + valueH;
    const row2Cols = [110, 180, 110, 120, gridW - (110 + 180 + 110 + 120)];
    const row2Labels = ['Car Rego', 'Make', 'Trailer Rego', 'Make', 'Model'];
    const row2Values = [
      header.carRego || '',
      header.carMake || '',
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

    const axleConfigLabel = String(tyreWeigh?.axleConfig || '');
    const axleConfigLower = axleConfigLabel.toLowerCase();
    const isDualAxleTrailer = axleConfigLower === 'dual axle';
    const isTripleAxleTrailer = axleConfigLower === 'triple axle';

    const caravanSingleLeft = tyreWeigh?.single?.left;
    const caravanSingleRight = tyreWeigh?.single?.right;

    const caravanDualFL = tyreWeigh?.dual?.frontLeft;
    const caravanDualFR = tyreWeigh?.dual?.frontRight;
    const caravanDualRL = tyreWeigh?.dual?.rearLeft;
    const caravanDualRR = tyreWeigh?.dual?.rearRight;

    const caravanTripleFL = tyreWeigh?.triple?.frontLeft;
    const caravanTripleFR = tyreWeigh?.triple?.frontRight;
    const caravanTripleML = tyreWeigh?.triple?.middleLeft;
    const caravanTripleMR = tyreWeigh?.triple?.middleRight;
    const caravanTripleRL = tyreWeigh?.triple?.rearLeft;
    const caravanTripleRR = tyreWeigh?.triple?.rearRight;

    const carLeftTotal = (safeNum(carFL) || 0) + (safeNum(carRL) || 0);
    const carRightTotal = (safeNum(carFR) || 0) + (safeNum(carRR) || 0);
    const vanLeftTotal = isTripleAxleTrailer
      ? (safeNum(caravanTripleFL) || 0) +
        (safeNum(caravanTripleML) || 0) +
        (safeNum(caravanTripleRL) || 0)
      : isDualAxleTrailer
        ? (safeNum(caravanDualFL) || 0) + (safeNum(caravanDualRL) || 0)
        : safeNum(caravanSingleLeft) || 0;
    const vanRightTotal = isTripleAxleTrailer
      ? (safeNum(caravanTripleFR) || 0) +
        (safeNum(caravanTripleMR) || 0) +
        (safeNum(caravanTripleRR) || 0)
      : isDualAxleTrailer
        ? (safeNum(caravanDualFR) || 0) + (safeNum(caravanDualRR) || 0)
        : safeNum(caravanSingleRight) || 0;

    // Car tyre numbers (positions tuned to template)
    doc.save();
    doc.fillColor('#000000');
    doc.fontSize(10);
    // Right side values
    doc.text(fmtKg(carFR), diagramX + 50, diagramY + 22, { width: 80, align: 'center' });
    doc.text(fmtKg(carRR), diagramX + 157, diagramY + 22, { width: 80, align: 'center' });
    // Left side values
    doc.text(fmtKg(carFL), diagramX + 50, diagramY + 155, { width: 80, align: 'center' });
    doc.text(fmtKg(carRL), diagramX + 157, diagramY + 155, { width: 80, align: 'center' });

    // Trailer tyre values
    if (isTripleAxleTrailer) {
      // Six-tyre overlay for tri axle trailer templates
      // NOTE: coordinates tuned by relative positioning; adjust if template changes.
      doc.text(fmtKg(caravanTripleFR), diagramX + 320, diagramY + 38, { width: 80, align: 'center' });
      doc.text(fmtKg(caravanTripleMR), diagramX + 408, diagramY + 38, { width: 80, align: 'center' });
      doc.text(fmtKg(caravanTripleRR), diagramX + 496, diagramY + 38, { width: 80, align: 'center' });

      doc.text(fmtKg(caravanTripleFL), diagramX + 320, diagramY + 133, { width: 80, align: 'center' });
      doc.text(fmtKg(caravanTripleML), diagramX + 408, diagramY + 133, { width: 80, align: 'center' });
      doc.text(fmtKg(caravanTripleRL), diagramX + 496, diagramY + 133, { width: 80, align: 'center' });
    } else if (isDualAxleTrailer) {
      // Four-tyre overlay for dual axle trailer templates
      doc.text(fmtKg(caravanDualFR), diagramX + 320, diagramY + 50, { width: 90, align: 'center' });
      doc.text(fmtKg(caravanDualRR), diagramX + 415, diagramY + 50, { width: 90, align: 'center' });
      doc.text(fmtKg(caravanDualFL), diagramX + 320, diagramY + 130, { width: 90, align: 'center' });
      doc.text(fmtKg(caravanDualRL), diagramX + 415, diagramY + 130, { width: 90, align: 'center' });
    } else {
      // Left/right overlay for single axle trailer templates
      doc.text(fmtKg(vanRightTotal), diagramX + 390, diagramY + 52, { width: 90, align: 'center' });
      doc.text(fmtKg(vanLeftTotal), diagramX + 390, diagramY + 128, { width: 90, align: 'center' });
    }
    doc.restore();

    // Left/Right KG balance stacks
    const boxW = 70;
    const boxH = 42;
    const boxPad = 10;

    const drawBalanceStack = (x, y, rightKg, leftKg) => {
      const r = safeNum(rightKg) || 0;
      const l = safeNum(leftKg) || 0;
      const diff = Math.abs(r - l);
      const heavySide = r >= l ? 'Right' : 'Left';

      drawCell(x, y, boxW, boxH, `Right\n${Math.round(r)}`, { bg: titleBg, align: 'center', fontSize: 9, padL: boxPad, padR: boxPad });
      drawCell(
        x,
        y + boxH,
        boxW,
        boxH,
        `${heavySide} Heavy\nBy\n${Math.round(diff)}kg`,
        { bg: '#fff3b0', align: 'center', fontSize: 8, padL: boxPad, padR: boxPad }
      );
      drawCell(x, y + boxH * 2, boxW, boxH, `Left\n${Math.round(l)}`, { bg: titleBg, align: 'center', fontSize: 9, padL: boxPad, padR: boxPad });
    };

    const stackY = diagramY + 20;
    const stackGap = 16;
    const leftStackX = Math.max(35, diagramX - boxW - stackGap);
    const rightStackX = Math.min(842 - 35 - boxW, diagramX + diagramW + stackGap);

    // Car balance stack (left of car)
    drawBalanceStack(leftStackX, stackY, carRightTotal, carLeftTotal);
    // Trailer balance stack (right of trailer)
    drawBalanceStack(rightStackX, stackY, vanRightTotal, vanLeftTotal);

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