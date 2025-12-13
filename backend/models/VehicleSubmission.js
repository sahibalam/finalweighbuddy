const mongoose = require('mongoose');

const vehicleSubmissionSchema = new mongoose.Schema({
  // User who submitted the data
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Vehicle details submitted by user
  vehicleData: {
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
    }
  },
  
  // Number plate information
  numberPlate: {
    type: String,
    required: [true, 'Number plate is required'],
    trim: true,
    uppercase: true
  },
  state: {
    type: String,
    required: [true, 'Registration state is required'],
    trim: true,
    uppercase: true
  },
  
  // Uploaded compliance plate photo URL (DigitalOcean Spaces) - Optional
  compliancePlatePhoto: {
    type: String,
    required: false // Made optional
    // TODO: Re-enable Spaces URL validation when implementing DigitalOcean Spaces
    // validate: {
    //   validator: function(v) {
    //     return /^https:\/\/.*\.digitaloceanspaces\.com\/.*$/.test(v);
    //   },
    //   message: 'Compliance plate photo must be a valid DigitalOcean Spaces URL'
    // }
  },
  
  // Submission status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin review details
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  
  // If approved, link to created master vehicle
  approvedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  
  // If approved, link to created registry entry
  approvedRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VehicleRegistry'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
vehicleSubmissionSchema.index({ status: 1, createdAt: -1 });
vehicleSubmissionSchema.index({ submittedBy: 1 });
vehicleSubmissionSchema.index({ numberPlate: 1, state: 1 });

module.exports = mongoose.model('VehicleSubmission', vehicleSubmissionSchema);
