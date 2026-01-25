const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const VehicleSubmission = require('../models/VehicleSubmission');
const CaravanSubmission = require('../models/CaravanSubmission');
const Vehicle = require('../models/Vehicle');
const Caravan = require('../models/Caravan');
const VehicleRegistry = require('../models/VehicleRegistry');
const CaravanRegistry = require('../models/CaravanRegistry');
// const { uploadToSpaces, generateFileName, getPublicUrl } = require('../config/spaces');

// Temporary mock functions for file upload (to be replaced with real Spaces implementation)
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  return `compliance-plates/compliance-${timestamp}-${random}.${extension}`;
};

const uploadToSpaces = async (file, fileName) => {
  // Save file locally for now (until DigitalOcean Spaces is implemented)
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/compliance-plates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Save file to local directory
    const filePath = path.join(uploadDir, path.basename(fileName));
    fs.writeFileSync(filePath, file.buffer);
    
    console.log('File saved locally:', filePath);
    
    // Return local URL path (just the path relative to uploads, not including /uploads/)
    return {
      Location: `compliance-plates/${path.basename(fileName)}`
    };
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw error;
  }
};

// Multer configuration for in-memory storage (for DigitalOcean Spaces)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ==================== DIY USER SUBMISSIONS ====================

// Submit vehicle data for admin review (DIY users)
router.post('/vehicle', protect, upload.single('compliancePlatePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Compliance plate photo is required'
      });
    }

    const {
      make, model, series, year, variant, engine, transmission, tyreSize, hasSubTank,
      fawr, rawr, gvm, btc, tbm, gcm, numberPlate, state
    } = req.body;

    // Validate required fields
    if (!make || !model || !year || !variant || !numberPlate || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if number plate already exists in registry
    const existingRegistry = await VehicleRegistry.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase()
    });

    if (existingRegistry) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number plate is already registered'
      });
    }

    // Check if submission already exists for this number plate
    const existingSubmission = await VehicleSubmission.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      status: 'pending'
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'A submission for this number plate is already pending review'
      });
    }

    // Upload compliance plate photo to DigitalOcean Spaces
    const fileName = generateFileName(req.file.originalname);
    const uploadResult = await uploadToSpaces(req.file, fileName);
    const photoUrl = uploadResult.Location;

    // Create vehicle submission
    const submission = new VehicleSubmission({
      submittedBy: req.user.id,
      vehicleData: {
        make: make.trim(),
        model: model.trim(),
        series: series ? series.trim() : undefined,
        year: parseInt(year),
        variant: variant.trim(),
        engine: engine ? engine.trim() : undefined,
        transmission: transmission || 'Automatic',
        tyreSize: tyreSize ? tyreSize.trim() : undefined,
        hasSubTank: hasSubTank === 'true',
        fawr: parseFloat(fawr),
        rawr: parseFloat(rawr),
        gvm: parseFloat(gvm),
        btc: parseFloat(btc),
        tbm: parseFloat(tbm),
        gcm: parseFloat(gcm)
      },
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      compliancePlatePhoto: photoUrl,
      status: 'pending'
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle submission created successfully and sent for admin review',
      data: {
        submissionId: submission._id,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('Error creating vehicle submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle submission'
    });
  }
});

// Submit caravan data for admin review (DIY users)
router.post('/caravan', protect, upload.single('compliancePlatePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Compliance plate photo is required'
      });
    }

    const {
      make, model, year, atm, gtm, axleCapacity, numberOfAxles, numberPlate, state
    } = req.body;

    // Validate required fields
    if (!make || !model || !year || !numberPlate || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if number plate already exists in registry
    const existingRegistry = await CaravanRegistry.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase()
    });

    if (existingRegistry) {
      return res.status(400).json({
        success: false,
        message: 'Caravan with this number plate is already registered'
      });
    }

    // Check if submission already exists for this number plate
    const existingSubmission = await CaravanSubmission.findOne({
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      status: 'pending'
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'A submission for this number plate is already pending review'
      });
    }

    // Upload compliance plate photo to DigitalOcean Spaces
    const fileName = generateFileName(req.file.originalname);
    const uploadResult = await uploadToSpaces(req.file, fileName);
    const photoUrl = uploadResult.Location;

    // Create caravan submission
    const submission = new CaravanSubmission({
      submittedBy: req.user.id,
      caravanData: {
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        atm: parseFloat(atm),
        gtm: parseFloat(gtm),
        axleCapacity: parseFloat(axleCapacity),
        numberOfAxles: numberOfAxles || 'Single'
      },
      numberPlate: numberPlate.toUpperCase(),
      state: state.toUpperCase(),
      compliancePlatePhoto: photoUrl,
      status: 'pending'
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Caravan submission created successfully and sent for admin review',
      data: {
        submissionId: submission._id,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('Error creating caravan submission:', error);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating caravan submission'
    });
  }
});

// Get user's own submissions
router.get('/my-submissions', protect, async (req, res) => {
  try {
    const [vehicleSubmissions, caravanSubmissions] = await Promise.all([
      VehicleSubmission.find({ submittedBy: req.user.id })
        .sort({ createdAt: -1 }),
      CaravanSubmission.find({ submittedBy: req.user.id })
        .sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        vehicles: vehicleSubmissions,
        caravans: caravanSubmissions
      }
    });

  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions'
    });
  }
});

// ==================== ADMIN REVIEW ROUTES ====================

