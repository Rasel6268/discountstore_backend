const express = require('express');
const upload = require('../middleware/upload.middleware');
const uploadController = require('../controllers/upload.controller');

const router = express.Router();

// Helper middleware to accept any field name ('image', 'file', 'images', etc.)
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

// GET /upload/auth - generate client-side auth tokens
router.get('/auth', uploadController.getAuthParams);

// POST /upload - upload single image
router.post('/', handleAnyFile, uploadController.uploadSingle);

// POST /upload/multiple - upload multiple images (up to 10)
router.post('/multiple', handleAnyFile, uploadController.uploadMultiple);

// DELETE /upload/:fileId - delete an uploaded file
router.delete('/:fileId', uploadController.deleteFile);

module.exports = router;
