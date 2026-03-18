const express = require('express');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createDiyClientFromProfessional } = require('../services/professionalClientService');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

const issueAuthResponse = (res, user, status = 200) => {
  const token = user.getJwtToken();
  return res.status(status).json({
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
      abn: user.abn,
      logoUrl: user.logoUrl || null,
      postalAddress: user.postalAddress,
      state: user.state,
      subscription: user.subscription,
      weighCount: user.weighCount,
      freeWeighs: user.freeWeighs,
    },
  });
};

const buildFrontendRedirectUrl = (pathWithQuery) => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const p = String(pathWithQuery || '').startsWith('/') ? String(pathWithQuery) : `/${String(pathWithQuery || '')}`;
  return `${base}${p}`;
};

const getGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const backendBase = (process.env.BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');
  const redirectUri = `${backendBase}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return null;
  }

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
};

const decodeGoogleIdToken = async (oauthClient, idToken) => {
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });
  return ticket.getPayload();
};

const createPendingSignupToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    {
      purpose: 'google_pending_signup',
      ...payload,
    },
    secret,
    { expiresIn: '15m' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  body('phone', 'Phone number is required').not().isEmpty(),
  body('userType', 'User type must be professional, fleet, diy, admin, or superadmin').isIn(['professional', 'fleet', 'diy', 'admin', 'superadmin']),
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
  }),
  body('abn').custom((value, { req }) => {
    if (
      (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
      (!value || String(value).trim() === '')
    ) {
      throw new Error('ABN is required for professional and fleet users');
    }
    return true;
  }),
  body('logoUrl').custom((value, { req }) => {
    if (
      (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
      (!value || String(value).trim() === '')
    ) {
      throw new Error('Logo URL is required for professional and fleet users');
    }
    return true;
  }),
  body('postalAddress').custom((value, { req }) => {
    if (
      (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
      (!value || String(value).trim() === '')
    ) {
      throw new Error('Postal address is required for professional and fleet users');
    }
    return true;
  }),
  body('state').custom((value, { req }) => {
    if (
      (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
      (!value || String(value).trim() === '')
    ) {
      throw new Error('State is required for professional and fleet users');
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

  const { name, email, password, phone, postcode, userType, businessName, logoUrl, abn, postalAddress, state } = req.body;

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
      businessName: userType === 'professional' || userType === 'fleet' ? businessName : undefined,
      abn: userType === 'professional' || userType === 'fleet' ? String(abn || '').trim() : undefined,
      logoUrl: userType === 'professional' || userType === 'fleet' ? String(logoUrl || '').trim() : undefined,
      postalAddress: userType === 'professional' || userType === 'fleet' ? String(postalAddress || '').trim() : undefined,
      state: userType === 'professional' || userType === 'fleet' ? String(state || '').trim() : undefined,
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
        businessName: user.businessName,
        logoUrl: user.logoUrl || null,
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
        abn: user.abn,
        logoUrl: user.logoUrl,
        postalAddress: user.postalAddress,
        state: user.state,
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
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
        abn: user.abn,
        logoUrl: user.logoUrl,
        postalAddress: user.postalAddress,
        state: user.state,
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

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByEmailLoose = async (email) => {
  const emailNorm = String(email || '').trim().toLowerCase();
  if (!emailNorm) return null;

  const rx = new RegExp(`^${escapeRegex(emailNorm)}$`, 'i');
  return User.findOne({ email: rx });
};

const logDbInfoDev = (tag) => {
  if (process.env.NODE_ENV !== 'development') return;
  try {
    const conn = mongoose.connection;
    console.log(tag, {
      dbName: conn?.name,
      host: conn?.host,
    });
  } catch (e) {
    // ignore
  }
};
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

    const { firstName, lastName, email, phone, password, vehicleRego, trailerRego } = req.body;

    try {
      const result = await professionalClientService.createDiyClientFromProfessional({
        firstName,
        lastName,
        email,
        phone,
        password,
        professionalOwnerUserId: req.user.id,
      });

      // Optional: register this setup under the professional so future DIY
      // self-serve checks with the same identifiers can be credited.
      try {
        const normalizeRego = (value) => {
          const v = value === undefined || value === null ? '' : String(value);
          const trimmed = v.trim();
          return trimmed ? trimmed.toUpperCase() : '';
        };

        const computeSetupKey = ({ vehicleRego: vRaw, trailerRego: tRaw }) => {
          const v = normalizeRego(vRaw);
          const t = normalizeRego(tRaw);
          if (v && t) return `VT:${v}|${t}`;
          if (v) return `V:${v}`;
          if (t) return `T:${t}`;
          return '';
        };

        const setupKey = computeSetupKey({ vehicleRego, trailerRego });
        if (setupKey && result?.user?._id) {
          const ProfessionalCustomerSetup = require('../models/ProfessionalCustomerSetup');
          await ProfessionalCustomerSetup.updateOne(
            {
              professionalId: req.user.id,
              diyUserId: result.user._id,
              setupKey,
            },
            {
              $setOnInsert: {
                professionalId: req.user.id,
                diyUserId: result.user._id,
                setupKey,
                vehicleRego: normalizeRego(vehicleRego) || null,
                trailerRego: normalizeRego(trailerRego) || null,
              },
            },
            { upsert: true }
          );
        }
      } catch (setupErr) {
        console.error('Error saving professional customer setup mapping:', setupErr);
      }

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

// @desc    Lookup an existing DIY client for a professional by email or phone
// @route   GET /api/auth/professional-clients/lookup?query=
// @access  Private (professional)
router.get(
  '/professional-clients/lookup',
  protect,
  authorize('professional'),
  async (req, res) => {
    try {
      const rawQuery = req.query.query;
      const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required',
        });
      }

      const client = await User.findOne({
        userType: 'diy',
        professionalOwnerUserId: req.user.id,
        $or: [{ email: query }, { phone: query }],
      }).select('name email phone');

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      return res.json({
        success: true,
        client: {
          id: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
        },
      });
    } catch (error) {
      console.error('Error looking up professional client:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to lookup client',
      });
    }
  }
);

// @desc    Start Google OAuth
// @route   GET /api/auth/google/start
// @access  Public
router.get('/google/start', async (req, res) => {
  const rid = crypto.randomBytes(6).toString('hex');
  try {
    const redirectModeRaw = typeof req.query.mode === 'string' ? req.query.mode : '';
    const redirectMode = redirectModeRaw === 'signup' ? 'signup' : 'login';
    console.log(`[GoogleOAuth:start:${rid}] hit`, {
      mode: redirectMode,
      hasClientId: Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID),
      hasClientSecret: Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET),
      nodeEnv: process.env.NODE_ENV,
    });

    const oauthClient = getGoogleOAuthClient();
    if (!oauthClient) {
      console.log(`[GoogleOAuth:start:${rid}] missing oauth client`);
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server',
      });
    }

    const state = crypto.randomBytes(16).toString('hex');
    console.log(`[GoogleOAuth:start:${rid}] setting cookies`, {
      statePrefix: state.slice(0, 6),
      mode: redirectMode,
    });

    res.cookie('google_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });

    res.cookie('google_oauth_mode', redirectMode, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000,
    });

    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account',
      scope: ['openid', 'email', 'profile'],
      state,
    });

    console.log(`[GoogleOAuth:start:${rid}] redirecting to google`, {
      urlPrefix: typeof url === 'string' ? url.slice(0, 60) : 'unknown',
    });

    return res.redirect(url);
  } catch (error) {
    console.error('Error starting Google OAuth:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start Google OAuth',
    });
  }
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  const rid = crypto.randomBytes(6).toString('hex');
  try {
    logDbInfoDev(`[GoogleOAuth:callback:${rid}] db`);

    console.log(`[GoogleOAuth:callback:${rid}] hit`, {
      hasCode: typeof req.query.code === 'string' && Boolean(req.query.code),
      hasState: typeof req.query.state === 'string' && Boolean(req.query.state),
      queryKeys: Object.keys(req.query || {}),
      cookieKeys: Object.keys(req.cookies || {}),
    });

    const oauthClient = getGoogleOAuthClient();
    if (!oauthClient) {
      console.log(`[GoogleOAuth:callback:${rid}] missing oauth client`);
      return res.redirect(buildFrontendRedirectUrl('/login?google=not_configured'));
    }

    const stateCookie = req.cookies?.google_oauth_state;
    const expectedState = typeof stateCookie === 'string' ? stateCookie : '';
    const providedState = typeof req.query.state === 'string' ? req.query.state : '';
    const mode = req.cookies?.google_oauth_mode === 'signup' ? 'signup' : 'login';

    console.log(`[GoogleOAuth:callback:${rid}] state/mode check`, {
      mode,
      expectedStatePresent: Boolean(expectedState),
      providedStatePresent: Boolean(providedState),
      expectedPrefix: expectedState ? expectedState.slice(0, 6) : null,
      providedPrefix: providedState ? providedState.slice(0, 6) : null,
      stateMatch: Boolean(expectedState && providedState && expectedState === providedState),
    });

    if (!expectedState || !providedState || expectedState !== providedState) {
      return res.redirect(buildFrontendRedirectUrl(`/login?google=state_mismatch&mode=${mode}`));
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      return res.redirect(buildFrontendRedirectUrl(`/login?google=missing_code&mode=${mode}`));
    }

    console.log(`[GoogleOAuth:callback:${rid}] exchanging code for tokens`);

    const { tokens } = await oauthClient.getToken(code);
    const idToken = tokens?.id_token;
    if (!idToken) {
      return res.redirect(buildFrontendRedirectUrl(`/login?google=missing_id_token&mode=${mode}`));
    }

    console.log(`[GoogleOAuth:callback:${rid}] received id_token`, {
      idTokenPrefix: String(idToken).slice(0, 12),
    });

    const profile = await decodeGoogleIdToken(oauthClient, idToken);
    const email = String(profile?.email || '').toLowerCase().trim();
    const name = String(profile?.name || '').trim();
    const emailVerified = Boolean(profile?.email_verified);

    console.log(`[GoogleOAuth:callback:${rid}] profile decoded`, {
      email,
      hasName: Boolean(name),
      emailVerified,
      mode,
    });

    if (!email) {
      return res.redirect(buildFrontendRedirectUrl(`/login?google=missing_email&mode=${mode}`));
    }

    const existing = await findUserByEmailLoose(email);
    if (existing) {
      const token = existing.getJwtToken();
      console.log(`[GoogleOAuth:callback:${rid}] existing user -> /oauth/success`, {
        userId: existing._id,
        userType: existing.userType,
      });
      return res.redirect(buildFrontendRedirectUrl(`/oauth/success?token=${encodeURIComponent(token)}`));
    }

    const pendingToken = createPendingSignupToken({
      email,
      name: name || email,
      emailVerified,
    });

    console.log(`[GoogleOAuth:callback:${rid}] new user -> /oauth/complete`, {
      email,
      pendingPrefix: String(pendingToken).slice(0, 12),
      mode,
    });

    return res.redirect(
      buildFrontendRedirectUrl(`/oauth/complete?pending=${encodeURIComponent(pendingToken)}&mode=${encodeURIComponent(mode)}`)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return res.redirect(buildFrontendRedirectUrl('/login?google=error'));
  }
});

// @desc    Finalize Google OAuth signup (collect required fields)
// @route   POST /api/auth/google/finalize
// @access  Public
router.post(
  '/google/finalize',
  [
    body('pending', 'Pending token is required').not().isEmpty(),
    body('phone', 'Phone number is required').not().isEmpty(),
    body('userType', 'User type must be professional, fleet, diy, admin, or superadmin').isIn(['professional', 'fleet', 'diy', 'admin', 'superadmin']),
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
    }),
    body('abn').custom((value, { req }) => {
      if (
        (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
        (!value || String(value).trim() === '')
      ) {
        throw new Error('ABN is required for professional and fleet users');
      }
      return true;
    }),
    body('logoUrl').custom((value, { req }) => {
      if (
        (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
        (!value || String(value).trim() === '')
      ) {
        throw new Error('Logo URL is required for professional and fleet users');
      }
      return true;
    }),
    body('postalAddress').custom((value, { req }) => {
      if (
        (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
        (!value || String(value).trim() === '')
      ) {
        throw new Error('Postal address is required for professional and fleet users');
      }
      return true;
    }),
    body('state').custom((value, { req }) => {
      if (
        (req.body.userType === 'professional' || req.body.userType === 'fleet') &&
        (!value || String(value).trim() === '')
      ) {
        throw new Error('State is required for professional and fleet users');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const rid = crypto.randomBytes(6).toString('hex');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[GoogleOAuth:finalize:${rid}] validation error`, {
        errors: errors.array()?.map((e) => ({ msg: e.msg, param: e.param })),
      });
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { pending, phone, userType, postcode, businessName, logoUrl, abn, postalAddress, state } = req.body;
    try {
      logDbInfoDev(`[GoogleOAuth:finalize:${rid}] db`);
      console.log(`[GoogleOAuth:finalize:${rid}] hit`, {
        userType,
        phonePresent: Boolean(phone),
        pendingPrefix: typeof pending === 'string' ? pending.slice(0, 12) : null,
      });
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(pending, secret);

      if (!decoded || decoded.purpose !== 'google_pending_signup') {
        return res.status(400).json({
          success: false,
          message: 'Invalid pending signup token',
        });
      }

      const email = String(decoded.email || '').toLowerCase().trim();
      const name = String(decoded.name || '').trim() || email;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Invalid pending signup token',
        });
      }

      const existing = await findUserByEmailLoose(email);
      if (existing) {
        console.log(`[GoogleOAuth:finalize:${rid}] user already exists, issuing token`, {
          userId: existing._id,
          userType: existing.userType,
        });
        return issueAuthResponse(res, existing, 200);
      }

      const randomPassword = crypto.randomBytes(24).toString('hex');
      const user = new User({
        name,
        email,
        phone,
        password: randomPassword,
        userType,
        postcode: userType === 'professional' || userType === 'fleet' ? String(postcode || '').trim() : undefined,
        businessName: userType === 'professional' || userType === 'fleet' ? businessName : undefined,
        abn: userType === 'professional' || userType === 'fleet' ? String(abn || '').trim() : undefined,
        logoUrl: userType === 'professional' || userType === 'fleet' ? String(logoUrl || '').trim() : undefined,
        postalAddress: userType === 'professional' || userType === 'fleet' ? String(postalAddress || '').trim() : undefined,
        state: userType === 'professional' || userType === 'fleet' ? String(state || '').trim() : undefined,
        emailVerified: Boolean(decoded.emailVerified),
      });

      try {
        await user.save();
      } catch (saveError) {
        // If unique index is not enforced or duplicates exist, this may still happen.
        // Handle duplicate key by logging in the existing account instead of failing.
        if (saveError && (saveError.code === 11000 || String(saveError.message || '').includes('E11000'))) {
          const dup = await findUserByEmailLoose(email);
          if (dup) {
            console.log(`[GoogleOAuth:finalize:${rid}] duplicate email on save, issuing token for existing user`, {
              userId: dup._id,
              userType: dup.userType,
            });
            return issueAuthResponse(res, dup, 200);
          }
        }
        throw saveError;
      }

      console.log(`[GoogleOAuth:finalize:${rid}] created user, issuing token`, {
        userId: user._id,
        userType: user.userType,
      });
      return issueAuthResponse(res, user, 201);
    } catch (error) {
      console.error('Google finalize error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to finalize Google signup',
      });
    }
  }
);

module.exports = router;