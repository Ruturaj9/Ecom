// src/routes/admin/upload.js
const express = require('express');
const { upload, formatUploadResponse } = require('../../middleware/uploadImages');

const router = express.Router();

/**
 * POST /admin/upload/images
 * Upload up to 10 images.
 *
 * - Core logic preserved exactly.
 * - Adds consistent error handling.
 * - Ensures req.files is always safely handled.
 */
router.post('/images', upload.array('images', 10), (req, res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const response = formatUploadResponse(req, files);

    return res.json(response);
  } catch (err) {
    console.error('UPLOAD ROUTE ERROR:', err);
    return res.status(500).json({ error: 'Cloudinary upload failed' });
  }
});

module.exports = router;
