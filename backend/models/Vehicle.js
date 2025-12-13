const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  // Core identification fields
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  series: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year must be at least 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  variant: {
    type: String,
    required: [true, 'Vehicle variant is required'],
    trim: true
  },
  
  // Technical specifications
  engine: {
    type: String,
    trim: true
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    default: 'Automatic'
  },
  tyreSize: {
    type: String,
    trim: true
  },
  hasSubTank: {
    type: Boolean,
    default: false
  },
  
  // Compliance ratings (kg)
  fawr: {
    type: Number,
    required: [true, 'Front Axle Weight Rating (FAWR) is required'],
    min: [0, 'FAWR must be positive']
  },
  rawr: {
    type: Number,
    required: [true, 'Rear Axle Weight Rating (RAWR) is required'],
    min: [0, 'RAWR must be positive']
  },
  gvm: {
    type: Number,
    required: [true, 'Gross Vehicle Mass (GVM) is required'],
    min: [0, 'GVM must be positive']
  },
  btc: {
    type: Number,
    required: [true, 'Braked Towing Capacity (BTC) is required'],
    min: [0, 'BTC must be positive']
  },
  tbm: {
    type: Number,
    required: [true, 'TBM is required'],
    min: [0, 'TBM must be positive']
  },
  gcm: {
    type: Number,
    required: [true, 'Gross Combined Mass (GCM) is required'],
    min: [0, 'GCM must be positive']
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
vehicleSchema.index({ make: 1, model: 1, year: 1, variant: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema); 