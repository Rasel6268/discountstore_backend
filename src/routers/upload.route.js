const express = require('express');
const upload = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');
const verifyToken = require('../middleware/verifyToken');
const AdminVerify = require('../middleware/AdminVerify');
const { uploadRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper middleware to accept any field name ('image', 'file', 'images', 'files', etc.)
const handleAnyFile = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

// ==========================================
// PUBLIC / CONFIG ENDPOINTS
// ==========================================
// GET /config - Public configuration for image uploads & formats
router.get('/config', uploadController.getConfig);

// GET /auth - Legacy compatibility for client auth tokens
router.get('/auth', uploadController.getAuthParams);

// ==========================================
// SECURE UPLOAD ENDPOINTS (ADMIN ONLY)
// ==========================================
// POST / or POST /upload - Single image upload
router.post(
  '/',
  verifyToken,
  AdminVerify,
  uploadRateLimiter,
  handleAnyFile,
  uploadController.uploadSingle
);

router.post(
  '/upload',
  verifyToken,
  AdminVerify,
  uploadRateLimiter,
  handleAnyFile,
  uploadController.uploadSingle
);

// POST /multiple or POST /upload-multiple - Multiple images upload
router.post(
  '/multiple',
  verifyToken,
  AdminVerify,
  uploadRateLimiter,
  handleAnyFile,
  uploadController.uploadMultiple
);

router.post(
  '/upload-multiple',
  verifyToken,
  AdminVerify,
  uploadRateLimiter,
  handleAnyFile,
  uploadController.uploadMultiple
);

// ==========================================
// SECURE DELETE ENDPOINTS (ADMIN ONLY)
// ==========================================
// DELETE with query/body ?key=products/123.webp
router.delete(
  '/',
  verifyToken,
  AdminVerify,
  uploadController.deleteFile
);

// DELETE with key / fileId in params (supports path with slashes like /products/123.webp)
router.delete(
  '{/*fileId}',
  verifyToken,
  AdminVerify,
  uploadController.deleteFile
);

router.delete(
  '/:fileId',
  verifyToken,
  AdminVerify,
  uploadController.deleteFile
);

module.exports = router;
