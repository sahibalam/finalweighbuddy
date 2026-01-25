const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const Vehicle = require('../models/Vehicle');
const Caravan = require('../models/Caravan');
const VehicleRegistry = require('../models/VehicleRegistry');
const CaravanRegistry = require('../models/CaravanRegistry');
const User = require('../models/User');
const Weigh = require('../models/Weigh');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ==================== DASHBOARD & OVERVIEW ====================

// Get dashboard statistics (legacy endpoint for frontend compatibility)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  console.log('🔍 === Admin Dashboard Request ===');
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('User:', req.user);
  console.log('User Type:', req.user?.userType);
  console.log('Authorization Header:', req.headers.authorization);
  console.log('All Headers:', req.headers);
  try {
    const [
      totalUsers,
      totalWeighs,
      totalVehicles,
      totalCaravans
    ] = await Promise.all([
      User.countDocuments(),
      Weigh.countDocuments(),
      Vehicle.countDocuments({ isActive: true }),
      Caravan.countDocuments({ isActive: true })
    ]);
 console.log('✅ Database queries completed:');
    console.log('Total Users:', totalUsers);
    console.log('Total Weighs:', totalWeighs);
    console.log('Total Vehicles:', totalVehicles);
    console.log('Total Caravans:', totalCaravans);
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyWeighs = await Weigh.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$payment.amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const complianceStats = await Weigh.aggregate([
      {
        $group: {
          _id: null,
          totalWeighs: { $sum: 1 },
          compliantWeighs: {
            $sum: {
              $cond: [{ $eq: ['$complianceResults.overallCompliant', true] }, 1, 0]
            }
          }
        }
      }
    ]);
console.log('✅ Dashboard data fetched successfully');
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalWeighs,
        totalVehicles,
        totalCaravans,
        userStats,
        complianceStats: complianceStats[0] || { totalWeighs: 0, compliantWeighs: 0 },
        monthlyWeighs
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// Get system overview statistics (new endpoint)
router.get('/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalVehicles,
      totalCaravans,
      totalVehicleRegistrations,
      totalCaravanRegistrations,
      totalWeighings
    ] = await Promise.all([
      Vehicle.countDocuments({ isActive: true }),
      Caravan.countDocuments({ isActive: true }),
      VehicleRegistry.countDocuments({ isActive: true }),
      CaravanRegistry.countDocuments({ isActive: true }),
      Weigh.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        masterData: {
          vehicles: totalVehicles,
          caravans: totalCaravans
        },
        registrations: {
          vehicles: totalVehicleRegistrations,
          caravans: totalCaravanRegistrations
        },
        weighings: totalWeighings
      }
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system overview'
    });
  }
});

// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Update user
router.put('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, phone, postcode, userType, businessName, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, postcode, userType, businessName, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// ==================== WEIGH MANAGEMENT ====================

// Get all weigh entries with pagination
router.get('/weighs', protect, authorize('admin'), async (req, res) => {
  console.log('🔍 ADMIN WEIGHS ROUTE HIT - User:', req.user.email);
  console.log('🔍 Query params:', req.query);
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const weighs = await Weigh.find()
      .populate('userId', 'name email userType')
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .select('+complianceResults +compliance') // Include both compliance field names
      .lean() // Convert to plain JavaScript objects
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    console.log('Admin weighs query - first weigh complianceResults:', weighs[0]?.complianceResults);
    console.log('Admin weighs query - first weigh ALL FIELDS:', Object.keys(weighs[0] || {}));
    console.log('Admin weighs query - first weigh RAW DATA:', JSON.stringify(weighs[0], null, 2));
    
    // Check for any field that might contain compliance data
    const weigh = weighs[0];
    if (weigh) {
      console.log('🔍 Checking for compliance-related fields:');
      Object.keys(weigh).forEach(key => {
        if (key.toLowerCase().includes('compliance') || key.toLowerCase().includes('compliant')) {
          console.log(`🔍 Found compliance field "${key}":`, weigh[key]);
        }
      });
    }

    const total = await Weigh.countDocuments();

    // Recalculate compliance for weigh entries that don't have compliance data
    for (const weigh of weighs) {
      if (!weigh.complianceResults && !weigh.compliance && weigh.vehicleData && weigh.caravanData) {
        console.log('🔧 Recalculating compliance for weigh entry:', weigh._id);
        
        try {
          // Calculate compliance using the same logic as weigh creation
          const vehicleCompliance = {
            gvm: {
              actual: weigh.vehicleWeightUnhitched || 0, // GVM Unhooked as per guide
              limit: weigh.vehicleData.gvm || 0,
              compliant: (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData.gvm || 0),
              percentage: weigh.vehicleData.gvm ? ((weigh.vehicleWeightUnhitched || 0) / weigh.vehicleData.gvm * 100) : 0
            },
            frontAxle: {
              actual: 0, // DIY users don't measure individual axle weights
              limit: weigh.vehicleData.fawr || 0,
              compliant: true, // Skip individual axle check for DIY
              percentage: 0
            },
            rearAxle: {
              actual: 0, // DIY users don't measure individual axle weights
              limit: weigh.vehicleData.rawr || 0,
              compliant: true, // Skip individual axle check for DIY
              percentage: 0
            },
            tbm: {
              actual: weigh.towBallWeight || 0,
              // TBM Limit: First choice from vehicle manual, fallback to 10% of Caravan ATM
              limit: weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0,
              compliant: (weigh.towBallWeight || 0) <= (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0),
              percentage: (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0) ? ((weigh.towBallWeight || 0) / (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0) * 100) : 0
            },
            btc: {
              actual: weigh.caravanWeight || 0,
              limit: weigh.vehicleData.btc || 0,
              compliant: (weigh.caravanWeight || 0) <= (weigh.vehicleData.btc || 0),
              percentage: weigh.vehicleData.btc ? ((weigh.caravanWeight || 0) / weigh.vehicleData.btc * 100) : 0
            }
          };

          // Calculate GTM as per guide: GTM = ATM - TBM
          const calculatedGTM = (weigh.caravanWeight || 0) - (weigh.towBallWeight || 0);

          const caravanCompliance = {
            atm: {
              actual: weigh.caravanWeight || 0,
              limit: weigh.caravanData.atm || 0,
              compliant: (weigh.caravanWeight || 0) <= (weigh.caravanData.atm || 0),
              percentage: weigh.caravanData.atm ? ((weigh.caravanWeight || 0) / weigh.caravanData.atm * 100) : 0
            },
            gtm: {
              actual: calculatedGTM,
              limit: weigh.caravanData.gtm || 0,
              compliant: weigh.caravanData.gtm > 0 ? calculatedGTM <= weigh.caravanData.gtm : true, // Only check if GTM limit is available
              percentage: weigh.caravanData.gtm > 0 ? (calculatedGTM / weigh.caravanData.gtm * 100) : 0
            },
            axleGroupTotal: {
              actual: weigh.caravanWeight || 0,
              limit: weigh.caravanData.gtm || weigh.caravanData.axleCapacity || 0,
              compliant: (weigh.caravanWeight || 0) <= (weigh.caravanData.gtm || weigh.caravanData.axleCapacity || 0),
              percentage: (weigh.caravanData.gtm || weigh.caravanData.axleCapacity) ? ((weigh.caravanWeight || 0) / (weigh.caravanData.gtm || weigh.caravanData.axleCapacity) * 100) : 0
            }
          };

          const combinationCompliance = {
            gcm: {
              actual: (weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0), // GVM Unhooked + ATM as per guide
              limit: weigh.vehicleData.gcm || 0,
              compliant: ((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) <= (weigh.vehicleData.gcm || 0),
              percentage: weigh.vehicleData.gcm ? (((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) / weigh.vehicleData.gcm * 100) : 0
            }
          };

          const overallCompliant = 
            vehicleCompliance.gvm.compliant &&
            vehicleCompliance.tbm.compliant &&
            vehicleCompliance.btc.compliant &&
            caravanCompliance.atm.compliant &&
            caravanCompliance.gtm.compliant &&
            caravanCompliance.axleGroupTotal.compliant &&
            combinationCompliance.gcm.compliant;

          // Update the weigh entry with compliance results
          await Weigh.findByIdAndUpdate(weigh._id, {
            complianceResults: {
              vehicle: vehicleCompliance,
              caravan: caravanCompliance,
              combination: combinationCompliance,
              overallCompliant: overallCompliant
            }
          });

          console.log('✅ Compliance calculated and saved for weigh entry:', weigh._id);
        } catch (error) {
          console.error('❌ Error calculating compliance for weigh entry:', weigh._id, error);
        }
      }
    }

    // Fetch updated data after compliance calculation
    const updatedWeighs = await Weigh.find()
      .populate('userId', 'name email userType')
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .select('+complianceResults +compliance')
      .lean()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    res.json({
      success: true,
      count: updatedWeighs.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      weighs: updatedWeighs
    });
  } catch (error) {
    console.error('Error fetching weighs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weigh entries'
    });
  }
});

// ==================== PAYMENT MANAGEMENT ====================

// Get payment statistics
router.get('/payment-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const paymentStats = await Weigh.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$payment.amount' },
          totalTransactions: { $sum: 1 },
          completedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const monthlyRevenue = await Weigh.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$payment.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const paymentMethods = await Weigh.aggregate([
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$payment.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: paymentStats[0] || {
          totalRevenue: 0,
          totalTransactions: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0
        },
        monthlyRevenue,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// Get all payments with pagination
router.get('/payments', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const payments = await Weigh.find()
      .populate('userId', 'name email userType')
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .select('payment customerName customerPhone customerEmail createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Weigh.countDocuments();

    res.json({
      success: true,
      count: payments.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// Update payment status
router.put('/payments/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    const weigh = await Weigh.findByIdAndUpdate(
      req.params.id,
      { 'payment.status': status },
      { new: true }
    );

    if (!weigh) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment: weigh.payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});



// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await User.countDocuments();

    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});



// ==================== PAYMENT MANAGEMENT ====================

// Get payment statistics
router.get('/payment-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const paymentStats = await Weigh.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$payment.amount' },
          totalTransactions: { $sum: 1 },
          completedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'completed'] }, 1, 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'pending'] }, 1, 0]
            }
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$payment.status', 'failed'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const monthlyRevenue = await Weigh.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$payment.amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const paymentMethods = await Weigh.aggregate([
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$payment.amount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: paymentStats[0] || {
          totalRevenue: 0,
          totalTransactions: 0,
          completedPayments: 0,
          pendingPayments: 0,
          failedPayments: 0
        },
        monthlyRevenue,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// Get all payments with pagination
