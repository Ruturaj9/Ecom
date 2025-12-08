// src/routes/admin/productImages.js
const express = require('express');
const { upload, formatUploadResponse } = require('../../middleware/uploadImages');

const router = express.Router();

/**
 * POST /admin/products/upload/images
 * Upload up to 6 product-specific images.
 *
 * - Core logic preserved exactly.
 * - Standardized error handling.
 * - Ensures req.files is always an array.
 */
router.post('/images', upload.array('images', 6), (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const response = formatUploadResponse(req, files);

    return res.json(response);
  } catch (err) {
    console.error('PRODUCT IMAGES ERROR:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
