const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Caravan = require('../models/Caravan');
const CaravanRegistry = require('../models/CaravanRegistry');
const { protect, authorize } = require('../middleware/auth');

// Get all master caravans (for admin dropdowns)
router.get('/master', async (req, res) => {
  try {
    const caravans = await Caravan.find({ isActive: true })
      .select('make model year atm gtm axleCapacity numberOfAxles')
      .sort({ make: 1, model: 1, year: -1 });
    
    res.json({
      success: true,
      data: caravans
    });
  } catch (error) {
    console.error('Error fetching master caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching caravans'
    });
  }
});

// Search caravans by make/model/year (for dropdowns)
router.get('/search', async (req, res) => {
  try {
    const { make, model, year } = req.query;
    const query = { isActive: true };
    
    if (make) query.make = new RegExp(make, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (year) query.year = parseInt(year);
    
    const caravans = await Caravan.find(query)
      .select('make model year atm gtm axleCapacity numberOfAxles bodyType length fuelType')
      .sort({ make: 1, model: 1, year: -1 })
      .limit(50);
    
    // Transform the data to include both field names for compatibility
    const transformedCaravans = caravans.map(caravan => ({
      ...caravan.toObject(),
      axleCount: caravan.numberOfAxles, // Add axleCount field for frontend compatibility
      bodyType: caravan.bodyType || 'N/A',
      length: caravan.length || null,
      fuelType: caravan.fuelType || 'N/A'
    }));
    
    console.log('🔍 Caravan search query:', query);
    console.log('🔍 Found caravans:', transformedCaravans.length);
    console.log('🔍 Sample caravan:', transformedCaravans[0]);
    console.log('🔍 Sample caravan numberOfAxles:', transformedCaravans[0]?.numberOfAxles);
    console.log('🔍 Sample caravan axleCount:', transformedCaravans[0]?.axleCount);
    
    res.json({
      success: true,
      caravans: transformedCaravans
    });
  } catch (error) {
    console.error('Error searching caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching caravans'
    });
  }
});