router.get('/payments', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const payments = await Weigh.find()
      .populate('userId', 'name email userType businessName')
      .populate('vehicleRegistryId', 'numberPlate state')
      .populate('caravanRegistryId', 'numberPlate state')
      .populate('vehicle', 'make model year variant gvm gcm btc numberPlate')
      .populate('caravan', 'make model year atm gtm numberPlate')
      .select('payment customerName customerPhone customerEmail createdAt vehicleData caravanData vehicleRegistryId caravanRegistryId vehicle caravan complianceResults compliance weights')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);



    const total = await Weigh.countDocuments();

    res.json({
      success: true,
      count: payments.length,
      total,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// ==================== VEHICLE MASTER DATA MANAGEMENT ====================

// Get all master vehicles with pagination
router.get('/vehicles', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const vehicles = await Vehicle.find({ isActive: true })
      .sort({ make: 1, model: 1, year: -1, variant: 1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Vehicle.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles'
    });
  }
});

// Search master vehicles
router.get('/vehicles/search', protect, authorize('admin'), async (req, res) => {
  try {
    const { make, model, year, variant } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = { isActive: true };

    if (make) query.make = new RegExp(make, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (year) query.year = parseInt(year);
    if (variant) query.variant = new RegExp(variant, 'i');

    const vehicles = await Vehicle.find(query)
      .sort({ make: 1, model: 1, year: -1, variant: 1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vehicles'
    });
  }
});

// Create master vehicle
router.post('/vehicles', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      isReferenceData: true,
      isActive: true,
      source: 'manual'
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle'
    });
  }
});

// Update master vehicle
router.put('/vehicles/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle'
    });
  }
});

