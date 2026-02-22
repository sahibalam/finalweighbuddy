const mongoose = require('mongoose');

const fleetStaffMemberSchema = new mongoose.Schema(
  {
    fleetOwnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

fleetStaffMemberSchema.index({ fleetOwnerUserId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('FleetStaffMember', fleetStaffMemberSchema);
