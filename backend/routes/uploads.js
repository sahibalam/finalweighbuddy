const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Ensure compliance plates uploads dir exists
const uploadDir = path.join(__dirname, '../uploads/compliance-plates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (ok.includes(file.mimetype)) cb(null, true); else cb(new Error('Invalid file type'));
  }
});

// @desc Upload one compliance image
// @route POST /api/uploads/compliance
// @access Private
router.post('/compliance', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  // Serve all compliance images from the unified /uploads/compliance-plates path
  const url = `/uploads/compliance-plates/${req.file.filename}`;
  return res.json({ success: true, url });
});

module.exports = router;