// Delete master vehicle
router.delete('/vehicles/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if vehicle is referenced in registry
    const registryCount = await VehicleRegistry.countDocuments({ 
      masterVehicleId: req.params.id 
    });

    if (registryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle. It is referenced by ${registryCount} registered vehicles.`
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle'
    });
  }
});

// Download vehicle CSV template
router.get('/vehicles/template', protect, authorize('admin'), (req, res) => {
  const templatePath = path.join(__dirname, '../templates/vehicle_template.csv');
  res.download(templatePath, 'vehicle_template.csv');
});

// Import vehicles from CSV
router.post('/vehicles/import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          let skipped = 0;

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.make || !row.model || !row.year || !row.variant) {
                errors.push(`Row ${results.indexOf(row) + 1}: Missing required fields (make, model, year, variant)`);
                skipped++;
                continue;
              }

              // Check if vehicle already exists
              const existingVehicle = await Vehicle.findOne({
                make: row.make.trim(),
                model: row.model.trim(),
                year: parseInt(row.year),
                variant: row.variant.trim()
              });

              if (existingVehicle) {
                errors.push(`Row ${results.indexOf(row) + 1}: Vehicle already exists (${row.make} ${row.model} ${row.year} ${row.variant})`);
                skipped++;
                continue;
              }

              // Create vehicle data
              const vehicleData = {
                make: row.make.trim(),
                model: row.model.trim(),
                series: row.series ? row.series.trim() : undefined,
                year: parseInt(row.year),
                variant: row.variant.trim(),
                engine: row.engine ? row.engine.trim() : undefined,
                transmission: row.transmission || 'Automatic',
                tyreSize: row.tyreSize ? row.tyreSize.trim() : undefined,
                hasSubTank: row.hasSubTank === 'true',
                fawr: parseInt(row.fawr) || 0,
                rawr: parseInt(row.rawr) || 0,
                gvm: parseInt(row.gvm) || 0,
                btc: parseInt(row.btc) || 0,
                tbm: parseInt(row.tbm) || 0,
                gcm: parseInt(row.gcm) || 0,
                isReferenceData: true,
                isActive: true,
                source: 'csv_import'
              };

              const vehicle = new Vehicle(vehicleData);
              await vehicle.save();
              imported++;

            } catch (error) {
              errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
              skipped++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Import completed. ${imported} vehicles imported, ${skipped} skipped.`,
            data: {
              imported,
              skipped,
              errors: errors.slice(0, 10) // Show first 10 errors
            }
          });

        } catch (error) {
          console.error('Error processing CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      });

  } catch (error) {
    console.error('Error importing vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing vehicles'
    });
  }
});

// Export vehicles to CSV
router.get('/vehicles/export', protect, authorize('admin'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true })
      .sort({ make: 1, model: 1, year: -1, variant: 1 });

    let csvContent = 'make,model,series,year,variant,engine,transmission,tyreSize,hasSubTank,fawr,rawr,gvm,btc,tbm,gcm\n';

    vehicles.forEach(vehicle => {
      csvContent += `${vehicle.make},${vehicle.model},${vehicle.series || ''},${vehicle.year},${vehicle.variant},${vehicle.engine || ''},${vehicle.transmission},${vehicle.tyreSize || ''},${vehicle.hasSubTank},${vehicle.fawr},${vehicle.rawr},${vehicle.gvm},${vehicle.btc},${vehicle.tbm || ''},${vehicle.gcm}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vehicles_export.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting vehicles'
    });
  }
});

// ==================== CARAVAN MASTER DATA MANAGEMENT ====================

// Get all master caravans with pagination
router.get('/caravans', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const caravans = await Caravan.find({ isActive: true })
      .sort({ make: 1, model: 1, year: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Caravan.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        caravans,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching caravans'
    });
  }
});

// Search master caravans
router.get('/caravans/search', protect, authorize('admin'), async (req, res) => {
  try {
    const { make, model, year } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = { isActive: true };

    if (make) query.make = new RegExp(make, 'i');
    if (model) query.model = new RegExp(model, 'i');
    if (year) query.year = parseInt(year);

    const caravans = await Caravan.find(query)
      .sort({ make: 1, model: 1, year: -1 })
      .limit(limit)
      .skip(startIndex);

    const total = await Caravan.countDocuments(query);

    res.json({
      success: true,
      data: {
        caravans,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error searching caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching caravans'
    });
  }
});

// Create master caravan
router.post('/caravans', protect, authorize('admin'), async (req, res) => {
  try {
    const caravanData = {
      ...req.body,
      isReferenceData: true,
      isActive: true,
      source: 'manual'
    };

    const caravan = new Caravan(caravanData);
    await caravan.save();

    res.status(201).json({
      success: true,
      message: 'Caravan created successfully',
      data: caravan
    });
  } catch (error) {
    console.error('Error creating caravan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating caravan'
    });
  }
});

// Update master caravan
router.put('/caravans/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const caravan = await Caravan.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!caravan) {
      return res.status(404).json({
        success: false,
        message: 'Caravan not found'
      });
    }

    res.json({
      success: true,
      message: 'Caravan updated successfully',
      data: caravan
    });
  } catch (error) {
    console.error('Error updating caravan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating caravan'
    });
  }
});

// Delete master caravan
router.delete('/caravans/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const caravan = await Caravan.findById(req.params.id);

    if (!caravan) {
      return res.status(404).json({
        success: false,
        message: 'Caravan not found'
      });
    }

    // Check if caravan is referenced in registry
    const registryCount = await CaravanRegistry.countDocuments({ 
      masterCaravanId: req.params.id 
    });

    if (registryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete caravan. It is referenced by ${registryCount} registered caravans.`
      });
    }

    await Caravan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Caravan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting caravan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting caravan'
    });
  }
});

