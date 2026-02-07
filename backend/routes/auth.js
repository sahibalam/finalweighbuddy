const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createDiyClientFromProfessional } = require('../services/professionalClientService');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  body('phone', 'Phone number is required').not().isEmpty(),
  body('userType', 'User type must be professional, fleet, or diy').isIn(['professional', 'fleet', 'diy']),
  // Postcode is required for professional and fleet users; optional for DIY
  body('postcode').custom((value, { req }) => {
    if (
      (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
      (!value || String(value).trim() === '')
    ) {
      throw new Error('Postcode is required for professional and fleet users');
    }
    return true;
  }),
  body('businessName').custom((value, { req }) => {
    if ((req.body.userType === 'professional' || req.body.userType === 'fleet') && !value) {
      throw new Error('Business name is required for professional and fleet users');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, email, password, phone, postcode, userType, businessName } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      phone,
      postcode,
      userType,
      businessName: userType === 'professional' || userType === 'fleet' ? businessName : undefined
    });

    await user.save();

    // Create token
    const token = user.getJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        userType: user.userType,
        businessName: user.businessName
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = user.getJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        userType: user.userType,
        businessName: user.businessName,
        subscription: user.subscription,
        weighCount: user.weighCount,
        freeWeighs: user.freeWeighs
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

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        userType: user.userType,
        businessName: user.businessName,
        subscription: user.subscription,
        weighCount: user.weighCount,
        freeWeighs: user.freeWeighs,
        preferences: user.preferences,
        lastLogin: user.lastLogin
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

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name', 'Name is required').not().isEmpty(),
  body('phone', 'Phone number is required').not().isEmpty(),
  body('postcode', 'Postcode is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, phone, postcode, preferences } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.name = name;
    user.phone = phone;
    user.postcode = postcode;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        postcode: user.postcode,
        userType: user.userType,
        businessName: user.businessName,
        preferences: user.preferences
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

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, [
  body('currentPassword', 'Current password is required').exists(),
  body('newPassword', 'New password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Sync user weigh count with actual weighs
// @route   POST /api/auth/sync-weigh-count
// @access  Private
router.post('/sync-weigh-count', protect, async (req, res) => {
  try {
    const Weigh = require('../models/Weigh');
    
    // Count actual weighs for the user
    const actualWeighCount = await Weigh.countDocuments({ userId: req.user.id });
    
    // Update user's weighCount
    const user = await User.findById(req.user.id);
    user.weighCount = actualWeighCount;
    
    // Calculate free weighs based on actual count
    user.freeWeighs = Math.floor(actualWeighCount / 10);
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Weigh count synchronized successfully',
      user: {
        weighCount: user.weighCount,
        freeWeighs: user.freeWeighs
      }
    });
  } catch (error) {
    console.error('Error syncing weigh count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync weigh count',
      error: error.message
    });
  }
});

// @desc    Create DIY client from professional flow and send welcome email
// @route   POST /api/auth/create-diy-client-from-professional
// @access  Private (professional)
const professionalClientService = require('../services/professionalClientService');
router.post(
  '/create-diy-client-from-professional',
  protect,
  authorize('professional'),
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, phone, password } = req.body;

    try {
      const result = await professionalClientService.createDiyClientFromProfessional({
        firstName,
        lastName,
        email,
        phone,
        password,
        professionalOwnerUserId: req.user.id,
      });

      return res.status(201).json({
        success: true,
        created: result.created,
        emailSent: result.emailSent,
        diyClientUserId: result?.user?._id,
      });
    } catch (error) {
      console.error('Error creating DIY client from professional flow:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create DIY client from professional flow',
      });
    }
  }
);

module.exports = router;