// Search caravan by number plate (for user input)
router.get('/by-plate/:plate', async (req, res) => {
  try {
    const { plate } = req.params;
    const { state } = req.query;
    
    if (!plate) {
      return res.status(400).json({
        success: false,
        message: 'Number plate is required'
      });
    }
    
    console.log(`🔍 Searching for caravan plate: ${plate.toUpperCase()}, state: ${state?.toUpperCase()}`);
    
    // First, search in caravan registry (master database)
    const registryEntry = await CaravanRegistry.findOne({
      numberPlate: plate.toUpperCase(),
      ...(state && { state: state.toUpperCase() }),
      isActive: true
    }).populate('masterCaravanId');
    
    if (registryEntry) {
      console.log('✅ Caravan found in registry:', registryEntry.numberPlate);

      // Merge VIN/description from latest weigh history if available.
      let historyVin = '';
      let historyDescription = '';
      let historyComplianceImage = '';
      try {
        const Weigh = require('../models/Weigh');
        const weighEntry = await Weigh.findOne({
          'caravanData.numberPlate': plate.toUpperCase(),
          ...(state && { 'caravanData.state': state.toUpperCase() })
        }).sort({ createdAt: -1 });
        historyVin = weighEntry?.caravanData?.vin || '';
        historyDescription = weighEntry?.caravanData?.description || '';
        historyComplianceImage = weighEntry?.caravanData?.complianceImage || '';

        console.log('🔎 /api/caravans/by-plate merge from weigh history', {
          plate: plate?.toUpperCase?.() || plate,
          state: state?.toUpperCase?.() || state,
          historyVin: historyVin ? '[set]' : '[empty]',
          historyDescription: historyDescription ? '[set]' : '[empty]',
          historyComplianceImage: historyComplianceImage ? '[set]' : '[empty]'
        });
      } catch (e) {
        console.warn('Failed to merge caravan VIN/description from weigh history:', e.message);
      }

      return res.json({
        success: true,
        found: true,
        data: {
          numberPlate: registryEntry.numberPlate,
          state: registryEntry.state,
          masterCaravan: {
            ...(registryEntry.masterCaravanId?.toObject
              ? registryEntry.masterCaravanId.toObject()
              : registryEntry.masterCaravanId),
            vin: historyVin || registryEntry.masterCaravanId?.vin || '',
            description: historyDescription || registryEntry.masterCaravanId?.description || '',
            complianceImage:
              historyComplianceImage || registryEntry.masterCaravanId?.complianceImage || ''
          },
          source: 'registry'
        }
      });
    }
    
    // If not found in registry, search in weigh collection for previously used caravans
    console.log('🔍 Caravan not found in registry, searching weigh collection...');
    const Weigh = require('../models/Weigh');

    const plateUpper = plate.toUpperCase();
    const stateUpper = state ? state.toUpperCase() : null;

    // Prefer the most recent weigh that has a compliance image set. This avoids
    // returning an empty complianceImage when the latest weigh entry exists but
    // did not persist the image for some reason.
    const baseWeighQuery = {
      'caravanData.numberPlate': new RegExp(`^${plateUpper}$`, 'i'),
      ...(stateUpper && { 'caravanData.state': new RegExp(`^${stateUpper}$`, 'i') })
    };

    let weighEntry = await Weigh.findOne({
      ...baseWeighQuery,
      'caravanData.complianceImage': { $exists: true, $ne: '' },
    }).sort({ createdAt: -1 });

    if (!weighEntry) {
      weighEntry = await Weigh.findOne(baseWeighQuery).sort({ createdAt: -1 }); // fallback to most recent entry
    }
    
    if (weighEntry && weighEntry.caravanData) {
      console.log('✅ Caravan found in weigh collection:', weighEntry.caravanData.numberPlate);

      console.log('🔎 /api/caravans/by-plate weigh_history complianceImage', {
        plate: plate?.toUpperCase?.() || plate,
        state: state?.toUpperCase?.() || state,
        complianceImage: weighEntry?.caravanData?.complianceImage ? '[set]' : '[empty]'
      });

      return res.json({
        success: true,
        found: true,
        data: {
          numberPlate: weighEntry.caravanData.numberPlate,
          state: weighEntry.caravanData.state,
          masterCaravan: weighEntry.caravanData,
          source: 'weigh_history'
        }
      });
    }
    
    // Caravan not found in either location
    console.log('❌ Caravan not found in registry or weigh collection');
    return res.status(404).json({
      success: false,
      message: 'Caravan not found in database',
      found: false
    });
    
  } catch (error) {
    console.error('Error searching caravan by plate:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching caravan'
    });
  }
});

// Get unique makes for dropdown
router.get('/makes', async (req, res) => {
  try {
    const makes = await Caravan.distinct('make', { isActive: true });
    
    // Sort makes alphabetically
    makes.sort();
    
    res.json({
      success: true,
      makes: makes
    });
  } catch (error) {
    console.error('Error fetching makes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching makes'
    });
  }
});

// Get models for a specific make (using query parameter)
router.get('/models', async (req, res) => {
  try {
    const { make } = req.query;
    if (!make) {
      return res.status(400).json({
        success: false,
        message: 'Make parameter is required'
      });
    }
    
    const models = await Caravan.distinct('model', { 
      make: new RegExp(make, 'i'),
      isActive: true 
    });
    
    // Sort models alphabetically
    models.sort();
    
    res.json({
      success: true,
      models: models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching models'
    });
  }
});

// Get years for a specific make/model (using query parameters)
router.get('/years', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({
        success: false,
        message: 'Make and model parameters are required'
      });
    }
    
    const years = await Caravan.distinct('year', { 
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      isActive: true 
    });
    
    // Sort years in descending order
    years.sort((a, b) => b - a);
    
    res.json({
      success: true,
      years: years
    });
  } catch (error) {
    console.error('Error fetching years:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching years'
    });
  }
});

