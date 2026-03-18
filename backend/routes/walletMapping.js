const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const ProfessionalCustomerSetup = require('../models/ProfessionalCustomerSetup');

const normalizeRego = (value) => {
  const v = value === undefined || value === null ? '' : String(value);
  const trimmed = v.trim();
  return trimmed ? trimmed.toUpperCase() : '';
};

const computeSetupKey = ({ vehicleRego, trailerRego }) => {
  const v = normalizeRego(vehicleRego);
  const t = normalizeRego(trailerRego);
  if (v && t) return `VT:${v}|${t}`;
  if (v) return `V:${v}`;
  if (t) return `T:${t}`;
  return '';
};

router.post('/register-setup', protect, authorize('professional'), async (req, res) => {
  try {
    const { diyUserId, vehicleRego, trailerRego } = req.body || {};

    // eslint-disable-next-line no-console
    console.log('wallet/register-setup called', {
      professionalId: String(req.user?.id),
      diyUserId: String(diyUserId || ''),
      vehicleRego: normalizeRego(vehicleRego) || null,
      trailerRego: normalizeRego(trailerRego) || null,
    });

    if (!diyUserId) {
      return res.status(400).json({ success: false, message: 'diyUserId is required' });
    }

    const setupKey = computeSetupKey({ vehicleRego, trailerRego });
    if (!setupKey) {
      return res.status(400).json({ success: false, message: 'At least one rego is required' });
    }

    // eslint-disable-next-line no-console
    console.log('wallet/register-setup computed setupKey', { setupKey });

    const diyUser = await User.findOne({
      _id: diyUserId,
      userType: 'diy',
      professionalOwnerUserId: req.user.id,
    }).select('_id');

    if (!diyUser) {
      return res.status(404).json({ success: false, message: 'DIY user not found for this professional' });
    }

    await ProfessionalCustomerSetup.updateOne(
      {
        professionalId: req.user.id,
        diyUserId,
        setupKey,
      },
      {
        $setOnInsert: {
          professionalId: req.user.id,
          diyUserId,
          setupKey,
          vehicleRego: normalizeRego(vehicleRego) || null,
          trailerRego: normalizeRego(trailerRego) || null,
        },
      },
      { upsert: true }
    );

    // eslint-disable-next-line no-console
    console.log('wallet/register-setup upserted mapping', {
      professionalId: String(req.user?.id),
      diyUserId: String(diyUserId || ''),
      setupKey,
    });

    return res.json({ success: true, setupKey });
  } catch (error) {
    console.error('Error registering professional customer setup:', error);
    return res.status(500).json({ success: false, message: 'Failed to register setup' });
  }
});

module.exports = router;