// Download caravan CSV template
router.get('/caravans/template', protect, authorize('admin'), (req, res) => {
  const templatePath = path.join(__dirname, '../templates/caravan_template.csv');
  res.download(templatePath, 'caravan_template.csv');
});

// Import caravans from CSV
router.post('/caravans/import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          let skipped = 0;

          for (const row of results) {
            try {
              // Validate required fields
              if (!row.make || !row.model || !row.year) {
                errors.push(`Row ${results.indexOf(row) + 1}: Missing required fields (make, model, year)`);
                skipped++;
                continue;
              }

              // Check if caravan already exists
              const existingCaravan = await Caravan.findOne({
                make: row.make.trim(),
                model: row.model.trim(),
                year: parseInt(row.year)
              });

              if (existingCaravan) {
                errors.push(`Row ${results.indexOf(row) + 1}: Caravan already exists (${row.make} ${row.model} ${row.year})`);
                skipped++;
                continue;
              }

              // Create caravan data
              const caravanData = {
                make: row.make.trim(),
                model: row.model.trim(),
                year: parseInt(row.year),
                atm: parseInt(row.atm) || 0,
                gtm: parseInt(row.gtm) || 0,
                axleCapacity: parseInt(row.axleCapacity) || 0,
                numberOfAxles: row.numberOfAxles || 'Single',
                isReferenceData: true,
                isActive: true,
                source: 'csv_import'
              };

              const caravan = new Caravan(caravanData);
              await caravan.save();
              imported++;

            } catch (error) {
              errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
              skipped++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Import completed. ${imported} caravans imported, ${skipped} skipped.`,
            data: {
              imported,
              skipped,
              errors: errors.slice(0, 10) // Show first 10 errors
            }
          });

        } catch (error) {
          console.error('Error processing CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      });

  } catch (error) {
    console.error('Error importing caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing caravans'
    });
  }
});

// Export caravans to CSV
router.get('/caravans/export', protect, authorize('admin'), async (req, res) => {
  try {
    const caravans = await Caravan.find({ isActive: true })
      .sort({ make: 1, model: 1, year: -1 });

    let csvContent = 'make,model,year,atm,gtm,axleCapacity,numberOfAxles\n';

    caravans.forEach(caravan => {
      csvContent += `${caravan.make},${caravan.model},${caravan.year},${caravan.atm},${caravan.gtm},${caravan.axleCapacity},${caravan.numberOfAxles}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=caravans_export.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting caravans:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting caravans'
    });
  }
});

// ==================== DEBUG ENDPOINTS ====================

