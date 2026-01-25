
const mongoose = require('mongoose');

const weighSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Vehicle and Caravan registry references
  vehicleRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleRegistry'
  },
  caravanRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaravanRegistry'
  },
  
  // Vehicle and Caravan references
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  caravan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caravan'
  },
  
  // Customer information
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true
  },
  
  // Vehicle weights (hitched condition)
  vehicleFrontLeft: {
    type: Number,
    required: false, // Not required for DIY users
    min: [0, 'Weight must be positive']
  },
  vehicleFrontRight: {
    type: Number,
    required: false, // Not required for DIY users
    min: [0, 'Weight must be positive']
  },
  vehicleRearLeft: {
    type: Number,
    required: false, // Not required for DIY users
    min: [0, 'Weight must be positive']
  },
  vehicleRearRight: {
    type: Number,
    required: false, // Not required for DIY users
    min: [0, 'Weight must be positive']
  },
  vehicleWeightHitched: {
    type: Number,
    required: [true, 'Hitched vehicle total weight is required'],
    min: [0, 'Weight must be positive']
  },
  
  // Vehicle weights (unhitched condition)
  vehicleFrontLeftUnhitched: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  vehicleFrontRightUnhitched: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  vehicleRearLeftUnhitched: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  vehicleRearRightUnhitched: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  vehicleWeightUnhitched: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  
  // Caravan weights
  caravanWeight: {
    type: Number,
    required: [true, 'Caravan total weight is required'],
    min: [0, 'Weight must be positive']
  },
  caravanAxleLeft: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  caravanAxleRight: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  
  // Calculated weights
  towBallWeight: {
    type: Number,
    required: [true, 'Tow ball weight is required'],
    min: [0, 'Weight must be positive']
  },
  
  // Load information
  frontPassengers: {
    type: Number,
    default: 0,
    min: [0, 'Passenger count must be non-negative']
  },
  rearPassengers: {
    type: Number,
    default: 0,
    min: [0, 'Passenger count must be non-negative']
  },
  carFuel: {
    type: String,
    enum: ['Empty', 'Half', 'Full'],
    default: 'Half'
  },
  vanWater: {
    type: String,
    enum: ['Empty', 'Half', 'Full'],
    default: 'Empty'
  },
  
  // DIY pre-weigh information (Vehicle Only screen)
  preWeigh: {
    fuelLevel: {
      type: Number,
      min: [0, 'Fuel level must be non-negative'],
      max: [100, 'Fuel level cannot exceed 100%']
    },
    passengersFront: {
      type: Number,
      min: [0, 'Passenger count must be non-negative'],
      default: 0
    },
    passengersRear: {
      type: Number,
      min: [0, 'Passenger count must be non-negative'],
      default: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  
  // Image uploads
  vehiclePlateImageUrl: {
    type: String,
    trim: true
  },
  caravanPlateImageUrl: {
    type: String,
    trim: true
  },
  modifiedVehicleComplianceImages: [
    {
      type: String,
      trim: true
    }
  ],
  
  // Compliance results
  complianceResults: {
    vehicle: {
      gvm: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      },
      frontAxle: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      },
      rearAxle: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      },
      btc: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      }
    },
    caravan: {
      atm: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      },
      axleGroupTotal: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      }
    },
    combination: {
      gcm: {
        actual: Number,
        limit: Number,
        compliant: Boolean,
        percentage: Number
      }
    },
    overallCompliant: Boolean
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['card', 'cash', 'direct', 'stripe'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: String,
    completedAt: Date
  },
  
  // Report generation
  reportUrl: String,
  reportGeneratedAt: Date,
  
  // Status and metadata
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Data governance fields for user-provided data
  vehicleData: {
    type: mongoose.Schema.Types.Mixed, // Store complete vehicle data from user
    required: false
  },
  caravanData: {
    type: mongoose.Schema.Types.Mixed, // Store complete caravan data from user
    required: false
  },
  hasUserProvidedVehicleData: {
    type: Boolean,
    default: false
  },
  hasUserProvidedCaravanData: {
    type: Boolean,
    default: false
  },
  requiresAdminReview: {
    type: Boolean,
    default: false
  },
  adminReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String
}, {
  timestamps: true
});

// Indexes for efficient querying
weighSchema.index({ userId: 1, createdAt: -1 });
weighSchema.index({ vehicleRegistryId: 1 });
weighSchema.index({ caravanRegistryId: 1 });
weighSchema.index({ status: 1 });
weighSchema.index({ requiresAdminReview: 1, adminReviewed: 1 }); // For admin review dashboard

module.exports = mongoose.model('Weigh', weighSchema); 