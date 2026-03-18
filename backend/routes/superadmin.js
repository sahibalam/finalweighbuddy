const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CashoutRequest = require('../models/CashoutRequest');
const WalletTransaction = require('../models/WalletTransaction');

router.get('/cashout-requests', protect, authorize('superadmin'), async (req, res) => {
  try {
    const status = typeof req.query?.status === 'string' ? req.query.status.trim() : '';
    const q = {};
    if (status) {
      q.status = status;
    }

    const requests = await CashoutRequest.find(q)
      .sort({ createdAt: -1 })
      .populate('professionalId', 'name email')
      .populate('reviewedBy', 'name email')
      .lean();

    return res.json({
      success: true,
      requests: requests.map((r) => ({
        id: r._id,
        professional: r.professionalId
          ? { id: r.professionalId._id, name: r.professionalId.name, email: r.professionalId.email }
          : null,
        amount: r.amount,
        note: r.note,
        status: r.status,
        adminNote: r.adminNote,
        reviewedBy: r.reviewedBy
          ? { id: r.reviewedBy._id, name: r.reviewedBy.name, email: r.reviewedBy.email }
          : null,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching cashout requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cashout requests' });
  }
});

router.post('/cashout-requests/:id/approve', protect, authorize('superadmin'), async (req, res) => {
  try {
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim() : '';

    const request = await CashoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Cashout request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot approve a ${request.status} request` });
    }

    request.status = 'approved';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNote = adminNote;

    await request.save();

    const existingDebit = await WalletTransaction.findOne({
      professionalId: request.professionalId,
      type: 'debit',
      source: 'cashout',
      cashoutRequestId: request._id,
    }).select('_id');

    if (!existingDebit) {
      await WalletTransaction.create({
        professionalId: request.professionalId,
        amount: request.amount,
        type: 'debit',
        source: 'cashout',
        cashoutRequestId: request._id,
        setupKey: `CASHOUT_${String(request._id)}`,
        paymentIntentId: null,
        vehicleRego: null,
        trailerRego: null,
      });
    }

    return res.json({ success: true, requestId: request._id, status: request.status });
  } catch (error) {
    console.error('Error approving cashout request:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve cashout request' });
  }
});

router.post('/cashout-requests/:id/reject', protect, authorize('superadmin'), async (req, res) => {
  try {
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim() : '';

    const request = await CashoutRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Cashout request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot reject a ${request.status} request` });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.adminNote = adminNote;

    await request.save();

    return res.json({ success: true, requestId: request._id, status: request.status });
  } catch (error) {
    console.error('Error rejecting cashout request:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject cashout request' });
  }
});

module.exports = router;
