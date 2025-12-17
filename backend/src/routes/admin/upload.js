// src/routes/admin/upload.js
const express = require('express');
const { upload } = require('../../middleware/uploadImages');

const router = express.Router();

/**
 * POST /admin/upload/images
 * Upload up to 10 images (unchanged).
 */
router.post('/images', upload.array('images', 10), (req, res) => {
  try {
    const files = Array.isArray(req.files) ? req.files : [];
    const urls = files.map(f => f.path);
    const publicIds = files.map(f => f.filename);

    return res.json({ urls, publicIds });
  } catch (err) {
    console.error('UPLOAD ROUTE ERROR:', err);
    return res.status(500).json({ error: 'Cloudinary upload failed' });
  }
});

/**
 * POST /admin/upload/image
 * Upload a SINGLE image (thumbnail).
 *
 * ✅ Fixed
 * ✅ No dependency on formatUploadResponse
 * ✅ No impact on other modules
 */
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    return res.json({
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error('SINGLE IMAGE UPLOAD ERROR:', err);
    return res.status(500).json({ error: 'Cloudinary upload failed' });
  }
});

module.exports = router;
