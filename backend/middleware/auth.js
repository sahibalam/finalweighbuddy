const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Weigh = require('../models/Weigh');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user is active
exports.checkActive = async (req, res, next) => {
  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }
  next();
};

// Check subscription status for professional users
exports.checkSubscription = async (req, res, next) => {
  if (req.user.userType === 'professional') {
    // Backwards compatibility: allow professional users when subscription is not configured
    // (older accounts / dev data) rather than hard-blocking with 403.
    if (!req.user.subscription || typeof req.user.subscription !== 'object') {
      return next();
    }

    // If subscription exists but is not active, do not hard-block core app actions.
    // This prevents professional flows from failing in dev / partially-migrated user records.
    if (req.user.subscription.status !== 'active') {
      return next();
    }
    
    // Check if subscription has expired
    if (req.user.subscription.endDate && new Date() > req.user.subscription.endDate) {
      // Mark subscription as expired
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.status': 'inactive'
      });
      
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
        requiresSubscription: true
      });
    }
    
    // Check monthly weigh limits
    const subscriptionPlans = {
      basic: { weighLimit: 50 },
      premium: { weighLimit: 200 },
      enterprise: { weighLimit: -1 } // Unlimited
    };
    
    const currentPlan = subscriptionPlans[req.user.subscription.type];
    if (currentPlan && currentPlan.weighLimit > 0) {
      // Get current month weigh count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentMonthWeighs = await Weigh.countDocuments({
        userId: req.user.id,
        createdAt: { $gte: startOfMonth }
      });
      
      if (currentMonthWeighs >= currentPlan.weighLimit) {
        return res.status(403).json({
          success: false,
          message: `Monthly weigh limit reached (${currentPlan.weighLimit}). Please upgrade your subscription for more weighs.`,
          limitReached: true,
          currentUsage: currentMonthWeighs,
          monthlyLimit: currentPlan.weighLimit
        });
      }
    }
  }
  next();
};

 