const mongoose = require('mongoose');

const professionalCustomerSetupSchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    diyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    setupKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    vehicleRego: {
      type: String,
      trim: true,
      default: null,
    },
    trailerRego: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

professionalCustomerSetupSchema.index(
  { professionalId: 1, diyUserId: 1, setupKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProfessionalCustomerSetup', professionalCustomerSetupSchema);
