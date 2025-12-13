const mongoose = require('mongoose');

const vehicleRegistrySchema = new mongoose.Schema({
  // Number plate identification
  numberPlate: {
    type: String,
    required: [true, 'Number plate is required'],
    trim: true,
    uppercase: true,
    unique: true
  },
  state: {
    type: String,
    required: [true, 'Registration state is required'],
    trim: true,
    uppercase: true
  },
  
  // Link to master vehicle
  masterVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Master vehicle reference is required']
  },
  
  // User who registered this vehicle (for Pro users)
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
vehicleRegistrySchema.index({ numberPlate: 1, state: 1 }, { unique: true });
vehicleRegistrySchema.index({ masterVehicleId: 1 });

module.exports = mongoose.model('VehicleRegistry', vehicleRegistrySchema);



