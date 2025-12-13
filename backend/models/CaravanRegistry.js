const mongoose = require('mongoose');

const caravanRegistrySchema = new mongoose.Schema({
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
  
  // Link to master caravan
  masterCaravanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caravan',
    required: [true, 'Master caravan reference is required']
  },
  
  // User who registered this caravan (for Pro users)
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
caravanRegistrySchema.index({ numberPlate: 1, state: 1 }, { unique: true });
caravanRegistrySchema.index({ masterCaravanId: 1 });

module.exports = mongoose.model('CaravanRegistry', caravanRegistrySchema);



