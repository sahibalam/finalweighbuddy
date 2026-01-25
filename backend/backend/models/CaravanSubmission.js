const mongoose = require('mongoose');

const caravanSubmissionSchema = new mongoose.Schema({
  // User who submitted the data
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Caravan details submitted by user
  caravanData: {
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
  
  // If approved, link to created master caravan
  approvedCaravanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caravan'
  },
  
  // If approved, link to created registry entry
  approvedRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CaravanRegistry'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
caravanSubmissionSchema.index({ status: 1, createdAt: -1 });
caravanSubmissionSchema.index({ submittedBy: 1 });
caravanSubmissionSchema.index({ numberPlate: 1, state: 1 });

module.exports = mongoose.model('CaravanSubmission', caravanSubmissionSchema);
