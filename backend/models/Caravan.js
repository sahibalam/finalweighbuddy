const mongoose = require('mongoose');

const caravanSchema = new mongoose.Schema({
  // Core identification fields
  make: {
    type: String,
    required: [true, 'Caravan make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Caravan model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Caravan year is required'],
    min: [1900, 'Year must be at least 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  
  // Compliance ratings (kg)
  atm: {
    type: Number,
    required: [true, 'Aggregate Trailer Mass (ATM) is required'],
    min: [0, 'ATM must be positive']
  },
  gtm: {
    type: Number,
    required: [true, 'Gross Trailer Mass (GTM) is required'],
    min: [0, 'GTM must be positive']
  },
  axleCapacity: {
    type: Number,
    required: [true, 'Axle Group Capacity is required'],
    min: [0, 'Axle capacity must be positive']
  },
  numberOfAxles: {
    type: String,
    enum: ['Single', 'Dual', 'Triple'],
    default: 'Single'
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  isReferenceData: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    enum: ['manual', 'csv_import', 'user_submission'],
    default: 'manual'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient searching
caravanSchema.index({ make: 1, model: 1, year: 1 });

module.exports = mongoose.model('Caravan', caravanSchema); 