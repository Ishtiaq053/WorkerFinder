/**
 * ──────────────────────────────────────────────────────────────
 *  Verification Routes
 *  Endpoints for worker ID verification.
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, isAdmin, isWorker } = require('../middleware/auth');
const {
  submitVerification,
  getWorkerVerificationStatus,
  getAllVerificationRequests,
  getVerificationRequest,
  approveVerification,
  rejectVerification,
  deleteVerificationRequest
} = require('../controllers/verificationController');

// ── Multer Configuration for ID uploads ──────────────────────
const uploadDir = path.join(__dirname, '../uploads/verifications');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadFields = upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// ── Worker Routes ────────────────────────────────────────────
router.post(
  '/submit',
  authenticate,
  isWorker,
  uploadFields,
  handleUploadErrors,
  submitVerification
);

router.get('/status', authenticate, isWorker, getWorkerVerificationStatus);

// ── Admin Routes ─────────────────────────────────────────────
router.get('/requests', authenticate, isAdmin, getAllVerificationRequests);
router.get('/request/:id', authenticate, isAdmin, getVerificationRequest);
router.put('/approve/:id', authenticate, isAdmin, approveVerification);
router.put('/reject/:id', authenticate, isAdmin, rejectVerification);
router.delete('/request/:id', authenticate, isAdmin, deleteVerificationRequest);

// ── Serve verification images (no auth needed — filenames are random UUIDs) ──
router.use('/images', express.static(uploadDir));

module.exports = router;