// Debug endpoint to recalculate compliance for all weigh entries
router.get('/debug/recalculate-compliance', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔧 Starting compliance recalculation for all weigh entries...');
    
    const weighs = await Weigh.find().lean();
    console.log(`Found ${weighs.length} weigh entries to process`);
    
    let processed = 0;
    let updated = 0;
    
    for (const weigh of weighs) {
      processed++;
      console.log(`Processing weigh entry ${processed}/${weighs.length}: ${weigh._id}`);
      
      if (weigh.vehicleData && weigh.caravanData) {
        try {
          // Calculate compliance using the same logic as weigh creation
          const vehicleCompliance = {
            gvm: {
              actual: weigh.vehicleWeightUnhitched || 0,
              limit: weigh.vehicleData.gvm || 0,
              compliant: (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData.gvm || 0),
              percentage: weigh.vehicleData.gvm ? ((weigh.vehicleWeightUnhitched || 0) / weigh.vehicleData.gvm * 100) : 0
            },
            tbm: {
              actual: weigh.towBallWeight || 0,
              limit: weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0,
              compliant: (weigh.towBallWeight || 0) <= (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0),
              percentage: (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0) ? ((weigh.towBallWeight || 0) / (weigh.vehicleData.tbm || (weigh.caravanData.atm * 0.1) || 0) * 100) : 0
            },
            btc: {
              actual: weigh.caravanWeight || 0,
              limit: weigh.vehicleData.btc || 0,
              compliant: (weigh.caravanWeight || 0) <= (weigh.vehicleData.btc || 0),
              percentage: weigh.vehicleData.btc ? ((weigh.caravanWeight || 0) / weigh.vehicleData.btc * 100) : 0
            }
          };

          const calculatedGTM = (weigh.caravanWeight || 0) - (weigh.towBallWeight || 0);

          const caravanCompliance = {
            atm: {
              actual: weigh.caravanWeight || 0,
              limit: weigh.caravanData.atm || 0,
              compliant: (weigh.caravanWeight || 0) <= (weigh.caravanData.atm || 0),
              percentage: weigh.caravanData.atm ? ((weigh.caravanWeight || 0) / weigh.caravanData.atm * 100) : 0
            },
            gtm: {
              actual: calculatedGTM,
              limit: weigh.caravanData.gtm || 0,
              compliant: weigh.caravanData.gtm > 0 ? calculatedGTM <= weigh.caravanData.gtm : true,
              percentage: weigh.caravanData.gtm > 0 ? (calculatedGTM / weigh.caravanData.gtm * 100) : 0
            }
          };

          const combinationCompliance = {
            gcm: {
              actual: (weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0),
              limit: weigh.vehicleData.gcm || 0,
              compliant: ((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) <= (weigh.vehicleData.gcm || 0),
              percentage: weigh.vehicleData.gcm ? (((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) / weigh.vehicleData.gcm * 100) : 0
            }
          };

          const overallCompliant = 
            vehicleCompliance.gvm.compliant &&
            vehicleCompliance.tbm.compliant &&
            vehicleCompliance.btc.compliant &&
            caravanCompliance.atm.compliant &&
            caravanCompliance.gtm.compliant &&
            combinationCompliance.gcm.compliant;

          // Update the weigh entry with compliance results
          await Weigh.findByIdAndUpdate(weigh._id, {
            complianceResults: {
              vehicle: vehicleCompliance,
              caravan: caravanCompliance,
              combination: combinationCompliance,
              overallCompliant: overallCompliant
            }
          });

          console.log(`✅ Updated weigh entry ${weigh._id} - Overall compliant: ${overallCompliant}`);
          updated++;
        } catch (error) {
          console.error(`❌ Error updating weigh entry ${weigh._id}:`, error);
        }
      } else {
        console.log(`⚠️ Skipping weigh entry ${weigh._id} - missing vehicle or caravan data`);
      }
    }
    
    // Get final compliance stats
    const finalStats = await Weigh.aggregate([
      {
        $group: {
          _id: null,
          totalWeighs: { $sum: 1 },
          compliantWeighs: {
            $sum: {
              $cond: [{ $eq: ['$complianceResults.overallCompliant', true] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const stats = finalStats[0] || { totalWeighs: 0, compliantWeighs: 0 };
    
    res.json({
      success: true,
      message: `Compliance recalculation completed. Processed: ${processed}, Updated: ${updated}`,
      stats: {
        totalWeighs: stats.totalWeighs,
        compliantWeighs: stats.compliantWeighs,
        nonCompliantWeighs: stats.totalWeighs - stats.compliantWeighs
      }
    });
    
  } catch (error) {
    console.error('Error recalculating compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating compliance'
    });
  }
});

module.exports = router; 