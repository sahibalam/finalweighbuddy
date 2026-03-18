const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
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
      required: function () {
        return this.type !== 'debit';
      },
      index: true,
    },
    weighId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Weigh',
      required: function () {
        return this.type !== 'debit';
      },
      index: true,
    },
    setupKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
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
    amount: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      default: 'credit',
      required: true,
    },
    source: {
      type: String,
      enum: ['diy_payment', 'cashout'],
      default: 'diy_payment',
      required: true,
    },
    cashoutRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashoutRequest',
      default: null,
      index: true,
    },
    paymentIntentId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index(
  { professionalId: 1, weighId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'credit' } }
);

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
