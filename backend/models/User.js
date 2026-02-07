const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  postcode: {
    type: String,
    // Postcode is required for professional and fleet users; optional for DIY/admin
    required: function () {
      return this.userType === 'professional' || this.userType === 'fleet';
    },
    trim: true
  },
  userType: {
    type: String,
    enum: ['professional', 'fleet', 'diy', 'admin'],
    default: 'diy'
  },
  professionalOwnerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  fleetOwnerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  businessName: {
    type: String,
    trim: true,
    required: function() { return this.userType === 'professional' || this.userType === 'fleet'; }
  },
  subscription: {
    type: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date
  },
  weighCount: {
    type: Number,
    default: 0
  },
  freeWeighs: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    }
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getJwtToken = function() {
      return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Check if user has free weighs available
userSchema.methods.hasFreeWeighs = function() {
  return this.freeWeighs > 0;
};

// Add free weigh (for reward system)
userSchema.methods.addFreeWeigh = function() {
  this.freeWeighs += 1;
  return this.save();
};

// Use free weigh
userSchema.methods.useFreeWeigh = function() {
  if (this.freeWeighs > 0) {
    this.freeWeighs -= 1;
    return this.save();
  }
  return false;
};

module.exports = mongoose.model('User', userSchema); 