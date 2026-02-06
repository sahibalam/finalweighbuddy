const express = require('express');
const { body, validationResult } = require('express-validator');
const FleetStaffMember = require('../models/FleetStaffMember');
const User = require('../models/User');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/auth');
const { sendDiyWelcomeEmail } = require('../services/professionalClientService');

const router = express.Router();

router.get('/staff', protect, authorize('fleet'), async (req, res) => {
  try {
    const staff = await FleetStaffMember.find({ fleetOwnerUserId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, staff });
  } catch (error) {
    console.error('Failed to list fleet staff:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post(
  '/staff',
  protect,
  authorize('fleet'),
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password').optional({ nullable: true }).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { firstName, lastName, email, password } = req.body;

      const normalizedEmail = String(email).trim().toLowerCase();

      const existingUser = await User.findOne({ email: normalizedEmail }).lean();
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with that email already exists',
        });
      }

      const shouldGeneratePassword = !password;
      const resolvedPassword = shouldGeneratePassword
        ? crypto.randomBytes(9).toString('base64url')
        : String(password);

      const staffUser = await User.create({
        name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        email: normalizedEmail,
        password: resolvedPassword,
        phone: req.user.phone,
        postcode: req.user.postcode,
        userType: 'diy',
        fleetOwnerUserId: req.user.id,
        isActive: true,
      });

      const staffMember = await FleetStaffMember.create({
        fleetOwnerUserId: req.user.id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
      });

      res.status(201).json({
        success: true,
        staffMember,
        tempPassword: shouldGeneratePassword ? resolvedPassword : undefined,
        userId: staffUser._id,
      });
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A staff member with that email already exists for this company',
        });
      }
      console.error('Failed to create fleet staff member:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.put(
  '/staff/:id',
  protect,
  authorize('fleet'),
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { firstName, lastName, email } = req.body;

      const staffMember = await FleetStaffMember.findOneAndUpdate(
        { _id: id, fleetOwnerUserId: req.user.id },
        {
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          email: String(email).trim().toLowerCase(),
        },
        { new: true }
      );

      if (!staffMember) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      res.json({ success: true, staffMember });
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A staff member with that email already exists for this company',
        });
      }
      console.error('Failed to update fleet staff member:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.delete('/staff/:id', protect, authorize('fleet'), async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await FleetStaffMember.findOneAndDelete({
      _id: id,
      fleetOwnerUserId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete fleet staff member:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post(
  '/staff/send-credentials',
  protect,
  authorize('fleet'),
  [
    body('email', 'Please include a valid email').isEmail(),
    body('firstName').optional({ nullable: true }).isString(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const email = String(req.body.email).trim().toLowerCase();
      const firstName = req.body.firstName ? String(req.body.firstName).trim() : '';
      const password = String(req.body.password);

      const staffMember = await FleetStaffMember.findOne({
        fleetOwnerUserId: req.user.id,
        email,
      }).lean();

      if (!staffMember) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found for this company',
        });
      }

      await sendDiyWelcomeEmail({
        email,
        firstName: firstName || staffMember.firstName,
        password,
      });

      return res.json({ success: true, emailSent: true });
    } catch (error) {
      console.error('Failed to send fleet staff credentials email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
      });
    }
  }
);

module.exports = router;
