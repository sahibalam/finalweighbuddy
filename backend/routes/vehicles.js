const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');
const VehicleRegistry = require('../models/VehicleRegistry');
const { protect, authorize } = require('../middleware/auth');
const axios = require('axios');

// Get all master vehicles (for admin dropdowns)
router.get('/master', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .select('make model series year variant engine transmission tyreSize hasSubTank fawr rawr gvm btc gcm')
      .sort({ make: 1, model: 1, year: -1, variant: 1 });
    
    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching master vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles'
    });
  }
});

// Search vehicles by make/model/year/variant (for dropdowns)
router.get('/search', async (req, res) => {
  try {
    const { make, model, year, variant } = req.query;
    const query = { isActive: true };
    
    if (make) query.make = new RegExp(make, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (year) query.year = parseInt(year);
    if (variant) query.variant = new RegExp(variant, 'i');
    
    const vehicles = await Vehicle.find(query)
      .select('make model series year variant engine transmission tyreSize hasSubTank fawr rawr gvm btc tbm gcm')
      .sort({ make: 1, model: 1, year: -1, variant: 1 })
      .limit(50);
    
    res.json({
      success: true,
      vehicles: vehicles
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vehicles'
    });
  }
});

// Search vehicle by number plate (for user input)
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
    
    console.log(`🔍 Searching for vehicle plate: ${plate.toUpperCase()}, state: ${state?.toUpperCase()}`);
    
    // First, search in vehicle registry (master database)
    const registryEntry = await VehicleRegistry.findOne({
      numberPlate: plate.toUpperCase(),
      ...(state && { state: state.toUpperCase() }),
      isActive: true
    }).populate('masterVehicleId');
    
    if (registryEntry) {
      console.log('✅ Vehicle found in registry:', registryEntry.numberPlate);
      return res.json({
        success: true,
        found: true,
        data: {
          numberPlate: registryEntry.numberPlate,
          state: registryEntry.state,
          masterVehicle: registryEntry.masterVehicleId,
          source: 'registry'
        }
      });
    }
    
    // If not found in registry, search in weigh collection for previously used vehicles
    console.log('🔍 Vehicle not found in registry, searching weigh collection...');
    const Weigh = require('../models/Weigh');
    
    const weighEntry = await Weigh.findOne({
      'vehicleData.numberPlate': plate.toUpperCase(),
      ...(state && { 'vehicleData.state': state.toUpperCase() })
    }).sort({ createdAt: -1 }); // Get the most recent entry
    
    if (weighEntry && weighEntry.vehicleData) {
      console.log('✅ Vehicle found in weigh collection:', weighEntry.vehicleData.numberPlate);
      return res.json({
        success: true,
        found: true,
        data: {
          numberPlate: weighEntry.vehicleData.numberPlate,
          state: weighEntry.vehicleData.state,
          masterVehicle: weighEntry.vehicleData,
          source: 'weigh_history'
        }
      });
    }
    
    // Vehicle not found in either location
    console.log('❌ Vehicle not found in registry or weigh collection');

    async function getInfoAgentToken() {
      try {
        const resp = await axios.post(
          process.env.INFOAGENT_AUTH_URL,
          {
            grant_type: 'client_credentials',
            client_id: process.env.INFOAGENT_CLIENT_ID,
            client_secret: process.env.INFOAGENT_CLIENT_SECRET
          },
          {
            headers: { 'Content-Type': 'application/json' }
          }
        );
        return resp.data && (resp.data.access_token || resp.data.token || resp.data.accessToken);
      } catch (e) {
        console.error('InfoAgent token error:', e.response?.data || e.message);
        return null;
      }
    }

    async function fetchVehicleFromInfoAgent(p, s) {
      const token = await getInfoAgentToken();
      if (!token) return null;
      try {
        const resp = await axios.post(
          process.env.INFOAGENT_WEIGHTS_URL,
          {
            plate: String(p || '').toUpperCase(),
            state: s ? String(s).toUpperCase() : undefined
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const vehicle = resp.data?.result?.vehicle;
        if (!vehicle) return null;
        const d = vehicle.details || {};
        const wt = vehicle.weightsAndTowing || {};

        // Attempt to map VIN from various possible fields. If Info-Agent
        // does not provide VIN, this will simply be undefined.
        const vin = d.vin || d.vinNumber || d.vinNo || d.vin_number || undefined;

        return {
          numberPlate: String(p || '').toUpperCase(),
          state: s ? String(s).toUpperCase() : undefined,
          dataSource: 'INFOAGENT',
          make: d.make,
          model: d.model,
          year: d.year,
          variant: d.variant || d.trim || d.series || '',
          engine: d.engine,
          transmission: d.transmission,
          vin,
          tyreSize: undefined,
          hasSubTank: undefined,
          fawr: wt.maximumFrontAxleLoadKg,
          rawr: wt.maximumRearAxleLoadKg,
          gvm: wt.grossVehicleMass,
          btc: wt.towingCapacityBrakedKg,
          tbm: wt.towBallMassKg,
          gcm: wt.grossCombinedMass
        };
      } catch (e) {
        console.error('InfoAgent API error:', e.response?.data || e.message);
        return null;
      }
    }

    const infoVehicle = await fetchVehicleFromInfoAgent(plate, state);
    if (infoVehicle) {
      return res.json({
        success: true,
        found: true,
        data: {
          numberPlate: infoVehicle.numberPlate,
          state: infoVehicle.state,
          masterVehicle: infoVehicle,
          source: 'infoagent'
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Vehicle not found in database',
      found: false
    });
    
  } catch (error) {
    console.error('Error searching vehicle by plate:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vehicle'
    });
  }
});

// Get unique makes for dropdown
router.get('/makes', async (req, res) => {
  try {
    const makes = await Vehicle.distinct('make', { isActive: true });
    
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
    
    const models = await Vehicle.distinct('model', { 
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

// Get series for a specific make/model (using query parameters)
router.get('/series', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({
        success: false,
        message: 'Make and model parameters are required'
      });
    }
    
    const series = await Vehicle.distinct('series', { 
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      isActive: true 
    });
    
    // Filter out null/undefined values and sort alphabetically
    const filteredSeries = series.filter(s => s && s.trim() !== '').sort();
    
    res.json({
      success: true,
      series: filteredSeries
    });
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching series'
    });
  }
});

// Get years for a specific make/model/series (using query parameters)
router.get('/years', async (req, res) => {
  try {
    const { make, model, series } = req.query;
    if (!make || !model) {
      return res.status(400).json({
        success: false,
        message: 'Make and model parameters are required'
      });
    }
    
    const query = { 
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      isActive: true 
    };
    
    // Add series filter if provided
    if (series) {
      query.series = new RegExp(series, 'i');
    }
    
    const years = await Vehicle.distinct('year', query);
    
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

// Get variants for a specific make/model/series/year (using query parameters)
router.get('/variants', async (req, res) => {
  try {
    const { make, model, series, year } = req.query;
    if (!make || !model || !year) {
      return res.status(400).json({
        success: false,
        message: 'Make, model, and year parameters are required'
      });
    }
    
    const query = { 
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      year: parseInt(year),
      isActive: true 
    };
    
    // Add series filter if provided
    if (series) {
      query.series = new RegExp(series, 'i');
    }
    
    const variants = await Vehicle.distinct('variant', query);
    
    // Sort variants alphabetically
    variants.sort();
    
    res.json({
      success: true,
      variants: variants
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching variants'
    });
  }
});

// Get vehicle details by make/model/year/variant
router.get('/details/:make/:model/:year/:variant', async (req, res) => {
  try {
    const { make, model, year, variant } = req.params;
    
    const vehicle = await Vehicle.findOne({
      make: new RegExp(make, 'i'),
      model: new RegExp(model, 'i'),
      year: parseInt(year),
      variant: new RegExp(variant, 'i'),
      isActive: true
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      vehicle: vehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle details'
    });
  }
});

// Register a new vehicle (for Pro users)
router.post('/register', protect, authorize('professional'), [
  body('numberPlate').trim().notEmpty().withMessage('Number plate is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('masterVehicleId').isMongoId().withMessage('Valid master vehicle ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { numberPlate, state, masterVehicleId } = req.body;
    
    // Check if vehicle already exists in registry
    const existingVehicle = await VehicleRegistry.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase()
    });
    
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle already registered'
      });
    }
    
    // Verify master vehicle exists
    const masterVehicle = await Vehicle.findById(masterVehicleId);
    if (!masterVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Master vehicle not found'
      });
    }
    
    // Create registry entry
    const vehicleRegistry = new VehicleRegistry({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      masterVehicleId,
      registeredBy: req.user.id
    });
    
    await vehicleRegistry.save();
    
    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: vehicleRegistry
    });
  } catch (error) {
    console.error('Error registering vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering vehicle'
    });
  }
});