// Get caravan details by make/model/year
router.get('/details/:make/:model/:year', async (req, res) => {
  try {
    const { make, model, year } = req.params;
    
    const caravan = await Caravan.findOne({
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      year: parseInt(year),
      isActive: true
    });
    
    if (!caravan) {
      return res.status(404).json({
        success: false,
        message: 'Caravan not found'
      });
    }
    
    res.json({
      success: true,
      data: caravan
    });
  } catch (error) {
    console.error('Error fetching caravan details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching caravan details'
    });
  }
});

// Register a new caravan (for Pro users)
router.post('/register', protect, authorize('professional'), [
  body('numberPlate').trim().notEmpty().withMessage('Number plate is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('masterCaravanId').isMongoId().withMessage('Valid master caravan ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { numberPlate, state, masterCaravanId } = req.body;
    
    // Check if caravan already exists in registry
    const existingCaravan = await CaravanRegistry.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase()
    });
    
    if (existingCaravan) {
      return res.status(400).json({
        success: false,
        message: 'Caravan already registered'
      });
    }
    
    // Verify master caravan exists
    const masterCaravan = await Caravan.findById(masterCaravanId);
    if (!masterCaravan) {
      return res.status(404).json({
        success: false,
        message: 'Master caravan not found'
      });
    }
    
    // Create registry entry
    const caravanRegistry = new CaravanRegistry({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      masterCaravanId,
      registeredBy: req.user.id
    });
    
    await caravanRegistry.save();
    
    res.status(201).json({
      success: true,
      message: 'Caravan registered successfully',
      data: caravanRegistry
    });
  } catch (error) {
    console.error('Error registering caravan:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering caravan'
    });
  }
});

// Upsert a master caravan record (for Pro users entering caravan details manually)
router.post('/master-upsert', protect, authorize('professional'), [
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900 }).withMessage('Valid year is required'),
  body('atm').isNumeric().withMessage('ATM is required'),
  body('gtm').optional({ nullable: true, checkFalsy: true }).isNumeric().withMessage('GTM must be a number'),
  body('axleCapacity').optional({ nullable: true, checkFalsy: true }).isNumeric().withMessage('Axle group capacity must be a number'),
  body('numberOfAxles').optional().isIn(['Single', 'Dual', 'Triple']).withMessage('Invalid axle count')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { make, model, year, atm, gtm, axleCapacity, numberOfAxles } = req.body;

    const normalizedMake = String(make).trim();
    const normalizedModel = String(model).trim();
    const normalizedYear = parseInt(year, 10);
    const atmNum = Number(atm) || 0;
    const gtmNum = gtm != null && gtm !== '' ? Number(gtm) || 0 : 0;
    const axleCapacityNum = axleCapacity != null && axleCapacity !== '' ? Number(axleCapacity) || 0 : 0;

    let caravan = await Caravan.findOne({
      make: new RegExp(`^${normalizedMake}$`, 'i'),
      model: new RegExp(`^${normalizedModel}$`, 'i'),
      year: normalizedYear,
      atm: atmNum,
      gtm: gtmNum,
      axleCapacity: axleCapacityNum,
      isActive: true
    });

    if (!caravan) {
      caravan = new Caravan({
        make: normalizedMake,
        model: normalizedModel,
        year: normalizedYear,
        atm: atmNum,
        gtm: gtmNum,
        axleCapacity: axleCapacityNum,
        numberOfAxles: numberOfAxles || 'Single',
        isReferenceData: false,
        source: 'user_submission'
      });

      await caravan.save();
    }

    res.status(200).json({
      success: true,
      data: caravan
    });
  } catch (error) {
    console.error('Error upserting master caravan:', error);
    res.status(500).json({
      success: false,
      message: 'Error upserting caravan'
    });
  }
});

module.exports = router;