// Get all pending submissions (admin only)
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const [vehicleSubmissions, caravanSubmissions] = await Promise.all([
      VehicleSubmission.find({ status: 'pending' })
        .populate('submittedBy', 'name email userType')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex),
      CaravanSubmission.find({ status: 'pending' })
        .populate('submittedBy', 'name email userType')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(startIndex)
    ]);

    const [vehicleTotal, caravanTotal] = await Promise.all([
      VehicleSubmission.countDocuments({ status: 'pending' }),
      CaravanSubmission.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        vehicles: vehicleSubmissions,
        caravans: caravanSubmissions,
        pagination: {
          current: page,
          pages: Math.ceil(Math.max(vehicleTotal, caravanTotal) / limit),
          total: vehicleTotal + caravanTotal,
          hasNext: page * limit < Math.max(vehicleTotal, caravanTotal),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching pending submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending submissions'
    });
  }
});

// Approve vehicle submission (admin only)
router.put('/vehicle/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    
    const submission = await VehicleSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Create master vehicle record
    const vehicle = new Vehicle({
      ...submission.vehicleData,
      isReferenceData: true,
      isActive: true,
      source: 'user_submission'
    });

    await vehicle.save();

    // Log submission data for debugging
    console.log('🔍 Processing vehicle submission:', {
      id: submission._id,
      numberPlate: submission.numberPlate,
      state: submission.state,
      vehicleData: submission.vehicleData
    });

    // Validate number plate and state before creating registry
    if (!submission.numberPlate || submission.numberPlate === 'UNDEFINED' || 
        !submission.state || submission.state === 'UNDEFINED') {
      console.log('❌ Invalid number plate or state detected');
      return res.status(400).json({
        success: false,
        message: 'Cannot approve submission with invalid number plate or state. Please reject this submission and ask the user to resubmit with correct information.'
      });
    }

    // Create registry entry
    const registry = new VehicleRegistry({
      numberPlate: submission.numberPlate,
      state: submission.state,
      masterVehicleId: vehicle._id,
      registeredBy: submission.submittedBy
    });

    await registry.save();

    // Update submission status
    submission.status = 'approved';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;
    submission.approvedVehicleId = vehicle._id;
    submission.approvedRegistryId = registry._id;

    await submission.save();

    res.json({
      success: true,
      message: 'Vehicle submission approved and added to master database',
      data: {
        vehicleId: vehicle._id,
        registryId: registry._id
      }
    });

  } catch (error) {
    console.error('Error approving vehicle submission:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error approving vehicle submission',
      details: error.message
    });
  }
});

// Reject vehicle submission (admin only)
router.put('/vehicle/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    
    if (!reviewNotes) {
      return res.status(400).json({
        success: false,
        message: 'Review notes are required for rejection'
      });
    }

    const submission = await VehicleSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Update submission status
    submission.status = 'rejected';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;

    await submission.save();

    res.json({
      success: true,
      message: 'Vehicle submission rejected',
      data: {
        submissionId: submission._id
      }
    });

  } catch (error) {
    console.error('Error rejecting vehicle submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting vehicle submission'
    });
  }
});

// Approve caravan submission (admin only)
router.put('/caravan/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    
    const submission = await CaravanSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Caravan submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Create master caravan record
    const caravan = new Caravan({
      ...submission.caravanData,
      isReferenceData: true,
      isActive: true,
      source: 'user_submission'
    });

    await caravan.save();

    // Create registry entry
    const registry = new CaravanRegistry({
      numberPlate: submission.numberPlate,
      state: submission.state,
      masterCaravanId: caravan._id,
      registeredBy: submission.submittedBy
    });

    await registry.save();

    // Update submission status
    submission.status = 'approved';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;
    submission.approvedCaravanId = caravan._id;
    submission.approvedRegistryId = registry._id;

    await submission.save();

    res.json({
      success: true,
      message: 'Caravan submission approved and added to master database',
      data: {
        caravanId: caravan._id,
        registryId: registry._id
      }
    });

  } catch (error) {
    console.error('Error approving caravan submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving caravan submission'
    });
  }
});

// Reject caravan submission (admin only)
router.put('/caravan/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reviewNotes } = req.body;
    
    if (!reviewNotes) {
      return res.status(400).json({
        success: false,
        message: 'Review notes are required for rejection'
      });
    }

    const submission = await CaravanSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Caravan submission not found'
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Submission has already been reviewed'
      });
    }

    // Update submission status
    submission.status = 'rejected';
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;

    await submission.save();

    res.json({
      success: true,
      message: 'Caravan submission rejected',
      data: {
        submissionId: submission._id
      }
    });

  } catch (error) {
    console.error('Error rejecting caravan submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting caravan submission'
    });
  }
});

// Get submission statistics (admin only)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [vehicleStats, caravanStats] = await Promise.all([
      VehicleSubmission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      CaravanSubmission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalPending = (vehicleStats.find(s => s._id === 'pending')?.count || 0) +
                        (caravanStats.find(s => s._id === 'pending')?.count || 0);

    res.json({
      success: true,
      data: {
        totalPending,
        vehicles: vehicleStats,
        caravans: caravanStats
      }
    });

  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission statistics'
    });
  }
});

// ==================== DELETE SUBMISSIONS (ADMIN ONLY) ====================

// Delete vehicle submission (admin only)
router.delete('/vehicle/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const submission = await VehicleSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle submission not found'
      });
    }

    // Delete the compliance plate photo file if it exists
    if (submission.compliancePlatePhoto) {
      const photoPath = path.join(__dirname, '../uploads/compliance-plates', submission.compliancePlatePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await VehicleSubmission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vehicle submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle submission'
    });
  }
});

// Delete caravan submission (admin only)
router.delete('/caravan/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const submission = await CaravanSubmission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Caravan submission not found'
      });
    }

    // Delete the compliance plate photo file if it exists
    if (submission.compliancePlatePhoto) {
      const photoPath = path.join(__dirname, '../uploads/compliance-plates', submission.compliancePlatePhoto);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await CaravanSubmission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Caravan submission deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting caravan submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting caravan submission'
    });
  }
});

module.exports = router;