// Upsert a master vehicle record (for Pro users entering vehicle details manually)
router.post('/master-upsert', protect, authorize('professional'), [
  body('make').trim().notEmpty().withMessage('Make is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900 }).withMessage('Valid year is required'),
  body('variant').trim().notEmpty().withMessage('Variant is required'),
  body('fawr').isNumeric().withMessage('FAWR is required'),
  body('rawr').isNumeric().withMessage('RAWR is required'),
  body('gvm').isNumeric().withMessage('GVM is required'),
  body('btc').isNumeric().withMessage('BTC is required'),
  body('tbm').isNumeric().withMessage('TBM is required'),
  body('gcm').isNumeric().withMessage('GCM is required'),
  body('series').optional(),
  body('engine').optional(),
  body('transmission').optional().isIn(['Automatic', 'Manual']).withMessage('Invalid transmission')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      make,
      model,
      year,
      variant,
      fawr,
      rawr,
      gvm,
      btc,
      tbm,
      gcm,
      series,
      engine,
      transmission
    } = req.body;

    const normalizedMake = String(make).trim();
    const normalizedModel = String(model).trim();
    const normalizedVariant = String(variant).trim();
    const normalizedYear = parseInt(year, 10);

    const fawrNum = Number(fawr) || 0;
    const rawrNum = Number(rawr) || 0;
    const gvmNum = Number(gvm) || 0;
    const btcNum = Number(btc) || 0;
    const tbmNum = Number(tbm) || 0;
    const gcmNum = Number(gcm) || 0;

    let vehicle = await Vehicle.findOne({
      make: new RegExp(`^${normalizedMake}$`, 'i'),
      model: new RegExp(`^${normalizedModel}$`, 'i'),
      year: normalizedYear,
      variant: new RegExp(`^${normalizedVariant}$`, 'i'),
      fawr: fawrNum,
      rawr: rawrNum,
      gvm: gvmNum,
      btc: btcNum,
      tbm: tbmNum,
      gcm: gcmNum,
      isActive: true
    });

    if (!vehicle) {
      vehicle = new Vehicle({
        make: normalizedMake,
        model: normalizedModel,
        year: normalizedYear,
        variant: normalizedVariant,
        series: series || '',
        engine: engine || '',
        transmission: transmission || 'Automatic',
        fawr: fawrNum,
        rawr: rawrNum,
        gvm: gvmNum,
        btc: btcNum,
        tbm: tbmNum,
        gcm: gcmNum,
        isReferenceData: false,
        source: 'user_submission'
      });

      await vehicle.save();
    }

    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Error upserting master vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error upserting vehicle'
    });
  }
});

module.exports = router;