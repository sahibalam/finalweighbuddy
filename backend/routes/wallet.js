const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const WalletTransaction = require('../models/WalletTransaction');
const mongoose = require('mongoose');
const CashoutRequest = require('../models/CashoutRequest');

const toObjectIdOrValue = (value) => {
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return value;
};

router.post('/cashout-requests', protect, authorize('professional'), async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const professionalId = toObjectIdOrValue(req.user.id);

    const creditAgg = await WalletTransaction.aggregate([
      { $match: { professionalId, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const creditsTotal = creditAgg?.[0]?.total || 0;

    const debitAgg = await WalletTransaction.aggregate([
      { $match: { professionalId, type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const debitsTotal = debitAgg?.[0]?.total || 0;

    const pendingAgg = await CashoutRequest.aggregate([
      { $match: { professionalId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingTotal = pendingAgg?.[0]?.total || 0;

    const availableBalance = Math.max(0, Number(creditsTotal) - Number(debitsTotal));
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Cashout amount exceeds available balance',
        availableBalance,
      });
    }

    const request = await CashoutRequest.create({
      professionalId,
      amount,
      note,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      requestId: request._id,
      availableBalance,
      requestedBalance: pendingTotal + amount,
    });
  } catch (error) {
    console.error('Error creating cashout request:', error);
    return res.status(500).json({ success: false, message: 'Failed to create cashout request' });
  }
});

router.get('/summary', protect, authorize('professional'), async (req, res) => {
  try {
    const professionalId = toObjectIdOrValue(req.user.id);

    const creditAgg = await WalletTransaction.aggregate([
      { $match: { professionalId, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const creditsTotal = creditAgg?.[0]?.total || 0;

    const debitAgg = await WalletTransaction.aggregate([
      { $match: { professionalId, type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const debitsTotal = debitAgg?.[0]?.total || 0;

    const pendingAgg = await CashoutRequest.aggregate([
      { $match: { professionalId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingTotal = pendingAgg?.[0]?.total || 0;

    const availableBalance = Math.max(0, Number(creditsTotal) - Number(debitsTotal));

    return res.json({
      success: true,
      availableBalance,
      requestedBalance: pendingTotal,
    });
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet summary',
    });
  }
});

router.get('/transactions', protect, authorize('professional'), async (req, res) => {
  try {
    const professionalId = toObjectIdOrValue(req.user.id);

    const transactions = await WalletTransaction.find({
      professionalId,
    })
      .sort({ createdAt: -1 })
      .populate('diyUserId', 'name email')
      .populate('cashoutRequestId', 'status reviewedAt createdAt')
      .select('diyUserId vehicleRego trailerRego setupKey amount type source cashoutRequestId createdAt');

    return res.json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        source: t.source,
        diyUser: t.diyUserId
          ? { id: t.diyUserId._id, name: t.diyUserId.name, email: t.diyUserId.email }
          : null,
        vehicleRego: t.vehicleRego,
        trailerRego: t.trailerRego,
        setupKey: t.setupKey,
        amount: t.amount,
        cashout: t.cashoutRequestId
          ? {
              id: t.cashoutRequestId._id,
              status: t.cashoutRequestId.status,
              reviewedAt: t.cashoutRequestId.reviewedAt,
              createdAt: t.cashoutRequestId.createdAt,
            }
          : null,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet transactions',
    });
  }
});

module.exports = router;
